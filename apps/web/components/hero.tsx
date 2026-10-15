'use client';

import React from 'react';
import Link from 'next/link';
import { Eyebrow } from './eyebrow';
import { Button } from '@/components/ui/button';
import { CountUp } from './motion';
import { LiveLedger } from './live-ledger';
import { ArrowUpRight, Terminal } from 'lucide-react';

const STATS = [
  { value: 0.4, prefix: '', suffix: '%', decimals: 2, label: 'Protocol fee', note: 'One flat rate' },
  { value: 600, prefix: '~', suffix: 'ms', decimals: 0, label: 'Finality', note: 'Single Arc L1 block' },
  { value: 99.6, prefix: '', suffix: '%', decimals: 2, label: 'Direct to wallet', note: 'Non-custodial' },
  { value: 1, prefix: '', suffix: '', decimals: 0, label: 'Click to settle', note: 'No approvals' },
];

export function Hero() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-32 lg:pb-24 overflow-hidden border-b border-line">
      <div className="absolute inset-0 halftone opacity-40 pointer-events-none" aria-hidden />
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-7">Arc Network · Native USDC Checkout</Eyebrow>

            <h1 className="text-h1 sm:text-display lg:text-display-xl font-semibold text-ink leading-[0.98] tracking-[-0.025em] mb-7">
              Stripe on Arc.
              <br />
              <span className="font-medium italic text-accent">One click.</span>{' '}
              <span className="text-ink-2">Yours.</span>
            </h1>

            <p className="text-lead text-ink-2 max-w-xl leading-relaxed mb-9">
              Drop in{' '}
              <code className="font-mono text-tiny text-accent px-1.5 py-0.5 rounded-chip border border-line bg-raised">
                @arcpay/sdk
              </code>{' '}
              and take native USDC in ~600ms — zero custody, zero approvals,
              zero chargebacks.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-12">
              <Link href="/demo">
                <Button size="lg" className="gap-2">
                  Try the live demo
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/create">
                <Button size="lg" variant="outline" className="gap-2">
                  Create a PayLink
                </Button>
              </Link>
              <Link
                href="/docs"
                className="hidden sm:inline-flex items-center gap-1.5 text-tiny text-ink-2 hover:text-ink transition-colors ml-1"
              >
                <Terminal className="w-3.5 h-3.5" />
                Read the SDK
              </Link>
            </div>

            <dl className="grid grid-cols-2 lg:grid-cols-4 border border-line rounded-ctl overflow-hidden divide-y divide-line lg:divide-y-0 lg:divide-x divide-line">
              {STATS.map((s) => (
                <div key={s.label} className="p-5">
                  <CountUp
                    to={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    decimals={s.decimals}
                    className="block text-h4 font-medium tabular-nums text-ink leading-none"
                  />
                  <div className="mt-2.5 text-nano font-medium uppercase tracking-mono-cap text-accent">
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-tiny text-ink-3">{s.note}</div>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="flex items-center justify-between mb-3 text-nano uppercase tracking-mono-cap text-ink-3">
              <span>Arc / public</span>
              <span>window: 50 000 blocks</span>
            </div>
            <LiveLedger limit={5} />
          </div>
        </div>
      </div>
    </section>
  );
}
