import {
  type Address,
  type Hash,
  createPublicClient,
  getAddress,
  http,
} from 'viem';
import { ARC_PAYMENT_GATEWAY_ABI } from './abi';
import { DEFAULT_CHAIN_ID, DEFAULT_GATEWAY_ADDRESSES, SUPPORTED_CHAINS, arcMainnet } from './constants';
import type { VerificationResult, VerifyPaymentParams } from './types';
import { formatUsdc, parseUsdc } from './utils';

/**
 * Server-side Arc Payment Verification Engine
 * Queries Arc RPC directly to verify order settlement status, recipient, amount, age, and txHash in <50ms.
 *
 * @param params Verification parameters (orderId, merchant, expectedAmount, maxAgeSeconds, chainId, rpcUrl)
 * @returns VerificationResult
 */
export async function verifyArcPayment(
  params: VerifyPaymentParams
): Promise<VerificationResult> {
  const chainId = params.chainId || DEFAULT_CHAIN_ID;
  const chain = SUPPORTED_CHAINS[chainId] || arcMainnet;

  const contractAddress =
    params.contractAddress ||
    DEFAULT_GATEWAY_ADDRESSES[chainId] ||
    DEFAULT_GATEWAY_ADDRESSES[DEFAULT_CHAIN_ID];

  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(params.rpcUrl),
    });

    // 1. Fetch on-chain PaymentRecord
    const record = await publicClient.readContract({
      address: contractAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'getPayment',
      args: [params.orderId],
    });

    if (!record.isSettled) {
      return {
        isValid: false,
        isSettled: false,
        orderId: params.orderId,
        merchant: params.merchant,
        error: 'Order has not been settled on Arc Network.',
      };
    }

    // 2. Verify merchant address matches
    const expectedMerchant = getAddress(params.merchant);
    const settledMerchant = getAddress(record.merchant);

    if (expectedMerchant !== settledMerchant) {
      return {
        isValid: false,
        isSettled: true,
        orderId: params.orderId,
        merchant: record.merchant,
        payer: record.payer,
        amount: record.amount,
        error: `Merchant mismatch: expected ${expectedMerchant}, received ${settledMerchant}`,
      };
    }

    // 3. Verify amount matches or exceeds expected amount
    if (params.expectedAmount !== undefined) {
      const expectedAmountBigInt = parseUsdc(params.expectedAmount);
      if (record.amount < expectedAmountBigInt) {
        return {
          isValid: false,
          isSettled: true,
          orderId: params.orderId,
          merchant: record.merchant,
          payer: record.payer,
          amount: record.amount,
          error: `Amount mismatch: expected at least ${formatUsdc(expectedAmountBigInt)} USDC, received ${formatUsdc(record.amount)} USDC`,
        };
      }
    }

    // 4. Verify timestamp freshness if maxAgeSeconds is set
    const timestampNumber = Number(record.timestamp);
    if (params.maxAgeSeconds !== undefined && params.maxAgeSeconds > 0) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const ageSeconds = currentTimestamp - timestampNumber;
      if (ageSeconds > params.maxAgeSeconds) {
        return {
          isValid: false,
          isSettled: true,
          orderId: params.orderId,
          merchant: record.merchant,
          payer: record.payer,
          amount: record.amount,
          timestamp: timestampNumber,
          error: `Payment expired: settled ${ageSeconds}s ago (max allowed: ${params.maxAgeSeconds}s)`,
        };
      }
    }

    // 5. Query event logs to populate transaction hash & blockNumber
    let txHash: Hash | undefined;
    let blockNumber: bigint | undefined;

    try {
      const paymentEvent = ARC_PAYMENT_GATEWAY_ABI.find(
        (x) => x.type === 'event' && x.name === 'PaymentSettled'
      ) as any;

      if (paymentEvent) {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: paymentEvent,
          args: {
            orderId: params.orderId,
          },
          fromBlock: 'earliest',
        });

        if (logs && logs.length > 0) {
          txHash = logs[0].transactionHash;
          blockNumber = logs[0].blockNumber;
        }
      }
    } catch {
      // Event log lookup is non-blocking fallback
    }

    // Parse metadata
    let metadata: any = record.metadata;
    try {
      if (record.metadata) {
        metadata = JSON.parse(record.metadata);
      }
    } catch {
      metadata = record.metadata;
    }

    return {
      isValid: true,
      isSettled: true,
      orderId: params.orderId,
      merchant: record.merchant,
      payer: record.payer,
      amount: record.amount,
      formattedAmount: formatUsdc(record.amount),
      protocolFee: record.protocolFee,
      timestamp: timestampNumber,
      txHash,
      blockNumber,
      metadata,
    };
  } catch (err: any) {
    return {
      isValid: false,
      isSettled: false,
      orderId: params.orderId,
      merchant: params.merchant,
      error: `RPC Verification Error: ${err?.message || 'Unknown network error'}`,
    };
  }
}
