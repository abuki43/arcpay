'use client';

import React from 'react';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';
import { Zap, ShieldCheck, Clock, Cpu, ArrowUpRight } from 'lucide-react';

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-ctl border border-line bg-raised overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 h-8 border-b border-line">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
        <span className="ml-2 text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
          server.ts
        </span>
      </div>
      <pre className="px-4 py-3.5 font-mono text-tiny leading-relaxed text-ink overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Number({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="absolute right-5 top-4 font-mono text-nano uppercase tracking-mono-cap text-ink-3"
    >
      / {children}
    </span>
  );
}

export function BentoFeatures() {
  return (
    <section className="py-24 border-b border-line">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <Reveal className="max-w-2xl mb-12">
          <Eyebrow className="mb-6">Architecture</Eyebrow>
          <h2 className="text-h2 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Engineered for one property:{' '}
            <span className="font-medium italic text-accent">speed</span>.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-line border border-line rounded-ctl overflow-hidden">
          {/* 01 — sub-second finality (col-span-7) */}
          <Reveal className="md:col-span-7 bg-surface">
            <div className="relative h-full p-7 flex flex-col">
              <Number>01</Number>
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-ctl border border-line bg-raised text-accent flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 h-6 rounded-pill border border-line bg-raised text-nano uppercase tracking-mono-cap text-ink-2 font-mono">
                  <span className="w-1 h-1 rounded-full bg-accent arc-pulse" />
                  ~600ms
                </div>
              </div>
              <h3 className="text-h5 font-medium text-ink mb-1.5">Sub-second finality</h3>
              <p className="text-body text-ink-3 mb-6 max-w-md leading-relaxed">
                A single Arc L1 block settles each order. No waiting spinners,
                no pending banners, no chargeback windows.
              </p>

              <div className="mt-auto rounded-ctl border border-line bg-raised p-4 font-mono text-tiny space-y-3">
                <div>
                  <div className="flex justify-between text-nano uppercase tracking-mono-cap text-accent mb-1.5">
                    <span>Arc Layer-1</span>
                    <span className="tabular-nums">~600ms</span>
                  </div>
                  <div className="h-1.5 rounded-pill bg-inset overflow-hidden">
                    <div className="h-full w-[6%] bg-accent" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-nano uppercase tracking-mono-cap text-ink-3 mb-1.5">
                    <span>Ethereum L2</span>
                    <span className="tabular-nums">2 000–15 000ms</span>
                  </div>
                  <div className="h-1.5 rounded-pill bg-inset overflow-hidden">
                    <div className="h-full w-[34%] bg-ink-3/40" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-nano uppercase tracking-mono-cap text-ink-3 mb-1.5">
                    <span>Card ACH</span>
                    <span className="tabular-nums">3 days</span>
                  </div>
                  <div className="h-1.5 rounded-pill bg-inset overflow-hidden">
                    <div className="h-full w-1/12 bg-ink-3/30" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 02 — 1-click vs approvals (col-span-5) */}
          <Reveal className="md:col-span-5 bg-surface" delay={0.05}>
            <div className="relative h-full p-7 flex flex-col">
              <Number>02</Number>
              <div className="w-9 h-9 rounded-ctl border border-line bg-raised text-accent flex items-center justify-center mb-5">
                <Zap className="w-4 h-4 fill-accent" />
              </div>
              <h3 className="text-h5 font-medium text-ink mb-1.5">Pure native USDC gas</h3>
              <p className="text-body text-ink-3 mb-6 max-w-md leading-relaxed">
                One transaction. USDC is Arc's native gas asset, so payment
                rides on <code className="font-mono text-tiny text-ink">msg.value</code>.
                No <code className="font-mono text-tiny text-ink">approve()</code> step.
              </p>

              <div className="mt-auto rounded-ctl border border-line bg-raised p-4 font-mono text-tiny divide-y divide-line">
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent text-canvas flex items-center justify-center text-[9px] font-bold">1</span>
                    <span className="text-ink">ArcPay 1-click</span>
                  </div>
                  <span className="text-accent uppercase tracking-mono-cap text-nano">1 tx</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-inset text-ink-2 flex items-center justify-center text-[9px] font-bold">2</span>
                    <span className="text-ink-2">EVM USDC</span>
                  </div>
                  <span className="text-danger uppercase tracking-mono-cap text-nano">approve + transfer</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 03 — 0.40% split (col-span-5) */}
          <Reveal className="md:col-span-5 bg-surface" delay={0.05}>
            <div className="relative h-full p-7 flex flex-col">
              <Number>03</Number>
              <div className="w-9 h-9 rounded-ctl border border-line bg-raised text-accent flex items-center justify-center mb-5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-h5 font-medium text-ink mb-1.5">Non-custodial split</h3>
              <p className="text-body text-ink-3 mb-6 max-w-md leading-relaxed">
                Settlement routes 99.60% directly to the merchant wallet. The
                0.40% protocol fee lands in the ArcPay treasury in the same block.
              </p>

              <div className="mt-auto rounded-ctl border border-line bg-raised p-4 font-mono text-tiny divide-y divide-line">
                <div className="flex justify-between py-2 text-ink-3">
                  <span>Customer pays</span>
                  <span className="text-ink font-medium tabular-nums">100.000 USDC</span>
                </div>
                <div className="flex justify-between py-2 text-ink">
                  <span>Merchant (99.60%)</span>
                  <span className="text-accent font-medium tabular-nums">99.600</span>
                </div>
                <div className="flex justify-between py-2 text-ink-3">
                  <span>ArcPay treasury (0.40%)</span>
                  <span className="text-ink-2 font-medium tabular-nums">0.400</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 04 — RPC verification (col-span-7) */}
          <Reveal className="md:col-span-7 bg-surface" delay={0.05}>
            <div className="relative h-full p-7 flex flex-col">
              <Number>04</Number>
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 rounded-ctl border border-line bg-raised text-accent flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <a
                  href="/docs"
                  className="inline-flex items-center gap-1 text-nano uppercase tracking-mono-cap text-ink-2 hover:text-accent transition-colors"
                >
                  Docs <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
              <h3 className="text-h5 font-medium text-ink mb-1.5">Cryptographic verification</h3>
              <p className="text-body text-ink-3 mb-5 max-w-md leading-relaxed">
                Verify any receipt server-side with a single direct RPC query.
                No indexer, no third party.
              </p>

              <div className="mt-auto">
                <CodeBlock>
                  <span className="text-ink-3">const</span>{' '}
                  <span className="text-ink">res</span>{' '}
                  <span className="text-ink-3">=</span>{' '}
                  <span className="text-ink-3">await</span>{' '}
                  <span className="text-accent">verifyArcPayment</span>
                  <span className="text-ink">({`{`}</span>
                  {'\n  '}
                  <span className="text-ink">orderId</span>
                  <span className="text-ink-3">,</span>{' '}
                  <span className="text-ink">merchant</span>
                  <span className="text-ink-3">,</span>{' '}
                  <span className="text-ink">expectedAmount</span>
                  <span className="text-ink-3">:</span>{' '}
                  <span className="text-ink">29</span>
                  <span className="text-ink-3">,</span>
                  {'\n'}<span className="text-ink">{`})`}</span>
                  <span className="text-ink-3">;</span>
                  {'\n'}<span className="text-ink-3">if</span>{' '}
                  <span className="text-ink">{`(`}</span>
                  <span className="text-ink">res</span>
                  <span className="text-ink-3">.</span>
                  <span className="text-ink">isValid</span>
                  <span className="text-ink">{`)`}</span>{' '}
                  <span className="text-ink-3">await</span>{' '}
                  <span className="text-accent">provisionSubscription</span>
                  <span className="text-ink">{`()`}</span>
                  <span className="text-ink-3">;</span>
                </CodeBlock>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
