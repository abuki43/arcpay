'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArcPayButton } from '@arcpay/sdk/react';
import confetti from 'canvas-confetti';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';
import { Check, Zap, ExternalLink, ArrowUpRight } from 'lucide-react';

const DEMO_MERCHANT = '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D';

export function StorefrontDemo() {
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const handlePaymentSuccess = (receipt: any) => {
    setLastReceipt(receipt);
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#0E7A54', '#10B981', '#065F46', '#34D399'],
    });
  };

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <Reveal className="text-center max-w-3xl mx-auto mb-14">
          <Eyebrow className="justify-center mb-6">Live storefront</Eyebrow>
          <h2 className="text-4xl sm:text-5xl font-sentient text-foreground tracking-tight">
            Try the <i className="font-light italic text-primary">1-click</i>{' '}
            checkout flow
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px] text-balance max-w-2xl mx-auto leading-relaxed">
            Click any plan to trigger the live{' '}
            <code className="font-mono text-xs text-primary">@arcpay/sdk</code>{' '}
            checkout modal. Pay with Circle Faucet USDC on Arc Testnet and settle
            in ~600ms.
          </p>
        </Reveal>

        {lastReceipt && (
          <Reveal className="max-w-2xl mx-auto mb-10 rounded-2xl border border-emerald-700/25 bg-emerald-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-30 animate-ping" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-primary flex items-center gap-2">
                  Settled on Arc in ~600ms
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary/70">
                    hash {lastReceipt.txHash.slice(0, 12)}&hellip;
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  99.60% routed directly to the merchant wallet. Zero custody.
                </div>
              </div>
            </div>
            <a
              href={`https://explorer.testnet.arc.io/tx/${lastReceipt.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:text-primary/80 underline flex items-center gap-1 shrink-0"
            >
              <span>ArcScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Starter */}
          <Reveal>
            <div className="h-full rounded-2xl border border-border bg-card p-8 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-sentient text-foreground">Starter</h3>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Hobby
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-mono text-4xl font-extrabold text-foreground tabular-nums">
                    $9.00
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">USDC / mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  For indie developers testing micro-services and Web3 SaaS
                  prototypes.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>10,000 API calls / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Sub-second ~600ms settlement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>0.40% protocol fee</span>
                  </li>
                </ul>
              </div>
              <div>
                <ArcPayButton
                  merchant={DEMO_MERCHANT}
                  amount={9.0}
                  item="CloudAI Starter Plan"
                  metadata={{ plan: 'starter', tier: 1 }}
                  theme="light"
                  size="md"
                  className="w-full"
                  onSuccess={handlePaymentSuccess}
                />
                <div className="text-[10px] font-mono text-muted-foreground text-center mt-2">
                  Zero token approvals required
                </div>
              </div>
            </div>
          </Reveal>

          {/* Pro (Featured) */}
          <Reveal delay={0.06}>
            <div className="relative h-full rounded-2xl border-2 border-primary/50 bg-card p-8 flex flex-col justify-between shadow-[0_16px_50px_rgba(14,122,84,0.10)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white font-mono font-bold px-3 py-1 rounded-full text-[10px] tracking-wider uppercase">
                  Most popular
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4 mt-2">
                  <h3 className="text-xl font-sentient text-foreground flex items-center gap-1.5">
                    <span>Pro Plan</span>
                  </h3>
                  <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                    Scaling SaaS
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-mono text-4xl font-extrabold text-primary tabular-nums">
                    $29.00
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">USDC / mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Infrastructure for high-growth SaaS and automated agent
                  platforms.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">Unlimited API requests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">Direct merchant payout (99.6%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">PayLink Studio generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">Server verification SDK</span>
                  </li>
                </ul>
              </div>
              <div>
                <ArcPayButton
                  merchant={DEMO_MERCHANT}
                  amount={29.0}
                  item="CloudAI Pro Plan"
                  metadata={{ plan: 'pro', tier: 2 }}
                  theme="emerald"
                  size="lg"
                  className="w-full"
                  onSuccess={handlePaymentSuccess}
                />
                <div className="text-[10px] font-mono text-primary text-center mt-2 font-semibold">
                  1-click checkout with pure native USDC
                </div>
              </div>
            </div>
          </Reveal>

          {/* Enterprise */}
          <Reveal delay={0.06}>
            <div className="h-full rounded-2xl border border-border bg-card p-8 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-sentient text-foreground">Enterprise</h3>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Platforms
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-mono text-4xl font-extrabold text-foreground tabular-nums">
                    $99.00
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">USDC / mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  For platforms needing affiliate splits, marketplace payouts,
                  and custom routing.
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Affiliate / split payment routing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Real-time WebSocket event streaming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" />
                    <span>Dedicated Arc RPC node routing</span>
                  </li>
                </ul>
              </div>
              <div>
                <ArcPayButton
                  merchant={DEMO_MERCHANT}
                  amount={99.0}
                  item="CloudAI Enterprise Plan"
                  metadata={{ plan: 'enterprise', tier: 3 }}
                  theme="light"
                  size="md"
                  className="w-full"
                  onSuccess={handlePaymentSuccess}
                />
                <div className="text-[10px] font-mono text-muted-foreground text-center mt-2">
                  Zero token approvals required
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* One-line install strip */}
        <Reveal>
          <div className="rounded-2xl border border-border bg-white/60 px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-700/20 text-primary flex items-center justify-center">
                <Zap className="w-5 h-5 fill-primary" />
              </div>
              <div>
                <div className="font-sentient text-base text-foreground">
                  Install in one line
                </div>
                <code className="font-mono text-xs text-foreground/70">
                  npm i @arcpay/sdk
                </code>
              </div>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Read the developer docs
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}