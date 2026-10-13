'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Check, Copy, ExternalLink, Zap } from 'lucide-react';
import type { PayLinkSummary } from './types';

interface PayLinksTabProps {
  payLinks: PayLinkSummary[];
  copiedId: string | null;
  onCopy: (value: string, key: string) => void;
  onToggleActive: (slug: string, active: boolean) => void;
  onOpenAnalytics: (slug: string) => void;
}

export function PayLinksTab({ payLinks, copiedId, onCopy, onToggleActive, onOpenAnalytics }: PayLinksTabProps) {
  return (
    <div className="rounded-ctl border border-line bg-surface overflow-hidden">
      <div className="p-5 border-b border-line flex justify-between items-center">
        <div>
          <h2 className="text-h6 font-medium text-ink">Persistent PayLinks ({payLinks.length})</h2>
          <p className="text-tiny text-ink-3">Shareable URLs, multi-plan pricing, per-link analytics.</p>
        </div>
        <Link href="/create">
          <Button size="sm" className="gap-2">
            <Zap className="w-3.5 h-3.5 fill-canvas" />
            Create new
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-raised text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
              {['Status', 'Product title', 'Type / plans', 'Shareable slug', 'Views', 'Orders', 'Gross revenue', ''].map((h, i) => (
                <th key={i} className={`py-3.5 px-5 font-medium ${i === 7 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-tiny text-ink-2 font-mono">
            {payLinks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="text-ink-3 mb-4">No persistent PayLinks yet.</div>
                  <Link href="/create">
                    <Button size="sm" className="gap-2">
                      <Zap className="w-3.5 h-3.5 fill-canvas" />
                      Create your first
                    </Button>
                  </Link>
                </td>
              </tr>
            ) : (
              payLinks.map((pl) => (
                <tr key={pl.id} className="hover:bg-raised/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <button
                      type="button"
                      onClick={() => onToggleActive(pl.slug, pl.active)}
                      className={`px-2.5 h-6 inline-flex items-center rounded-pill border text-nano font-medium uppercase tracking-mono-cap transition-colors ${
                        pl.active
                          ? 'border-accent/30 bg-accent/10 text-accent'
                          : 'border-line bg-raised text-ink-3'
                      }`}
                    >
                      {pl.active ? 'Active' : 'Archived'}
                    </button>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-ink text-nano">{pl.title}</div>
                    {pl.description && <div className="text-nano text-ink-3 truncate max-w-xs">{pl.description}</div>}
                  </td>
                  <td className="py-3.5 px-5">
                    {pl.type === 'multi_plan' ? (
                      <Badge variant="outline" className="text-nano">{pl.plans.length} tiers</Badge>
                    ) : (
                      <span className="text-ink font-medium">${pl.amount?.toFixed(2)} USDC</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-accent">
                    <div className="flex items-center gap-1.5">
                      <span>/pay/{pl.slug}</span>
                      <button
                        type="button"
                        onClick={() => onCopy(
                          typeof window !== 'undefined' ? `${window.location.origin}/pay/${pl.slug}` : `/pay/${pl.slug}`,
                          pl.slug
                        )}
                        className="text-ink-3 hover:text-accent"
                      >
                        {copiedId === pl.slug ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-ink">{pl.views}</td>
                  <td className="py-3.5 px-5 text-ink">{pl.stats.totalOrders}</td>
                  <td className="py-3.5 px-5 text-accent font-medium">${pl.stats.grossVolumeUsdc.toFixed(2)}</td>
                  <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => onOpenAnalytics(pl.slug)} className="h-7 px-2.5 gap-1">
                      <BarChart3 className="w-3 h-3 text-accent" />
                      <span>Analytics</span>
                    </Button>
                    <a href={`/pay/${pl.slug}`} target="_blank" rel="noreferrer" className="inline-block">
                      <Button size="icon-sm" variant="ghost">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
