'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { calculateArcFee, shortenAddress } from '@arcpay/sdk';
import { DollarSign } from 'lucide-react';
import type { StudioPricingMode } from './types';

interface GeneralFormProps {
  merchant: string;
  setMerchant: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  mode: StudioPricingMode;
  amount: string;
  setAmount: (val: string) => void;
  connectedAddress?: string;
}

export function GeneralForm({
  merchant, setMerchant, title, setTitle, slug, setSlug, description, setDescription,
  mode, amount, setAmount, connectedAddress,
}: GeneralFormProps) {
  const numAmount = parseFloat(amount) || 0;
  const feeBreakdown = calculateArcFee(numAmount);

  return (
    <div className="rounded-ctl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-h6 font-medium text-ink mb-5 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-accent" />
        General configuration
      </h2>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-tiny font-medium text-ink-2">Merchant recipient wallet</label>
            {connectedAddress && (
              <button
                type="button"
                onClick={() => setMerchant(connectedAddress)}
                className="text-nano text-accent hover:underline font-mono uppercase tracking-mono-cap"
              >
                Use connected ({shortenAddress(connectedAddress)})
              </button>
            )}
          </div>
          <Input type="text" placeholder="0x..." value={merchant} onChange={(e) => setMerchant(e.target.value)} className="font-mono" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-tiny font-medium text-ink-2 block mb-1.5">Product / platform title</label>
            <Input type="text" placeholder="e.g. ArcCloud SaaS" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-tiny font-medium text-ink-2 block mb-1.5">Custom slug URL</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nano text-ink-3 font-mono">/pay/</span>
              <Input
                type="text"
                placeholder="my-saas"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="font-mono pl-12"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-tiny font-medium text-ink-2 block mb-1.5">Description / subtitle</label>
          <Input type="text" placeholder="Short description of your product" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {mode === 'single_item' && (
          <div>
            <label className="text-tiny font-medium text-ink-2 block mb-1.5">Price (USDC)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2 font-mono">$</span>
              <Input
                type="number" step="0.01" min="0.01" placeholder="29.00" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono pl-7 text-body font-medium"
              />
            </div>
            <div className="flex justify-between text-nano text-ink-3 mt-1.5 font-mono tabular-nums">
              <span>0.40% protocol fee: ${feeBreakdown.formattedFee}</span>
              <span className="text-accent font-medium">Net to you: ${feeBreakdown.formattedNet} USDC</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
