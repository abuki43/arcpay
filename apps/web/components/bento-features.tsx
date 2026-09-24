'use client';

import React, { useState, useEffect } from 'react';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';
import { Zap, ShieldCheck, Clock, Cpu } from 'lucide-react';

export function BentoFeatures() {
  const [pulseTick, setPulseTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((prev) => (prev + 1) % 100);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <Reveal className="max-w-2xl mx-auto text-center mb-14">
          <Eyebrow className="justify-center mb-6">Architecture</Eyebrow>
          <h2 className="text-4xl sm:text-5xl font-sentient text-foreground tracking-tight">
            Engineered for one property:{' '}
            <i className="font-light italic text-primary">speed</i>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* 01 — Sub-second settlement */}
          <Reveal className="md:col-span-7">
            <div className="relative h-full rounded-2xl border border-border bg-card p-8 flex flex-col justify-between group hover:border-primary/30 transition-colors">
              <span
                aria-hidden
                className="absolute right-7 top-5 font-sentient text-[5.5rem] leading-none text-primary/[0.07] select-none"
              >
                01
              </span>
              <div className="relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-700/20 text-primary flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-700/20 text-primary font-mono text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span>BLOCK TIME: ~600MS</span>
                  </div>
                </div>

                <h3 className="text-xl font-sentient text-foreground mb-2">
                  Sub-second deterministic finality
                </h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Ethereum takes 15 seconds, credit cards take three days. Arc
                  settles a payment in a single ~600ms block — no waiting
                  screens, no pending spinners.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white/70 p-5 font-mono text-xs space-y-4">
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-2">
                    <span className="text-primary font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-primary" />
                      <span>Arc Layer-1</span>
                    </span>
                    <span className="text-primary font-bold">~600ms Finality</span>
                  </div>
                  <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-[width] duration-300 rounded-full"
                      style={{ width: `${(pulseTick % 10) * 10 + 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[11px] mb-2 text-muted-foreground">
                    <span>Ethereum / Rollups</span>
                    <span>12,000ms - 60,000ms</span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-300 rounded-full w-1/4" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[11px] mb-2 text-muted-foreground">
                    <span>Stripe Credit Card ACH</span>
                    <span>259,200,000ms (3 Days)</span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-300 rounded-full w-1/12" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 02 — 1-click vs approvals */}
          <Reveal className="md:col-span-5" delay={0.06}>
            <div className="relative h-full rounded-2xl border border-border bg-card p-8 flex flex-col justify-between group hover:border-primary/30 transition-colors">
              <span
                aria-hidden
                className="absolute right-7 top-5 font-sentient text-[5.5rem] leading-none text-primary/[0.07] select-none"
              >
                02
              </span>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-700/20 text-primary flex items-center justify-center mb-6">
                  <Zap className="w-5 h-5 fill-primary" />
                </div>
                <h3 className="text-xl font-sentient text-foreground mb-2">
                  Pure native USDC gas
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Zero approval steps. 1 USDC = 1 USD through the entire stack
                  — no volatile gas token friction.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-white/70 p-4 font-mono text-xs space-y-3 text-[11px]">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-700/25">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary text-white font-bold flex items-center justify-center text-[10px]">
                      1
                    </div>
                    <span className="text-primary font-bold text-[11px]">ArcPay 1-Click</span>
                  </div>
                  <span className="text-primary font-bold text-[10px]">1 Transaction</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted opacity-70">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-400 text-white font-bold flex items-center justify-center text-[10px]">
                      2
                    </div>
                    <span className="text-muted-foreground text-[11px]">Standard ERC-20</span>
                  </div>
                  <span className="text-rose-500 text-[10px]">Approve + Transfer</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 03 — 0.40% split */}
          <Reveal className="md:col-span-5" delay={0.06}>
            <div className="relative h-full rounded-2xl border border-border bg-card p-8 flex flex-col justify-between group hover:border-primary/30 transition-colors">
              <span
                aria-hidden
                className="absolute right-7 top-5 font-sentient text-[5.5rem] leading-none text-primary/[0.07] select-none"
              >
                03
              </span>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-700/20 text-primary flex items-center justify-center mb-6">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-sentient text-foreground mb-2">
                  Instant non-custodial split
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  99.60% straight to your merchant wallet. 0.40% to the
                  protocol. No escrow, ever.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-white/70 font-mono text-xs space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Customer Pays:</span>
                  <span className="font-bold text-foreground">$100.00 USDC</span>
                </div>
                <div className="flex justify-between text-primary font-bold">
                  <span>Merchant Receives (99.6%):</span>
                  <span>$99.60 USDC</span>
                </div>
                <div className="flex justify-between text-foreground/70 text-[11px]">
                  <span>ArcPay Treasury (0.40%):</span>
                  <span>$0.40 USDC</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 04 — One RPC verification */}
          <Reveal className="md:col-span-7" delay={0.06}>
            <div className="relative h-full rounded-2xl border border-border bg-card p-8 flex flex-col justify-between group hover:border-primary/30 transition-colors">
              <span
                aria-hidden
                className="absolute right-7 top-5 font-sentient text-[5.5rem] leading-none text-primary/[0.07] select-none"
              >
                04
              </span>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-700/20 text-primary flex items-center justify-center mb-6">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-sentient text-foreground mb-2">
                  One RPC call to verify
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Verify any receipt server-side with a single cryptographic
                  RPC check against Arc. No webhooks to miss, no spoofing risk.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-[#0F1115] p-4 font-mono text-xs text-emerald-200/90 overflow-x-auto">
                <code>{`const res = await verifyArcPayment({
  orderId, merchant, expectedAmount: 29,
});
if (res.isValid) await provisionSubscription();`}</code>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}