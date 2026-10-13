'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Address, Hash } from 'viem';

export interface NetworkSettlement {
  id: string;
  orderId: string;
  merchant: string;
  payer: string | null;
  gross: string;
  protocolFee: string;
  merchantShare: string;
  affiliate: string | null;
  affiliateShare: string | null;
  kind: 'direct' | 'split';
  txHash: string;
  blockNumber: string;
  timestamp: number;
  payLinkTitle: string | null;
  payLinkSlug: string | null;
  planName: string | null;
}

interface ApiResponse {
  settlements: NetworkSettlement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface UseNetworkSettlementsOptions {
  limit?: number;
  /** Auto-refresh interval in ms. Default 10s. */
  refreshIntervalMs?: number;
}

export function useNetworkSettlements({
  limit = 30,
  refreshIntervalMs = 10_000,
}: UseNetworkSettlementsOptions = {}) {
  const [settlements, setSettlements] = useState<NetworkSettlement[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const isFetching = useRef(false);

  const fetchPage = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(`/api/settlements?limit=${limit}&page=1`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setSettlements(data.settlements ?? []);
      setTotal(data.pagination?.total ?? 0);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [limit]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchPage();

    const tick = setInterval(() => {
      if (!cancelled) fetchPage();
    }, refreshIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [fetchPage, refreshIntervalMs]);

  return {
    settlements,
    total,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchPage,
  };
}
