'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAbiItem, type Address } from 'viem';
import { useChainId, usePublicClient, useWatchContractEvent } from 'wagmi';
import { ARC_PAYMENT_GATEWAY_ABI, DEFAULT_GATEWAY_ADDRESSES } from '@arcpay/sdk';
import {
  fromPaymentSettled,
  fromSplitSettled,
  mergeSettlements,
  type SettlementItem,
} from './settlements';

/** How far back to scan for historical settlements on page load. */
const DEFAULT_WINDOW_BLOCKS = 50_000n;

/** RPC nodes cap getLogs range; scan in safe chunks instead of one big call. */
const SCAN_CHUNK_BLOCKS = 2_000n;

const paymentSettledEvent = getAbiItem({
  abi: ARC_PAYMENT_GATEWAY_ABI,
  name: 'PaymentSettled',
});

const splitSettledEvent = getAbiItem({
  abi: ARC_PAYMENT_GATEWAY_ABI,
  name: 'PaymentSplitSettled',
});

export interface SettlementFeedOptions {
  /** Restrict to a specific merchant (owner workspace). Omit for the whole network. */
  merchant?: Address;
  limit?: number;
  windowBlocks?: bigint;
}

/**
 * Zero-database settlement feed. Backfills recent on-chain history on mount
 * and subscribes to live PaymentSettled / PaymentSplitSettled logs.
 * Splits emit both events for one order; `mergeSettlements` collapses them.
 */
export function useSettlementFeed({
  merchant,
  limit = 50,
  windowBlocks = DEFAULT_WINDOW_BLOCKS,
}: SettlementFeedOptions = {}) {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const gatewayAddress =
    DEFAULT_GATEWAY_ADDRESSES[chainId] ?? DEFAULT_GATEWAY_ADDRESSES[5042002];

  const [items, setItems] = useState<SettlementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const byOrderId = useRef(new Map<string, SettlementItem>());

  const commit = useCallback(
    (next: SettlementItem[]) => {
      for (const item of next) {
        const key = item.orderId.toLowerCase();
        const existing = byOrderId.current.get(key);
        // Split events carry richer breakdown; prefer them over the gross event.
        if (!existing || (existing.kind === 'direct' && item.kind === 'split')) {
          byOrderId.current.set(key, item);
        }
      }
      setItems(mergeSettlements(Array.from(byOrderId.current.values()), limit));
    },
    [limit]
  );

  // Backfill recent history so the feed is not tied to page-load time.
  // Paginates newest-first in safe chunks: nodes reject oversized getLogs ranges.
  useEffect(() => {
    let cancelled = false;
    if (!publicClient) return;

    byOrderId.current = new Map();
    setItems([]);
    setIsLoading(true);
    setError(null);

    (async () => {
      const best = new Map<string, SettlementItem>();
      let anyChunkFailed = false;

      const absorb = (items: SettlementItem[]) => {
        for (const item of items) {
          const key = item.orderId.toLowerCase();
          const existing = best.get(key);
          // Split events carry richer breakdown; prefer them over the gross event.
          if (!existing || (existing.kind === 'direct' && item.kind === 'split')) {
            best.set(key, item);
          }
        }
      };

      try {
        const latest = await publicClient.getBlockNumber();
        let nextTo = latest;
        let scannedBlocks = 0n;

        while (scannedBlocks < windowBlocks && nextTo > 0n) {
          const fromBlock =
            nextTo >= SCAN_CHUNK_BLOCKS + 1n
              ? nextTo - SCAN_CHUNK_BLOCKS
              : 0n;

          try {
            const [settledLogs, splitLogs] = await Promise.all([
              publicClient.getLogs({
                address: gatewayAddress,
                event: paymentSettledEvent,
                args: merchant ? { merchant } : undefined,
                fromBlock,
                toBlock: nextTo,
              }),
              publicClient.getLogs({
                address: gatewayAddress,
                event: splitSettledEvent,
                args: merchant ? { merchant } : undefined,
                fromBlock,
                toBlock: nextTo,
              }),
            ]);

            absorb([
              ...settledLogs.map((log) =>
                fromPaymentSettled(log.args, log.transactionHash, log.blockNumber ?? 0n)
              ),
              ...splitLogs.map((log) =>
                fromSplitSettled(log.args, log.transactionHash, log.blockNumber ?? 0n)
              ),
            ]);
          } catch {
            anyChunkFailed = true;
          }

          // Enough recent evidence: stop scanning older blocks.
          if (best.size >= limit * 2) break;

          scannedBlocks += fromBlock === 0n ? nextTo + 1n : SCAN_CHUNK_BLOCKS;
          if (fromBlock === 0n) break;
          nextTo = fromBlock - 1n;
        }

        if (!cancelled) commit(Array.from(best.values()));
        if (!cancelled && best.size === 0 && anyChunkFailed) {
          setError(new Error('Could not scan recent settlement history on this RPC node.'));
        }
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicClient, gatewayAddress, windowBlocks, limit, merchant, commit]);

  // Live stream: direct settlements.
  useWatchContractEvent({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    eventName: 'PaymentSettled',
    chainId,
    args: merchant ? { merchant } : undefined,
    onLogs: (logs) =>
      commit(
        logs.map((log) =>
          fromPaymentSettled(log.args, log.transactionHash, log.blockNumber ?? 0n)
        )
      ),
  });

  // Live stream: split settlements.
  useWatchContractEvent({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    eventName: 'PaymentSplitSettled',
    chainId,
    args: merchant ? { merchant } : undefined,
    onLogs: (logs) =>
      commit(
        logs.map((log) =>
          fromSplitSettled(log.args, log.transactionHash, log.blockNumber ?? 0n)
        )
      ),
  });

  return { items, isLoading, error };
}