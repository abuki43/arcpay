'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Eyebrow } from './eyebrow';
import { Button } from '@/components/ui/button';
import { CountUp } from './motion';
import { ArrowRight } from 'lucide-react';

const GL = dynamic(() => import('./gl').then((m) => m.GL), {
  ssr: false,
});

const STATS = [
  {
    value: 0.4,
    prefix: '',
    suffix: '%',
    decimals: 2,
    label: 'Protocol fee',
    note: 'One flat rate · No hidden fees',
  },
  {
    value: 600,
    prefix: '~',
    suffix: 'ms',
    decimals: 0,
    label: 'Deterministic finality',
    note: 'A single Arc L1 block',
  },
  {
    value: 99.6,
    prefix: '',
    suffix: '%',
    decimals: 2,
    label: 'Direct to your wallet',
    note: 'Zero custody, zero escrow',
  },
  {
    value: 1,
    prefix: '',
    suffix: '',
    decimals: 0,
    label: 'Click to settle',
    note: 'No ERC-20 approvals',
  },
];

export function Hero() {
  const [hovering, setHovering] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={heroRef}
      className="relative min-h-svh flex flex-col justify-between overflow-hidden"
    >
      <GL targetRef={heroRef} hovering={hovering} />

      {/* Editorial print rails */}
      <div className="pointer-events-none absolute left-7 top-0 bottom-0 z-10 hidden xl:flex items-center gap-3">
        <span className="h-24 w-px bg-border" />
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-foreground/40 [writing-mode:vertical-rl]">
          Arc Layer-1 &middot; Native USDC
        </span>
      </div>
      <div className="pointer-events-none absolute right-7 top-0 bottom-0 z-10 hidden xl:flex items-center gap-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-foreground/40 [writing-mode:vertical-rl]">
          Open Source &middot; MIT
        </span>
        <span className="h-24 w-px bg-border" />
      </div>

      {/* Hero Center Content */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center relative z-10 my-auto pt-40 pb-20">
        <Eyebrow className="justify-center mb-8">
          The one-click USDC checkout for SaaS &amp; creators
        </Eyebrow>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-sentient text-foreground leading-[1.02] tracking-[-0.02em] mb-8">
          Stripe on Arc.
          <br />
          <i className="font-light italic text-primary">
            One click. Yours.
          </i>
        </h1>

        <p className="text-[15px] sm:text-base text-muted-foreground text-balance max-w-xl mx-auto leading-relaxed mb-10">
          Drop in <code className="font-mono text-xs text-primary">@arcpay/sdk</code>{' '}
          and take native USDC in ~600ms &mdash; zero custody, zero approvals,
          zero code.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/demo">
            <Button
              size="lg"
              className="gap-2"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              Try the live demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/create">
            <Button size="lg" variant="outline">
              Create a PayLink
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Band */}
      <div className="relative z-10 border-t border-border bg-white/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-6 py-8 ${i % 2 ? 'border-l border-border/80' : ''} ${
                i > 0 ? 'lg:border-l lg:border-border/80' : ''
              } ${i >= 2 ? 'border-t border-border/80 lg:border-t-0' : ''}`}
            >
              <CountUp
                to={s.value}
                prefix={s.prefix}
                suffix={s.suffix}
                decimals={s.decimals}
                className="font-sentient text-[2rem] sm:text-4xl tabular-nums text-foreground leading-none"
              />
              <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/90">
                {s.label}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {s.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}