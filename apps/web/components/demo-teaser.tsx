import Link from 'next/link';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';
import { Button } from '@/components/ui/button';
import { Check, Zap, ArrowUpRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    tag: 'Hobby',
    price: '$9.00',
    desc: 'For indie developers testing micro-services and Web3 SaaS prototypes.',
    features: [
      '10,000 API calls / month',
      'Sub-second ~600ms settlement',
      '0.40% protocol fee',
    ],
    featured: false,
  },
  {
    name: 'Pro Plan',
    tag: 'Scaling SaaS',
    price: '$29.00',
    desc: 'Infrastructure for high-growth SaaS and automated agent platforms.',
    features: [
      'Unlimited API requests',
      'Direct merchant payout (99.6%)',
      'PayLink Studio generator',
      'Server verification SDK',
    ],
    featured: true,
  },
  {
    name: 'Enterprise',
    tag: 'Platforms',
    price: '$99.00',
    desc: 'For platforms needing affiliate splits, marketplace payouts, and custom routing.',
    features: [
      'Affiliate / split payment routing',
      'Real-time WebSocket event streaming',
      'Dedicated Arc RPC node routing',
    ],
    featured: false,
  },
];

export function DemoTeaser() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <Reveal className="text-center max-w-3xl mx-auto mb-14">
          <Eyebrow className="justify-center mb-6">Live storefront</Eyebrow>
          <h2 className="text-4xl sm:text-5xl font-sentient text-foreground tracking-tight">
            The <i className="font-light italic text-primary">1-click</i>{' '}
            checkout flow
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px] text-balance max-w-2xl mx-auto leading-relaxed">
            Pay with Circle Faucet USDC on Arc Testnet and settle in ~600ms.
            Try the live modal on the demo page.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.06}>
              <div
                className={`relative h-full rounded-2xl border bg-card p-8 flex flex-col justify-between ${
                  plan.featured
                    ? 'border-2 border-primary/50 shadow-[0_16px_50px_rgba(14,122,84,0.10)]'
                    : 'border-border hover:border-primary/30'
                } transition-colors`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white font-mono font-bold px-3 py-1 rounded-full text-[10px] tracking-wider uppercase">
                      Most popular
                    </span>
                  </div>
                )}

                <div className={plan.featured ? 'relative mt-2' : 'relative'}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-sentient text-foreground">
                      {plan.name}
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                      {plan.tag}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span
                      className={`font-mono text-4xl font-extrabold tabular-nums ${
                        plan.featured ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      USDC / mo
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {plan.desc}
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Link href="/demo">
                    <Button
                      size={plan.featured ? 'lg' : 'default'}
                      variant={plan.featured ? 'default' : 'outline'}
                      className="w-full gap-2"
                    >
                      Try it live
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <div className="text-[10px] font-mono text-muted-foreground text-center mt-2">
                    Zero token approvals required
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

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