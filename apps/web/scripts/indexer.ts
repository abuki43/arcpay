/**
 * ArcPay settlement indexer.
 *
 * Polls the ArcPaymentGateway contract for `PaymentSettled` and
 * `PaymentSplitSettled` events, writes them into PostgreSQL via Prisma,
 * and dispatches webhooks for any merchant that has one configured.
 *
 * Runs as a foreground process (system cron, Vercel cron wrapper, or `pnpm indexer`).
 * Idempotent: upserts on `orderId`, so re-runs are safe.
 *
 * Env vars (all optional; defaults shown):
 *   CHAIN_ID            5042002 (Arc Testnet) or 5042 (Arc Mainnet)
 *   RPC_URL             Falls back to NEXT_PUBLIC_ARC_*_RPC_URL, then chain default
 *   CONTRACT_ADDRESS    Falls back to DEFAULT_GATEWAY_ADDRESSES[CHAIN_ID]
 *   START_BLOCK         0 (set this to skip genesis backfill on a busy chain)
 *   POLL_INTERVAL_MS    2000 (Arc has ~600ms blocks; 2s is plenty)
 *   CHUNK_SIZE          10 (blocks per getLogs call; Alchemy free tier caps at 10)
 */
import {
  createPublicClient,
  http,
  parseAbiItem,
  type Address,
  type Hash,
} from 'viem';
import {
  arcTestnet,
  arcMainnet,
  DEFAULT_GATEWAY_ADDRESSES,
} from '@arcpay/sdk';
import { prisma } from '../lib/db';
import { dispatchMerchantWebhook } from '../lib/webhook-dispatcher';

const CHAIN_ID = parseInt(process.env.CHAIN_ID || '5042002', 10);
const RPC_URL =
  process.env.RPC_URL ||
  (CHAIN_ID === 5042
    ? process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL
    : process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL);
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS ||
  DEFAULT_GATEWAY_ADDRESSES[CHAIN_ID] ||
  DEFAULT_GATEWAY_ADDRESSES[5042002]) as Address;
const START_BLOCK = BigInt(process.env.START_BLOCK || '0');
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '2000', 10);
const CHUNK_SIZE = BigInt(parseInt(process.env.CHUNK_SIZE || '10', 10));

const CHAIN = CHAIN_ID === 5042 ? arcMainnet : arcTestnet;

const PAYMENT_SETTLED_EVENT = parseAbiItem(
  'event PaymentSettled(bytes32 indexed orderId, address indexed merchant, address indexed payer, uint256 amount, uint256 protocolFee, string metadata, uint256 timestamp)',
);
const PAYMENT_SPLIT_SETTLED_EVENT = parseAbiItem(
  'event PaymentSplitSettled(bytes32 indexed orderId, address indexed merchant, address indexed affiliate, address payer, uint256 merchantAmount, uint256 affiliateAmount, uint256 protocolFee, string metadata, uint256 timestamp)',
);

const client = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

const CURSOR_ID = 'main';

interface UpsertArgs {
  orderId: string;
  merchantAddress: string;
  payerAddress: string | null;
  gross: bigint;
  protocolFee: bigint;
  merchantShare: bigint;
  affiliateAddress: string | null;
  affiliateShare: bigint | null;
  kind: 'direct' | 'split';
  txHash: string;
  blockNumber: bigint;
  metadata: string;
  timestamp: Date;
}

async function ensureMerchant(address: string): Promise<void> {
  await prisma.merchant.upsert({
    where: { address: address.toLowerCase() },
    update: {},
    create: { address: address.toLowerCase() },
  });
}

function buildWebhookData(settlement: UpsertArgs) {
  const fmt = (v: bigint) => (Number(v) / 1e18).toFixed(2);
  return {
    orderId: settlement.orderId,
    txHash: settlement.txHash,
    blockNumber: settlement.blockNumber.toString(),
    merchant: settlement.merchantAddress,
    payer: settlement.payerAddress,
    grossUsdc: fmt(settlement.gross),
    protocolFeeUsdc: fmt(settlement.protocolFee),
    merchantShareUsdc: fmt(settlement.merchantShare),
    affiliate: settlement.affiliateAddress,
    affiliateShareUsdc: settlement.affiliateShare ? fmt(settlement.affiliateShare) : null,
  };
}

