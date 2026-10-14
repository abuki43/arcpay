'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArcPayButton } from '@arcpay/sdk/react';
import { getExplorerTxUrl } from '@arcpay/sdk';
import confetti from 'canvas-confetti';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';
import { Button } from '@/components/ui/button';
import { Check, Zap, ExternalLink, ArrowUpRight } from 'lucide-react';

const DEMO_MERCHANT = '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D';
const DEMO_RPC_URL = process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || undefined;
const CONFETTI_COLORS = ['#F5A524', '#E89216', '#FFCB6B', '#FFFFFF'];

const PLANS = [
  {
    name: 'Micro',
    tag: 'Hobby',
    price: '$0.10',
    amount: 0.1,
    desc: 'A single on-chain payment — the smallest test that still exercises the real gateway.',
    features: ['Real mainnet payment', 'Sub-second ~600ms settlement', '0.40% protocol fee'],
    featured: false,
  },
  {
    name: 'Standard',
    tag: 'Popular',
    price: '$0.50',
    amount: 0.5,
    desc: 'The full checkout path, including the fee split and the indexed settlement landing in the dashboard.',
    features: ['Direct merchant payout (99.6%)', 'Indexed to Postgres in ~60s', 'No custody, no escrow'],
    featured: true,
  },
  {
    name: 'Pro',
    tag: 'Full flow',
    price: '$1.00',
    amount: 1.0,
    desc: 'Exercises the gateway end to end, including split routing and server-side verification.',
    features: ['Affiliate / split payment routing', 'Server verification SDK', 'Dedicated Arc RPC routing'],
    featured: false,
  },
];

export function StorefrontDemo() {
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const handlePaymentSuccess = (receipt: any) => {
    setLastReceipt(receipt);
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
  };

  return (
    <section className="pt-32 pb-24 min-h-[85vh]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow className="mb-6 justify-center">Live storefront</Eyebrow>
          <h1 className="text-h1 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Try the <span className="font-medium italic text-accent">1-click</span>{' '}
            checkout flow
          </h1>
          <p className="mt-4 text-lead text-ink-3 max-w-2xl mx-auto leading-relaxed">
            Click any plan to trigger the live{' '}
            <code className="font-mono text-tiny text-accent">@arcpay/sdk</code>{' '}
            checkout modal against the deployed Arc mainnet gateway. Pay real USDC and settle in ~600ms.
          </p>
        </Reveal>

        {lastReceipt && (
          <Reveal className="max-w-2xl mx-auto mb-8 rounded-ctl border border-accent/30 bg-accent/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-accent opacity-30 animate-ping" />
                <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-accent" />
              </span>
              <div>
                <div className="text-body font-medium text-accent flex items-center gap-2">
                  Settled on Arc in ~600ms
                  <span className="text-nano font-mono uppercase tracking-mono-cap text-accent/70">
                    hash {lastReceipt.txHash.slice(0, 12)}…
                  </span>
                </div>
                <div className="text-tiny text-ink-3">99.60% routed directly to merchant. Zero custody.</div>
              </div>
            </div>
            <a
              href={getExplorerTxUrl(5042, lastReceipt.txHash)}
              target="_blank" rel="noreferrer"
              className="text-tiny font-medium text-accent hover:text-accent-2 inline-flex items-center gap-1.5 shrink-0"
            >
              <span>ArcScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line rounded-ctl overflow-hidden mb-12">
          {PLANS.map((plan) => (
            <Reveal key={plan.name} className="bg-surface">
              <div className={`relative h-full p-7 flex flex-col ${plan.featured ? 'bg-raised' : ''}`}>
                {plan.featured && <div className="absolute -top-px left-0 right-0 h-px bg-accent" />}

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-h6 font-medium text-ink">{plan.name}</h3>
                  <span className="px-2 h-6 inline-flex items-center rounded-pill border border-line bg-raised text-nano uppercase tracking-mono-cap text-ink-2 font-mono">{plan.tag}</span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className={`font-mono text-h3 font-semibold tabular-nums ${plan.featured ? 'text-accent' : 'text-ink'}`}>{plan.price}</span>
                  <span className="text-tiny font-mono text-ink-3">USDC</span>
                </div>

                <p className="text-tiny text-ink-3 leading-relaxed mb-5">{plan.desc}</p>

                <ul className="space-y-2.5 text-tiny text-ink-2 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <ArcPayButton
                    merchant={DEMO_MERCHANT}
                    amount={plan.amount}
                    item={`CloudAI ${plan.name}`}
                    metadata={{ plan: plan.name.toLowerCase() }}
                    theme={plan.featured ? 'instrument' : 'instrument-light'}
                    size={plan.featured ? 'lg' : 'md'}
                    className="w-full"
                    rpcUrl={DEMO_RPC_URL}
                    onSuccess={handlePaymentSuccess}
                  />
                  <div className="mt-2 text-center text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
                    {plan.featured ? '1-click with pure native USDC' : 'Zero token approvals required'}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="rounded-ctl border border-line bg-surface p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-ctl border border-line bg-raised text-accent flex items-center justify-center">
                <Zap className="w-4 h-4 fill-accent" />
              </div>
              <div>
                <div className="text-body font-medium text-ink">Install in one line</div>
                <code className="font-mono text-tiny text-ink-2">npm i @arcpay/sdk</code>
              </div>
            </div>
            <Link href="/docs" className="inline-flex items-center gap-1.5 text-tiny font-medium text-accent hover:text-accent-2 transition-colors">
              Read the developer docs
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
