import type { Address, Hash } from 'viem';

export type SettlementKind = 'direct' | 'split';

/**
 * Normalized on-chain settlement row shared by the dashboard and network pages.
 */
export interface SettlementItem {
  orderId: `0x${string}`;
  merchant: Address;
  payer: Address | null;
  /** Gross amount charged to the payer (18-decimal USDC) */
  gross: bigint;
  /** Protocol fee deducted (18-decimal USDC) */
  protocolFee: bigint;
  /** Amount routed to the merchant (gross - fee, or the split merchant share) */
  merchantShare: bigint;
  affiliate: Address | null;
  affiliateShare: bigint | null;
  kind: SettlementKind;
  /** Epoch milliseconds */
  timestamp: number;
  txHash: Hash;
  blockNumber: bigint;
}

function asBigint(value: unknown, fallback = 0n): bigint {
  return typeof value === 'bigint' ? value : fallback;
}

function asHex(value: unknown, fallback: `0x${string}` | null): `0x${string}` | null {
  return typeof value === 'string' && value.startsWith('0x') ? (value as `0x${string}`) : fallback;
}

/**
 * Builds a raw settlement item from a PaymentSettled event log.
 */
export function fromPaymentSettled(
  args: Record<string, unknown>,
  txHash: Hash,
  blockNumber: bigint
): SettlementItem {
  const gross = asBigint(args.amount);
  const protocolFee = asBigint(args.protocolFee);
  return {
    orderId: args.orderId as `0x${string}`,
    merchant: args.merchant as Address,
    payer: asHex(args.payer, null),
    gross,
    protocolFee,
    merchantShare: gross - protocolFee,
    affiliate: null,
    affiliateShare: null,
    kind: 'direct',
    timestamp: Number(asBigint(args.timestamp)) * 1000,
    txHash,
    blockNumber,
  };
}

/**
 * Builds a raw settlement item from a PaymentSplitSettled event log.
 * Gross is reconstructed (merchant share + affiliate share + fee) since it is
 * the "canonical" row for a split order.
 */
export function fromSplitSettled(
  args: Record<string, unknown>,
  txHash: Hash,
  blockNumber: bigint
): SettlementItem {
  const merchantShare = asBigint(args.merchantAmount);
  const affiliateShare = asBigint(args.affiliateAmount);
  const protocolFee = asBigint(args.protocolFee);
  return {
    orderId: args.orderId as `0x${string}`,
    merchant: args.merchant as Address,
    payer: asHex(args.payer, null),
    gross: merchantShare + affiliateShare + protocolFee,
    protocolFee,
    merchantShare,
    affiliate: asHex(args.affiliate, null),
    affiliateShare,
    kind: 'split',
    timestamp: Number(asBigint(args.timestamp)) * 1000,
    txHash,
    blockNumber,
  };
}

/**
 * Groups raw items by orderId (splits emit both events) and returns one row per
 * order, split-detail preferred, newest first, capped at `limit`.
 */
export function mergeSettlements(items: SettlementItem[], limit: number): SettlementItem[] {
  const byOrderId = new Map<string, SettlementItem>();

  for (const item of items) {
    const key = item.orderId.toLowerCase();
    const existing = byOrderId.get(key);
    if (!existing || (existing.kind === 'direct' && item.kind === 'split')) {
      byOrderId.set(key, item);
    }
  }

  return Array.from(byOrderId.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}