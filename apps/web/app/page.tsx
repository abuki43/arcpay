import Link from 'next/link';
import { Hero } from '@/components/hero';
import { CinemaPanel } from '@/components/cinema-panel';
import { BentoFeatures } from '@/components/bento-features';
import { Marquee, Reveal } from '@/components/motion';
import { Eyebrow } from '@/components/eyebrow';
import { Button } from '@/components/ui/button';
import { Terminal, ArrowUpRight, Check } from 'lucide-react';
import { DEFAULT_APP_CHAIN_ID } from '@/lib/chain-config';

const STEPS = [
  {
    step: '01',
    title: 'Customer clicks checkout',
    desc: '1-click wallet connect with zero ERC-20 approval friction.',
  },
  {
    step: '02',
    title: '~600ms settlement',
    desc: 'Sub-second deterministic confirmation on Arc Layer-1.',
  },
  {
    step: '03',
    title: '99.60% to wallet',
    desc: 'Instant deposit into the merchant wallet, no custody or escrow.',
  },
  {
    step: '04',
    title: 'Instant verification',
    desc: 'Direct RPC verification plus HMAC-signed webhooks for backend automation.',
  },
];

const MARQUEE = [
  'Native USDC gas',
  'Sub-second finality',
  '0.40% protocol fee',
  '99.60% to merchant',
  '1-click checkout',
  'Non-custodial routing',
  'HMAC-signed webhooks',
  'Open-source MIT',
  `Arc L1 · ${DEFAULT_APP_CHAIN_ID}`,
];

function StepsSection() {
  return (
    <section className="py-24 border-b border-line">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <Reveal className="max-w-2xl mb-12">
          <Eyebrow className="mb-6">How it works</Eyebrow>
          <h2 className="text-h2 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Click to wallet in{' '}
            <span className="font-medium italic text-accent">four steps</span>.
          </h2>
        </Reveal>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-ctl overflow-hidden">
          {STEPS.map((s) => (
            <Reveal key={s.step} className="bg-surface">
              <li className="relative h-full p-7">
                <div className="font-mono text-nano uppercase tracking-mono-cap text-accent mb-5">
                  / {s.step}
                </div>
                <h3 className="text-h6 font-medium text-ink mb-2 leading-snug">{s.title}</h3>
                <p className="text-tiny text-ink-3 leading-relaxed">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CodeSection() {
  return (
    <section className="py-24 border-b border-line">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <Reveal className="lg:col-span-5">
            <Eyebrow className="mb-6">One line</Eyebrow>
            <h2 className="text-h2 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
              From <code className="font-mono text-accent text-h2">npm i</code> to{' '}
              <span className="font-medium italic text-accent">live checkout</span>.
            </h2>
            <p className="mt-5 text-lead text-ink-3 max-w-md leading-relaxed">
              A React component, a web component, and a headless hook — all
              one npm package. Bring your own UI; ArcPay handles the rail.
            </p>

            <ul className="mt-8 space-y-3 text-tiny text-ink-2">
              {[
                'React: <ArcPayButton />',
                'Web: <arc-pay-button>',
                'Hook: useCheckout()',
                'Server: verifyArcPayment()',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 font-mono">
                  <Check className="w-3.5 h-3.5 text-accent" />
                  <span className="text-ink">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex gap-3">
              <Link href="/docs">
                <Button variant="outline" className="gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  Read developer docs
                </Button>
              </Link>
              <Link
                href="https://github.com"
                className="inline-flex items-center gap-1.5 text-tiny text-ink-2 hover:text-ink transition-colors self-center"
              >
                View on GitHub <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-7" delay={0.05}>
            <div className="rounded-ctl border border-line bg-raised overflow-hidden">
              <div className="flex items-center gap-2 px-3.5 h-10 border-b border-line">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-3" />
                <span className="ml-2 text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
                  checkout.tsx
                </span>
              </div>
              <pre className="px-5 py-5 font-mono text-tiny leading-relaxed text-ink overflow-x-auto">
                <code>
                  <span className="text-ink-3">import</span>{' '}
                  <span className="text-ink">{`{`}</span>{' '}
                  <span className="text-accent">ArcPayButton</span>{' '}
                  <span className="text-ink">{`}`}</span>{' '}
                  <span className="text-ink-3">from</span>{' '}
                  <span className="text-ink">'@arcpay/sdk/react'</span>
                  <span className="text-ink-3">;</span>
                  {'\n\n'}
                  <span className="text-ink-3">export default function</span>{' '}
                  <span className="text-accent">Pricing</span>
                  <span className="text-ink">() {`{`}</span>
                  {'\n  '}
                  <span className="text-ink-3">return</span>{' '}
                  <span className="text-ink">(</span>
                  {'\n    '}
                  <span className="text-ink-3">{'<'}</span>
                  <span className="text-accent">ArcPayButton</span>
                  {'\n      '}
                  <span className="text-ink">merchant</span>
                  <span className="text-ink-3">=</span>
                  <span className="text-ink">{'"{0x91ad…7b22}"'}</span>
                  {'\n      '}
                  <span className="text-ink">amount</span>
                  <span className="text-ink-3">=</span>
                  <span className="text-ink">{`{29}`}</span>
                  {'\n      '}
                  <span className="text-ink">currency</span>
                  <span className="text-ink-3">=</span>
                  <span className="text-ink">"USDC"</span>
                  {'\n      '}
                  <span className="text-ink">orderId</span>
                  <span className="text-ink-3">=</span>
                  <span className="text-ink">{`{order.id}`}</span>
                  {'\n      '}
                  <span className="text-ink">metadata</span>
                  <span className="text-ink-3">=</span>
                  <span className="text-ink">{`{`} tier: 'pro' {`}`}</span>
                  {'\n      '}
                  <span className="text-ink">theme</span>
                  <span className="text-ink-3">=</span>
                  <span className="text-ink">"instrument"</span>
                  {'\n    {'}
                  <span className="text-ink-3">{'>'}</span>
                  {'\n      '}
                  <span className="text-ink">Subscribe — $29 USDC</span>
                  {'\n    </'}
                  <span className="text-accent">ArcPayButton</span>
                  <span className="text-ink-3">{'>'}</span>
                  {'\n  '}
                  <span className="text-ink">);</span>
                  {'\n'}<span className="text-ink">{`}`}</span>
                </code>
              </pre>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="py-24 border-b border-line relative overflow-hidden">
      <div className="absolute inset-0 halftone opacity-30 pointer-events-none" aria-hidden />
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
        <Reveal>
          <div className="rounded-ctl border border-line bg-surface p-10 lg:p-14 text-center">
            <Eyebrow className="justify-center inline-flex mb-6">Build with ArcPay</Eyebrow>
            <h2 className="text-h2 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em] max-w-3xl mx-auto">
              Ready to accept payments on{' '}
              <span className="font-medium italic text-accent">Arc</span>?
            </h2>
            <p className="mt-5 text-lead text-ink-3 max-w-xl mx-auto leading-relaxed">
              Install the SDK or generate a hosted PayLink in seconds — zero
              custody, zero chargebacks, zero hidden fees.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/create">
                <Button size="lg" className="gap-2">
                  Create a PayLink
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  Read the docs
                </Button>
              </Link>
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
      <CinemaPanel />
      <BentoFeatures />
      <StepsSection />
      <CodeSection />
      <Marquee items={MARQUEE} />
      <ClosingSection />
    </>
  );
}
