'use client';

import React, { useMemo, useState } from 'react';
import { useChainId, useReadContract } from 'wagmi';
import {
  ARC_PAYMENT_GATEWAY_ABI,
  DEFAULT_GATEWAY_ADDRESSES,
  formatUsdc,
  getExplorerTxUrl,
  shortenAddress,
} from '@arcpay/sdk';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/kpi-card';
import { Eyebrow } from '@/components/eyebrow';
import { Reveal } from '@/components/motion';
import { Input } from '@/components/ui/input';
import { useNetworkSettlements } from '@/lib/use-network-settlements';
import {
  Activity,
  Copy,
  Check,
  DollarSign,
  ExternalLink,
  Percent,
  PieChart,
  RefreshCcw,
  Search,
} from 'lucide-react';

export default function NetworkStatsPage() {
  const chainId = useChainId();
  const gatewayAddress =
    DEFAULT_GATEWAY_ADDRESSES[chainId] ?? DEFAULT_GATEWAY_ADDRESSES[5042002];

  // Protocol-wide totals still come from the contract — single-value reads are cheap
  // and represent the on-chain source of truth. The settlement feed table switches
  // to the indexer-backed API for fast, paginated, searchable history.
  const { data: totalVolume } = useReadContract({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    functionName: 'totalVolume',
    chainId,
    query: { refetchInterval: 15_000 },
  });
  const { data: totalFees } = useReadContract({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    functionName: 'totalProtocolFees',
    chainId,
    query: { refetchInterval: 15_000 },
  });
  const { data: totalTxs } = useReadContract({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    functionName: 'totalTransactions',
    chainId,
    query: { refetchInterval: 15_000 },
  });

  const {
    settlements: feed,
    total: indexedTotal,
    isLoading,
    error,
    lastUpdated,
    refresh,
  } = useNetworkSettlements({ limit: 30, refreshIntervalMs: 10_000 });

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const gross = totalVolume ?? 0n;
  const fees = totalFees ?? 0n;
  const txs = totalTxs ?? 0n;
  const netDistributed = gross > fees ? gross - fees : 0n;
  const effectiveRate = gross > 0n ? (Number(fees) * 100) / Number(gross) : 0;

  const filteredFeed = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return feed;
    return feed.filter(
      (item) =>
        item.orderId.toLowerCase().includes(term) ||
        item.merchant.toLowerCase().includes(term),
    );
  }, [feed, searchTerm]);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updatedAgo = lastUpdated
    ? `${Math.max(1, Math.round((Date.now() - lastUpdated) / 1000))}s ago`
    : null;

  return (
    <div className="pt-28 pb-20 min-h-[85vh] relative">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <Reveal className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary">ArcPay · aggregate</Badge>
            <span className="inline-flex items-center gap-1.5 text-tiny text-accent font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-accent arc-pulse" />
              Indexed from Arc
            </span>
          </div>
          <Eyebrow className="mb-4">Network analytics</Eyebrow>
          <h1 className="text-h1 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Protocol-wide{' '}
            <span className="font-medium italic text-accent">volume</span>.
          </h1>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-ctl overflow-hidden mb-10">
          <KpiCard
            label="Gross volume"
            value={`$${formatUsdc(gross)} USDC`}
            sub="Native USDC, pure gas"
            icon={<DollarSign className="w-4 h-4" />}
            accent
          />
          <KpiCard
            label="Merchants paid"
            value={`$${formatUsdc(netDistributed)} USDC`}
            sub="Net settled to merchants"
            icon={<PieChart className="w-4 h-4" />}
          />
          <KpiCard
            label="Payments settled"
            value={txs.toString()}
            sub="Sub-second finality"
            icon={<Activity className="w-4 h-4" />}
          />
          <KpiCard
            label={`Protocol fees (${effectiveRate.toFixed(2)}%)`}
            value={`$${formatUsdc(fees)} USDC`}
            sub="0.40% flat · routed to treasury"
            icon={<Percent className="w-4 h-4" />}
          />
        </div>

        <Reveal>
          <div className="rounded-ctl border border-line bg-surface overflow-hidden">
            <div className="p-5 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-h6 font-medium text-ink">Recent settlements</h2>
                <p className="text-tiny text-ink-3">
                  {isLoading
                    ? 'Loading indexed activity…'
                    : `${indexedTotal.toLocaleString()} indexed · showing ${feed.length} · amounts only`}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {updatedAgo && (
                  <span className="text-nano font-mono text-ink-3 hidden sm:inline">
                    updated {updatedAgo}
                  </span>
                )}
                <button
                  type="button"
                  onClick={refresh}
                  className="p-1.5 rounded-ctl border border-line bg-canvas text-ink-2 hover:text-ink hover:border-line-strong transition-colors"
                  title="Refresh"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex-1 sm:w-64 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search merchant or order…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="px-5 py-3 text-tiny text-danger bg-danger/10 border-b border-danger/20">
                Could not load indexed history ({error.message}). Retrying every 10s.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-raised text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
                    <th className="py-3.5 px-5 font-medium">Amount</th>
                    <th className="py-3.5 px-5 font-medium">Fee</th>
                    <th className="py-3.5 px-5 font-medium">Merchant</th>
                    <th className="py-3.5 px-5 font-medium">Order</th>
                    <th className="py-3.5 px-5 font-medium">Time</th>
                    <th className="py-3.5 px-5 font-medium text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-tiny text-ink-2 font-mono">
                  {isLoading && feed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-3">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredFeed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-ink-3">
                        {indexedTotal === 0
                          ? 'No settlements indexed yet. The indexer writes to this table in real time.'
                          : 'No matching settlements found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredFeed.map((item) => (
                      <tr key={item.orderId} className="hover:bg-raised/50 transition-colors">
                        <td className="py-3.5 px-5 font-medium text-ink tabular-nums">
                          ${formatUsdc(BigInt(item.gross))}{' '}
                          <span className="text-ink-3">USDC</span>
                        </td>
                        <td className="py-3.5 px-5 text-accent tabular-nums">
                          ${formatUsdc(BigInt(item.protocolFee))}
                        </td>
                        <td className="py-3.5 px-5 text-ink">
                          {shortenAddress(item.merchant as `0x${string}`)}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-1.5">
                            <span>{item.orderId.slice(0, 10)}…</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.orderId, item.orderId)}
                              className="text-ink-3 hover:text-accent"
                              title="Copy order ID"
                            >
                              {copiedId === item.orderId ? (
                                <Check className="w-3 h-3 text-accent" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-ink-3">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <a
                            href={getExplorerTxUrl(chainId || 5042002, item.txHash as `0x${string}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:text-accent-2"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
