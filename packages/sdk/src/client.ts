import {
  type Address,
  type PublicClient,
  createPublicClient,
  http,
} from 'viem';
import { ARC_PAYMENT_GATEWAY_ABI } from './abi';
import { DEFAULT_GATEWAY_ADDRESSES, SUPPORTED_CHAINS, arcTestnet } from './constants';
import type { PaymentRecord } from './types';
import { parseUsdc } from './utils';

export interface ArcPayClientConfig {
  chainId?: number;
  rpcUrl?: string;
  contractAddress?: Address;
}

/**
 * High-level TypeScript client for ArcPaymentGateway
 */
export class ArcPayClient {
  public readonly chainId: number;
  public readonly contractAddress: Address;
  public readonly publicClient: PublicClient;

  constructor(config: ArcPayClientConfig = {}) {
    this.chainId = config.chainId || 5042002;
    const chain = SUPPORTED_CHAINS[this.chainId] || arcTestnet;

    this.contractAddress =
      config.contractAddress ||
      DEFAULT_GATEWAY_ADDRESSES[this.chainId] ||
      DEFAULT_GATEWAY_ADDRESSES[5042002];

    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Retrieves an on-chain PaymentRecord by orderId
   */
  async getPayment(orderId: `0x${string}`): Promise<PaymentRecord> {
    const raw = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'getPayment',
      args: [orderId],
    });

    return {
      orderId: raw.orderId,
      merchant: raw.merchant,
      payer: raw.payer,
      token: raw.token,
      amount: raw.amount,
      protocolFee: raw.protocolFee,
      timestamp: raw.timestamp,
      isSettled: raw.isSettled,
      metadata: raw.metadata,
    };
  }

  /**
   * Checks if an orderId has been settled
   */
  async isOrderPaid(orderId: `0x${string}`): Promise<boolean> {
    return (await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'isOrderPaid',
      args: [orderId],
    })) as boolean;
  }

  /**
   * Computes protocol fee on-chain for a gross amount
   */
  async calculateFee(
    grossAmount: number | string | bigint
  ): Promise<{ protocolFee: bigint; netAmount: bigint }> {
    const gross = parseUsdc(grossAmount);
    const [protocolFee, netAmount] = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'calculateFee',
      args: [gross],
    });

    return { protocolFee, netAmount };
  }

  /**
   * Retrieves total volume processed by the gateway
   */
  async getTotalVolume(): Promise<bigint> {
    return (await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'totalVolume',
    })) as bigint;
  }

  /**
   * Retrieves merchant volume processed
   */
  async getMerchantVolume(merchant: Address): Promise<bigint> {
    return (await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ARC_PAYMENT_GATEWAY_ABI,
      functionName: 'merchantVolume',
      args: [merchant],
    })) as bigint;
  }
}
