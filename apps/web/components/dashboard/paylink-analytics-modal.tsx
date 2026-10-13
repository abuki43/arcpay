'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';
import type { PayLinkAnalytics } from './types';

interface PayLinkAnalyticsModalProps {
  slug: string | null;
  data: PayLinkAnalytics | null;
  isLoading: boolean;
  onClose: () => void;
}

export function PayLinkAnalyticsModal({ slug, data, isLoading, onClose }: PayLinkAnalyticsModalProps) {
  if (!slug) return null;

  return (
    <div className="fixed inset-0 bg-canvas/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded-ctl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-start pb-4 border-b border-line">
          <div>
            <Badge variant="secondary" className="text-nano mb-2">PayLink · deep dive</Badge>
            <h3 className="text-h4 font-semibold text-ink">{data?.title || slug}</h3>
            <p className="text-tiny text-accent font-mono">/pay/{slug}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-raised text-ink-3 hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-tiny text-ink-3 font-mono">Loading PayLink metrics…</div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-ctl overflow-hidden">
              {[
                ['Total views', data.views.toString(), 'ink'],
                ['Paid orders', data.ordersCount.toString(), 'ink'],
                ['Conversion', `${data.conversionRate.toFixed(1)}%`, 'accent'],
                ['Gross volume', `$${data.grossVolumeUsdc}`, 'accent'],
              ].map(([label, value, color]) => (
                <div key={label} className="bg-raised p-4">
                  <div className="text-nano font-medium uppercase tracking-mono-cap text-ink-3 mb-1.5">{label}</div>
                  <div className={`font-mono text-h4 font-semibold tabular-nums leading-none ${color === 'accent' ? 'text-accent' : 'text-ink'}`}>{value}</div>
                </div>
              ))}
            </div>

            {data.planBreakdown && data.planBreakdown.length > 0 && (
              <div>
                <h4 className="text-h6 font-medium text-ink mb-3">Sales by pricing tier</h4>
                <div className="space-y-px bg-line border border-line rounded-ctl overflow-hidden">
                  {data.planBreakdown.map((pb) => (
                    <div key={pb.planId} className="bg-raised p-3.5 flex justify-between items-center text-tiny">
                      <div>
                        <span className="font-medium text-ink">{pb.name}</span>
                        {pb.tag && <span className="ml-2 text-nano font-mono text-ink-3">({pb.tag})</span>}
                        <span className="text-ink-3 ml-2 font-mono">${pb.price.toFixed(2)}</span>
                      </div>
                      <div className="font-mono text-right">
                        <span className="font-medium text-ink mr-3">{pb.ordersCount} orders</span>
                        <span className="text-accent font-medium">${pb.volumeUsdc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <a href={`/pay/${slug}`} target="_blank" rel="noreferrer">
                <Button className="gap-2">
                  <span>Open checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
