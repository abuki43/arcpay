'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { KpiCard } from '@/components/kpi-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getExplorerTxUrl, shortenAddress } from '@arcpay/sdk';
import {
  Check,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Percent,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { SettlementRow } from './types';

interface OverviewTabProps {
  settlements: SettlementRow[];
  isLoading: boolean;
  onRefresh: () => void;
  chainId: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  copiedId: string | null;
  onCopy: (value: string, key: string) => void;
  onExportCsv: () => void;
}

export function OverviewTab({
  settlements,
  isLoading,
  onRefresh,
  chainId,
  searchTerm,
  setSearchTerm,
  copiedId,
  onCopy,
  onExportCsv,
}: OverviewTabProps) {
  const kpis = useMemo(() => {
    const totalGrossWei = settlements.reduce((acc, s) => acc + BigInt(s.gross), 0n);
    const totalNetWei = settlements.reduce((acc, s) => acc + BigInt(s.merchantShare), 0n);
    const totalFeeWei = settlements.reduce((acc, s) => acc + BigInt(s.protocolFee), 0n);
    const count = BigInt(settlements.length);
    return {
      grossUsdc: (Number(totalGrossWei) / 1e18).toFixed(2),
      netUsdc: (Number(totalNetWei) / 1e18).toFixed(2),
      feeUsdc: (Number(totalFeeWei) / 1e18).toFixed(2),
      count: count.toString(),
      avgUsdc: count > 0n ? (Number(totalNetWei / count) / 1e18).toFixed(2) : '0.00',
    };
  }, [settlements]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return settlements;
    return settlements.filter(
      (s) =>
        s.orderId.toLowerCase().includes(term) ||
        (s.payer?.toLowerCase().includes(term) ?? false) ||
        s.txHash.toLowerCase().includes(term) ||
        (s.buyerEmail?.toLowerCase().includes(term) ?? false) ||
        (s.payLinkTitle?.toLowerCase().includes(term) ?? false)
    );
  }, [settlements, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-ctl overflow-hidden">
        <KpiCard label="Net received" value={`$${kpis.netUsdc} USDC`} sub="Direct to wallet · 0.40% fee" icon={<DollarSign className="w-4 h-4" />} accent />
        <KpiCard label="Orders settled" value={kpis.count} sub="~600ms finality" icon={<CreditCard className="w-4 h-4" />} />
        <KpiCard label="Average order" value={`$${kpis.avgUsdc} USDC`} sub="Avg revenue per order" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard label="Protocol fee" value={`$${kpis.feeUsdc} USDC`} sub="7× cheaper than Stripe" icon={<Percent className="w-4 h-4" />} />
      </div>

      <div className="rounded-ctl border border-line bg-surface overflow-hidden">
        <div className="p-5 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-h6 font-medium text-ink flex items-center gap-2">
              Live settlement feed
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh feed"
                className="text-ink-3 hover:text-accent transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </h2>
            <p className="text-tiny text-ink-3">
              {settlements.length} settlement{settlements.length === 1 ? '' : 's'} recorded
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search order, tx, email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={onExportCsv} disabled={settlements.length === 0} className="gap-1.5 shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-raised text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
                {['Status', 'Order ID', 'Product', 'Customer', 'Amount', 'Receipt'].map((h, i) => (
                  <th key={h} className={`py-3.5 px-5 font-medium ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-tiny text-ink-2 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="text-ink-3">
                      {settlements.length === 0
                        ? 'No settlements recorded yet. Create a PayLink to start accepting USDC.'
                        : 'No matching records found.'}
                    </div>
                    {settlements.length === 0 && (
                      <Link href="/create" className="inline-flex mt-4">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Zap className="w-3.5 h-3.5 fill-accent" />
                          Create a PayLink
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const grossFormatted = (Number(BigInt(item.gross)) / 1e18).toFixed(2);
                  const feeFormatted = (Number(BigInt(item.protocolFee)) / 1e18).toFixed(2);
                  const netFormatted = (Number(BigInt(item.merchantShare)) / 1e18).toFixed(2);
                  return (
                    <tr key={item.id} className="hover:bg-raised/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2 h-5 rounded-pill border border-accent/30 bg-accent/10 text-accent font-medium text-nano uppercase tracking-mono-cap">
                          <span className="w-1 h-1 rounded-full bg-accent" />
                          Settled
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink">{item.orderId.slice(0, 10)}…</span>
                          <button onClick={() => onCopy(item.orderId, item.orderId)} className="text-ink-3 hover:text-accent">
                            {copiedId === item.orderId ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-ink text-nano">
                          {item.payLinkTitle || 'Direct checkout'}
                          {item.planName && <span className="text-ink-3"> · {item.planName}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {item.buyerEmail ? (
                          <div className="text-ink text-nano">{item.buyerEmail}</div>
                        ) : (
                          <div className="text-nano text-ink-3">{item.payer ? shortenAddress(item.payer) : '—'}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-ink font-medium tabular-nums whitespace-nowrap">
                        ${netFormatted}
                        <div className="text-nano text-ink-3 mt-0.5">${grossFormatted} − ${feeFormatted}</div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <a href={getExplorerTxUrl(chainId, item.txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:text-accent-2 font-medium text-nano">
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
