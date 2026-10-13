'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpRight, Check, Copy, ExternalLink } from 'lucide-react';
import type { PlanDraft, StudioPricingMode } from './types';

interface StudioPreviewProps {
  mode: StudioPricingMode;
  title: string;
  description: string;
  amount: string;
  plans: PlanDraft[];
  previewPlanIndex: number;
  setPreviewPlanIndex: (index: number) => void;
  publishedUrl: string;
  isPublished: boolean;
  copied: boolean;
  onCopy: () => void;
}

export function StudioPreview({
  mode, title, description, amount, plans, previewPlanIndex, setPreviewPlanIndex,
  publishedUrl, isPublished, copied, onCopy,
}: StudioPreviewProps) {
  const numAmount = mode === 'single_item'
    ? (parseFloat(amount) || 0)
    : (parseFloat(plans[previewPlanIndex]?.amount || '0') || 0);

  return (
    <div className="lg:col-span-5 sticky top-28 space-y-5">
      <div className="flex justify-between items-center">
        <span className="text-tiny font-medium uppercase tracking-mono-cap text-ink-2">Live buyer preview</span>
        <Badge variant={isPublished ? 'accent' : 'default'}>{isPublished ? 'Published' : 'Preview'}</Badge>
      </div>

      {mode === 'multi_plan' ? (
        <div className="rounded-ctl bg-surface border border-line p-6 space-y-4">
          <div className="text-center pb-4 border-b border-line">
            <Badge variant="secondary" className="mb-2 text-nano">Arc L1 · 0.40% fee</Badge>
            <h3 className="text-h5 font-semibold text-ink mb-1">{title}</h3>
            <p className="text-tiny text-ink-3">{description}</p>
          </div>

          <div className="space-y-2">
            {plans.map((p, pIdx) => (
              <div
                key={p.id}
                onClick={() => setPreviewPlanIndex(pIdx)}
                className={`relative p-4 rounded-ctl border cursor-pointer transition-colors ${
                  previewPlanIndex === pIdx
                    ? 'border-accent bg-accent/[0.07] ring-1 ring-accent'
                    : 'border-line bg-raised hover:border-line-strong'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-tiny font-medium text-ink">{p.name}</span>
                    {p.tag && (
                      <span className="text-nano font-mono px-2 h-5 inline-flex items-center rounded-pill border border-line bg-canvas text-ink-3 uppercase tracking-mono-cap">
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <div className="font-mono font-medium text-tiny text-ink tabular-nums">
                    ${p.amount} <span className="text-nano text-ink-3">USDC</span>
                  </div>
                </div>
                <p className="text-nano text-ink-3 mb-2">{p.description}</p>
                <div className="flex flex-wrap gap-2">
                  {p.features.slice(0, 2).map((f, fi) => (
                    <span key={fi} className="text-nano text-accent flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-ctl bg-raised border border-line text-nano font-mono flex justify-between">
            <span className="text-ink-3">Selected: {plans[previewPlanIndex]?.name}</span>
            <span className="text-accent font-medium">${plans[previewPlanIndex]?.amount} USDC</span>
          </div>
        </div>
      ) : (
        <div className="rounded-ctl bg-surface border border-line p-6 text-center space-y-3">
          <div className="text-nano font-medium uppercase tracking-mono-cap text-ink-3">ArcPay 1-click invoice</div>
          <div className="font-mono text-h2 font-semibold text-ink tabular-nums leading-none">
            ${numAmount.toFixed(2)} <span className="text-h5 text-accent">USDC</span>
          </div>
          <h3 className="text-body font-medium text-ink">{title}</h3>
          <p className="text-tiny text-ink-3">{description}</p>
          <div className="inline-block border border-line bg-canvas rounded-ctl p-3">
            <QRCodeSVG value={publishedUrl} size={120} level="M" />
          </div>
        </div>
      )}

      <div className="rounded-ctl border border-line bg-surface p-5 space-y-3">
        <div className="text-tiny font-medium text-ink-2">Shareable 1-click PayLink</div>
        <div className="flex gap-2">
          <Input readOnly value={publishedUrl} className="font-mono text-accent select-all" />
          <Button onClick={onCopy} className="shrink-0 px-3.5">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <div className="flex gap-2 pt-1">
          <a href={publishedUrl} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="outline" className="w-full text-tiny gap-2">
              <span>Open checkout page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full text-tiny gap-2">
              <span>Go to dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
