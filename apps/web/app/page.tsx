import Link from 'next/link';
import { Hero } from '@/components/hero';
import { DemoTeaser } from '@/components/demo-teaser';
import { ComparisonSection } from '@/components/comparison';
import { BentoFeatures } from '@/components/bento-features';
import { Eyebrow } from '@/components/eyebrow';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

function FlowSection() {
  const steps = [
    {
      step: '01',
      title: 'Customer clicks checkout',
      desc: 'No token approvals. The modal connects the wallet and formats a single native USDC gas transaction.',
    },
    {
      step: '02',
      title: '~600ms deterministic settlement',
      desc: 'The payment settles on Arc Layer-1 via ArcPaymentGateway.sol with cryptographically irreversible sub-second finality.',
    },
    {
      step: '03',
      title: '99.60% to merchant wallet',
      desc: '0.40% routes to the ArcPay treasury; the rest is deposited directly into the merchant wallet. Zero custody.',
    },
    {
      step: '04',
      title: 'Verify with one RPC call',
      desc: 'Backends call verifyArcPayment() for a direct cryptographic check. Client-side streams update the dashboard live.',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <Reveal className="max-w-2xl mx-auto text-center mb-14">
          <Eyebrow className="justify-center mb-6">How it works</Eyebrow>
          <h2 className="text-4xl sm:text-5xl font-sentient text-foreground tracking-tight">
            Click to wallet in <i className="font-light italic text-primary">four steps</i>
          </h2>
        </Reveal>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.06} className="h-full">
              <li className="relative h-full px-6 py-8 lg:border-l lg:border-border first:lg:border-l-0">
                <span className="block font-mono text-[11px] font-bold text-primary mb-5 tracking-widest">
                  {s.step}
                </span>
                <h3 className="font-sentient text-lg text-foreground mb-2.5 leading-snug">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>

        {/* Conic CTA banner */}
        <Reveal className="mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-white/70 px-8 py-14 sm:px-14 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 [background:conic-gradient(from_90deg_at_50%_-10%,rgba(16,185,129,0.12),transparent_30%,rgba(5,150,105,0.10),transparent_65%,rgba(16,185,129,0.12))]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-40 [background:radial-gradient(60%_120%_at_50%_130%,rgba(14,122,84,0.16),transparent_70%)]"
            />

            <div className="relative">
              <h3 className="text-3xl sm:text-4xl font-sentient text-foreground mb-4">
                Ready to accept payments on Arc?
              </h3>
              <p className="text-muted-foreground text-[15px] max-w-xl mx-auto mb-8 leading-relaxed">
                Install <code className="font-mono text-xs text-primary">@arcpay/sdk</code> or
                generate a standalone hosted PayLink in seconds - zero code
                required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="gap-2 text-[15px] [background:conic-gradient(from_180deg_at_50%_120%,#065F46_0deg,#0E7A54_120deg,#10B981_200deg,#065F46_360deg)]"
                  >
                    Create a PayLink now
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="outline">
                    Read developer documentation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <BentoFeatures />
      <DemoTeaser />
      <ComparisonSection />
      <FlowSection />
    </>
  );
}