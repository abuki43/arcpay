'use client';

import React from 'react';
import { Hero } from '@/components/hero';
import { ComparisonSection } from '@/components/comparison';
import { StorefrontDemo } from '@/components/storefront-demo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';

function ArchitectureSection() {
  const steps = [
    {
      step: '01',
      title: 'Customer Clicks <ArcPayButton />',
      desc: 'No token approvals required. The checkout modal dynamically connects the customer wallet and formats the single native USDC gas transaction.',
      icon: Zap,
    },
    {
      step: '02',
      title: '~600ms Deterministic Settlement',
      desc: 'The transaction settles directly on Arc Layer-1 via ArcPaymentGateway.sol with cryptographically irreversible sub-second finality.',
      icon: Cpu,
    },
    {
      step: '03',
      title: '99.60% Direct to Merchant Wallet',
      desc: '0.40% protocol fee is routed to the ArcPay Treasury while 99.60% is instantly deposited directly into the merchant wallet with zero custody.',
      icon: ShieldCheck,
    },
    {
      step: '04',
      title: 'Real-Time Event & Webhook Verification',
      desc: 'Client-side Wagmi streams update the merchant dashboard live, while backend services verify payment receipts in <50ms via verifyArcPayment().',
      icon: Layers,
    },
  ];

  return (
    <section className="py-24 bg-[#050810] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-4 px-3 py-1">
            HOW IT WORKS
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Non-Custodial, <span className="text-emerald-400">Sub-Second Architecture</span>
          </h2>
          <p className="text-slate-400 mt-4 text-base sm:text-lg">
            Built from the ground up to leverage Circle’s Arc Layer-1 capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 relative hover:border-emerald-500/30 transition-all backdrop-blur-md group"
              >
                <div className="text-xs font-mono font-bold text-emerald-400 mb-4 flex items-center justify-between">
                  <span>STEP {item.step}</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Call to Action Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-slate-950 border border-emerald-500/30 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to accept payments on Arc?
          </h3>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Install `@arcpay/sdk` or generate a standalone hosted PayLink in seconds with zero coding required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/20">
                Create a PayLink Now
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="bg-slate-900/80 border-white/10 text-white hover:bg-slate-800 px-8 py-6 rounded-xl">
                Read Developer Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <StorefrontDemo />
      <ComparisonSection />
      <ArchitectureSection />
    </>
  );
}
