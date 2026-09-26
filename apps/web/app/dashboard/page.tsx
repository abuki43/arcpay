'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, useConnect, useReadContract } from 'wagmi';
import {
  ARC_PAYMENT_GATEWAY_ABI,
  BPS_DIVISOR,
  DEFAULT_GATEWAY_ADDRESSES,
  formatUsdc,
  getExplorerTxUrl,
  shortenAddress,
} from '@arcpay/sdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { useSettlementFeed } from '@/lib/use-settlement-feed';
import { type SettlementItem } from '@/lib/settlements';
import {
  Copy,
  Check,
  CreditCard,
  DollarSign,
  ExternalLink,
  Percent,
  Search,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

function SettlementTableRow({
  item,
  chainId,
  copiedId,
  onCopy,
}: {
  item: SettlementItem;
  chainId: number;
  copiedId: string | null;
  onCopy: (value: string, key: string) => void;
}) {
  return (
    <tr className="transition-colors hover:bg-muted/50">
      <td className="py-4 px-5">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-700/25 text-primary font-semibold text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Settled</span>
        </span>
      </td>
      <td className="py-4 px-5 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground">{item.orderId.slice(0, 10)}...</span>
          <button
            type="button"
            onClick={() => onCopy(item.orderId, item.orderId)}
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
      <td className="py-4 px-5 font-mono text-muted-foreground">
        {item.payer ? shortenAddress(item.payer) : '—'}
      </td>
      <td className="py-4 px-5">
        {item.kind === 'split' ? (
          <div className="flex flex-col gap-0.5">
            <Badge variant="outline" className="w-fit text-[10px]">
              Split
            </Badge>
            {item.affiliate && item.affiliateShare !== null && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {shortenAddress(item.affiliate)} +${formatUsdc(item.affiliateShare)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">Direct</span>
        )}
      </td>
      <td className="py-4 px-5 font-mono font-bold text-foreground text-sm tabular-nums">
        ${formatUsdc(item.gross)}{' '}
        <span className="text-xs font-normal text-muted-foreground">USDC</span>
      </td>
      <td className="py-4 px-5 font-mono text-primary tabular-nums">
        ${formatUsdc(item.protocolFee)}
      </td>
      <td className="py-4 px-5 font-mono text-foreground tabular-nums">
        ${formatUsdc(item.merchantShare)}
      </td>
      <td className="py-4 px-5 text-muted-foreground">
        {new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </td>
      <td className="py-4 px-5 text-right">
        <a
          href={getExplorerTxUrl(chainId, item.txHash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
        >
          <span>Explorer</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </td>
    </tr>
  );
}

export default function MerchantDashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const gatewayAddress =
    DEFAULT_GATEWAY_ADDRESSES[chainId] ?? DEFAULT_GATEWAY_ADDRESSES[5042002];

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { items: feed, isLoading, error } = useSettlementFeed({
    merchant: address,
    limit: 60,
  });

  const { data: netReceived } = useReadContract({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    functionName: 'merchantVolume',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address },
  });

  const { data: orderCount } = useReadContract({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    functionName: 'merchantTransactionCount',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address },
  });

  const { data: feeBps } = useReadContract({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    functionName: 'feeBps',
    chainId,
  });

  const kpis = useMemo(() => {
    const net = netReceived ?? 0n;
    const count = orderCount ?? 0n;
    const bps = feeBps ?? 40n;
    const divisor = 10_000n - bps;
    const gross = divisor > 0n ? (net * BigInt(BPS_DIVISOR)) / divisor : net;
    const fees = gross > net ? gross - net : 0n;
    return {
      net,
      gross,
      fees,
      count,
      avg: count > 0n ? net / count : 0n,
      feeRate: Number(bps) / 100,
    };
  }, [netReceived, orderCount, feeBps]);

  const filteredFeed = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return feed;
    return feed.filter(
      (item) =>
        item.orderId.toLowerCase().includes(term) ||
        (item.payer?.toLowerCase().includes(term) ?? false) ||
        item.merchant.toLowerCase().includes(term)
    );
  }, [feed, searchTerm]);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConnect = () => {
    if (connectors[0]) connect({ connector: connectors[0] });
  };

  // Guarded render tree
  if (!isConnected || !address) {
    return (
      <div className="pt-28 pb-16 min-h-[85vh] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-10 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="font-sentient text-2xl sm:text-3xl text-foreground tracking-tight">
              Open your merchant workspace
            </h1>
            <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-md mx-auto">
              Connect the wallet you receive payments to. Your workspace is scoped
              to your address — no database, no account creation. Everything reads
              straight from Arc Layer-1.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button onClick={handleConnect} className="gap-2">
                <Wallet className="w-4 h-4" />
                Connect wallet
              </Button>
              <Link href="/create">
                <Button variant="outline" className="gap-2">
                  <Zap className="w-4 h-4 fill-primary" />
                  Create a PayLink
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 min-h-[85vh] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="text-xs" variant="secondary">
                Merchant workspace · {shortenAddress(address)}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-primary font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Live event stream</span>
              </span>
            </div>
            <h1 className="font-sentient text-3xl text-foreground tracking-tight">
              Sales dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your settlements indexed from Arc Layer-1 — owner-scoped, zero-database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/create">
              <Button size="sm" className="text-xs font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-white" />
                Create a PayLink
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KpiCard
            label="Net received"
            value={`$${formatUsdc(kpis.net)} USDC`}
            sub="Settled to your wallet · net of protocol fee"
            icon={<DollarSign className="w-4 h-4" />}
            accent
          />
          <KpiCard
            label="Orders settled"
            value={kpis.count.toString()}
            sub="Zero chargeback risk"
            icon={<CreditCard className="w-4 h-4" />}
          />
          <KpiCard
            label="Average order"
            value={`$${formatUsdc(kpis.avg)}`}
            sub="Gross per settled order"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <KpiCard
            label={`Protocol fee (${kpis.feeRate.toFixed(2)}%)`}
            value={`$${formatUsdc(kpis.fees)} USDC`}
            sub="Deducted on-chain · no interchange tiers"
            icon={<Percent className="w-4 h-4" />}
          />
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-sentient text-foreground">
                Settlement feed
              </h2>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? 'Reading recent activity from Arc Layer-1...'
                  : `${feed.length} settlement${feed.length === 1 ? '' : 's'} in view · per-order, split-aware`}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order or payer..."
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
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Order ID</th>
                  <th className="py-3.5 px-5">Payer</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Fee (0.4%)</th>
                  <th className="py-3.5 px-5">Net to you</th>
                  <th className="py-3.5 px-5">Time</th>
                  <th className="py-3.5 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-muted-foreground">
                {filteredFeed.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="text-muted-foreground">
                        {kpis.count === 0n
                          ? 'No settlements yet. Create a PayLink to start collecting payments.'
                          : 'No matching settlements found.'}
                      </div>
                      {kpis.count === 0n && (
                        <Link href="/create" className="inline-flex mt-4">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Zap className="w-3.5 h-3.5 fill-primary" />
                            Create a PayLink
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredFeed.map((item) => (
                    <SettlementTableRow
                      key={item.orderId}
                      item={item}
                      chainId={chainId || 5042002}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                    />
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