async function processLog(
  log: { args: any; transactionHash: Hash; blockNumber: bigint },
  kind: 'direct' | 'split',
): Promise<void> {
  const orderId = log.args.orderId as string;
  const merchantAddress = (log.args.merchant as string).toLowerCase();
  const payer = log.args.payer ? (log.args.payer as string).toLowerCase() : null;
  const protocolFee = log.args.protocolFee as bigint;
  const metadata = (log.args.metadata as string) ?? '';
  const timestamp = new Date(Number(log.args.timestamp as bigint) * 1000);

  let gross: bigint;
  let merchantShare: bigint;
  let affiliateAddress: string | null = null;
  let affiliateShare: bigint | null = null;

  if (kind === 'direct') {
    gross = log.args.amount as bigint;
    merchantShare = gross - protocolFee;
  } else {
    merchantShare = log.args.merchantAmount as bigint;
    affiliateAddress = (log.args.affiliate as string).toLowerCase();
    affiliateShare = log.args.affiliateAmount as bigint;
    gross = merchantShare + affiliateShare + protocolFee;
  }

  await ensureMerchant(merchantAddress);
  if (affiliateAddress) await ensureMerchant(affiliateAddress);

  const data: UpsertArgs = {
    orderId,
    merchantAddress,
    payerAddress: payer,
    gross,
    protocolFee,
    merchantShare,
    affiliateAddress,
    affiliateShare,
    kind,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    metadata,
    timestamp,
  };

  await prisma.settlement.upsert({
    where: { orderId },
    update: {
      merchantAddress: data.merchantAddress,
      payerAddress: data.payerAddress,
      gross: data.gross.toString(),
      protocolFee: data.protocolFee.toString(),
      merchantShare: data.merchantShare.toString(),
      affiliateAddress: data.affiliateAddress,
      affiliateShare: data.affiliateShare?.toString() ?? null,
      kind: data.kind,
      txHash: data.txHash,
      blockNumber: data.blockNumber,
      metadata: data.metadata || null,
      timestamp: data.timestamp,
    },
    create: {
      orderId: data.orderId,
      merchantAddress: data.merchantAddress,
      payerAddress: data.payerAddress,
      gross: data.gross.toString(),
      protocolFee: data.protocolFee.toString(),
      merchantShare: data.merchantShare.toString(),
      affiliateAddress: data.affiliateAddress,
      affiliateShare: data.affiliateShare?.toString() ?? null,
      kind: data.kind,
      txHash: data.txHash,
      blockNumber: data.blockNumber,
      metadata: data.metadata || null,
      status: 'settled',
      timestamp: data.timestamp,
    },
  });

  await dispatchMerchantWebhook(
    data.merchantAddress,
    kind === 'split' ? 'payment.split_settled' : 'payment.settled',
    buildWebhookData(data),
  );
}

async function pollChunk(fromBlock: bigint, toBlock: bigint): Promise<number> {
  const [directLogs, splitLogs] = await Promise.all([
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: PAYMENT_SETTLED_EVENT,
      fromBlock,
      toBlock,
    }),
    client.getLogs({
      address: CONTRACT_ADDRESS,
      event: PAYMENT_SPLIT_SETTLED_EVENT,
      fromBlock,
      toBlock,
    }),
  ]);

  for (const log of directLogs) {
    await processLog(log, 'direct');
  }
  for (const log of splitLogs) {
    await processLog(log, 'split');
  }

  return directLogs.length + splitLogs.length;
}

async function pollRange(fromBlock: bigint, toBlock: bigint): Promise<number> {
  let total = 0;
  let cursor = fromBlock;
  while (cursor <= toBlock) {
    const chunkEnd = cursor + CHUNK_SIZE - 1n > toBlock ? toBlock : cursor + CHUNK_SIZE - 1n;
    total += await pollChunk(cursor, chunkEnd);
    cursor = chunkEnd + 1n;
  }
  return total;
}

async function main(): Promise<void> {
  console.log(
    `[indexer] chain=${CHAIN_ID} (${CHAIN.name}) contract=${CONTRACT_ADDRESS} rpc=${RPC_URL ?? 'chain default'}`,
  );

  let cursor = await prisma.indexerCursor.findUnique({ where: { id: CURSOR_ID } });
  if (!cursor) {
    cursor = await prisma.indexerCursor.create({
      data: { id: CURSOR_ID, lastBlock: START_BLOCK },
    });
    console.log(`[indexer] cursor created at block ${START_BLOCK}`);
  } else {
    console.log(`[indexer] resuming from block ${cursor.lastBlock}`);
  }

  let backoff = POLL_INTERVAL_MS;
  const MAX_BACKOFF = 30_000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const latest = await client.getBlockNumber();

      if (latest < cursor.lastBlock) {
        console.warn(
          `[indexer] chain reorg detected (latest=${latest} < cursor=${cursor.lastBlock}); pausing`,
        );
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      if (latest === cursor.lastBlock) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      const fromBlock = cursor.lastBlock + 1n;
      const toBlock: bigint = latest;
      const count = await pollRange(fromBlock, toBlock);

      cursor = await prisma.indexerCursor.update({
        where: { id: CURSOR_ID },
        data: {
          lastBlock: toBlock,
          lastRunAt: new Date(),
          lastEventCount: count,
        },
      });

      console.log(
        `[indexer] indexed ${fromBlock} → ${toBlock} (${count} events) — ${new Date().toISOString()}`,
      );

      backoff = POLL_INTERVAL_MS;
    } catch (err) {
      console.error('[indexer] error:', err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, backoff));
      backoff = Math.min(backoff * 2, MAX_BACKOFF);
    }
  }
}

main().catch((err) => {
  console.error('[indexer] fatal:', err);
  process.exit(1);
});
