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
import { useSettlementFeed } from '@/lib/use-settlement-feed';
import {
  Activity,
  Copy,
  Check,
  DollarSign,
  ExternalLink,
  Percent,
  PieChart,
  Search,
  ShieldCheck,
} from 'lucide-react';

export default function NetworkStatsPage() {
  const chainId = useChainId();
  const gatewayAddress =
    DEFAULT_GATEWAY_ADDRESSES[chainId] ?? DEFAULT_GATEWAY_ADDRESSES[5042002];

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

  const { items: feed, isLoading, error } = useSettlementFeed({ limit: 30 });

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
        item.merchant.toLowerCase().includes(term)
    );
  }, [feed, searchTerm]);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="pt-28 pb-16 min-h-[85vh] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="text-xs" variant="secondary">
                ArcPay in aggregate
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-primary font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Live on-chain</span>
              </span>
            </div>
            <h1 className="font-sentient text-3xl text-foreground tracking-tight">
              Network analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Protocol-wide volume, fees and settlements — read from the gateway
              contract, no database.
            </p>
          </div>
        </div>

        {/* Privacy framing */}
        <div className="mb-8 p-4 rounded-2xl border border-border bg-card flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Aggregate data only. The network page shows totals and anonymous
            settlement amounts — it never exposes payer identities, order
            metadata, or split breakdowns.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
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
            sub="Net settled to merchants + affiliates"
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

        {/* Activity Feed */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-sentient text-foreground">
                Recent settlements
              </h2>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Reading recent activity from Arc Layer-1...'
                  : `${feed.length} recent settlement${feed.length === 1 ? '' : 's'} · amounts only`}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search merchant or order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-white/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <div className="px-5 py-3 text-xs text-rose-600 bg-rose-50 border-b border-rose-200">
              Could not backfill history ({error.message}). Live updates continue
              while this page is open.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-white/60 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Fee</th>
                  <th className="py-3.5 px-5">Merchant</th>
                  <th className="py-3.5 px-5">Order</th>
                  <th className="py-3.5 px-5">Time</th>
                  <th className="py-3.5 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-muted-foreground">
                {filteredFeed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No matching settlements found.
                    </td>
                  </tr>
                ) : (
                  filteredFeed.map((item) => (
                    <tr key={item.orderId} className="transition-colors hover:bg-muted/50">
                      <td className="py-4 px-5 font-mono font-bold text-foreground text-sm tabular-nums">
                        ${formatUsdc(item.gross)}{' '}
                        <span className="text-xs font-normal text-muted-foreground">USDC</span>
                      </td>
                      <td className="py-4 px-5 font-mono text-primary tabular-nums">
                        ${formatUsdc(item.protocolFee)}
                      </td>
                      <td className="py-4 px-5 font-mono text-foreground">
                        {shortenAddress(item.merchant)}
                      </td>
                      <td className="py-4 px-5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{item.orderId.slice(0, 10)}...</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.orderId, item.orderId)}
                            className="text-muted-foreground hover:text-primary"
                            title="Copy order ID"
                          >
                            {copiedId === item.orderId ? (
                              <Check className="w-3 h-3 text-primary" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <a
                          href={getExplorerTxUrl(chainId || 5042002, item.txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
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
      </div>
    </div>
  );
}