'use client';

import React, { useState } from 'react';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';
import { TrendingUp } from 'lucide-react';

export function ComparisonSection() {
  const [monthlyVolume, setMonthlyVolume] = useState<number>(50000);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(50);

  const transactionCount = Math.max(
    1,
    Math.round(monthlyVolume / avgOrderValue)
  );
  const stripeMonthlyCost = monthlyVolume * 0.029 + transactionCount * 0.3;
  const arcPayMonthlyCost = monthlyVolume * 0.004;
  const monthlySavings = Math.max(0, stripeMonthlyCost - arcPayMonthlyCost);
  const annualSavings = monthlySavings * 12;
  const savingsPercent =
    stripeMonthlyCost > 0
      ? ((monthlySavings / stripeMonthlyCost) * 100).toFixed(0)
      : 0;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <Reveal className="max-w-2xl mx-auto text-center mb-16">
          <Eyebrow className="justify-center mb-6">
            Same standard &middot; Different rail
          </Eyebrow>
          <h2 className="text-4xl sm:text-5xl font-sentient text-foreground tracking-tight">
            Stripe-level checkout.
            <br />
            <i className="font-light italic text-primary">Settled on Arc.</i>
          </h2>
          <p className="text-muted-foreground mt-4 text-[15px] text-balance max-w-xl mx-auto leading-relaxed">
            ArcPay ships the checkout you already know from Stripe &mdash; then
            settles it on a rail Stripe doesn&rsquo;t have: non-custodial,
            ~600ms, at 0.40% flat.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-16">
          {/* Controls */}
          <Reveal className="lg:col-span-6">
            <div className="h-full rounded-2xl border border-border bg-card p-8">
              <h3 className="text-lg font-sentient text-foreground mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Revenue &amp; volume calculator</span>
              </h3>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Monthly processing volume
                  </label>
                  <span className="font-mono text-sm font-bold text-primary tabular-nums">
                    ${monthlyVolume.toLocaleString()} USDC
                  </span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="500000"
                  step="2000"
                  value={monthlyVolume}
                  onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                  <span>$2k/mo</span>
                  <span>$250k/mo</span>
                  <span>$500k/mo</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Average order value (AOV)
                  </label>
                  <span className="font-mono text-sm font-bold text-primary tabular-nums">
                    ${avgOrderValue} USDC
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="250"
                  step="5"
                  value={avgOrderValue}
                  onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                  <span>$5 Micro</span>
                  <span>$50 SaaS</span>
                  <span>$250 Enterprise</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted font-mono text-xs text-muted-foreground flex items-center justify-between">
                <span>Estimated monthly sales</span>
                <span className="font-bold text-foreground tabular-nums">
                  {transactionCount.toLocaleString()} orders/month
                </span>
              </div>
            </div>
          </Reveal>

          {/* Results */}
          <Reveal className="lg:col-span-6" delay={0.06}>
            <div className="h-full relative rounded-2xl border border-emerald-700/30 bg-gradient-to-b from-emerald-50 to-card p-8">
              <div className="absolute top-6 right-6">
                <span className="bg-primary text-white font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                  Save ~{savingsPercent}%
                </span>
              </div>

              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Estimated annual savings
              </div>
              <div className="text-4xl sm:text-5xl font-sentient text-primary mb-6 tabular-nums">
                +${Math.round(annualSavings).toLocaleString()}{' '}
                <span className="text-sm font-normal text-muted-foreground">/ year</span>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex justify-between items-center p-3.5 rounded-xl border border-border bg-white/70">
                  <div>
                    <div className="text-xs font-bold text-foreground">Card standard on the web</div>
                    <div className="text-[11px] text-muted-foreground">
                      Stripe blend: interchange + fixed fee
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-500 tabular-nums">
                    ${Math.round(stripeMonthlyCost).toLocaleString()} /mo
                  </div>
                </div>

                <div className="flex justify-between items-center p-3.5 rounded-xl bg-emerald-50 border border-emerald-700/25">
                  <div>
                    <div className="text-xs font-bold text-primary">ArcPay on Arc (0.40% flat)</div>
                    <div className="text-[11px] text-muted-foreground">
                      Native USDC, one click, non-custodial
                    </div>
                  </div>
                  <div className="font-mono text-base font-bold text-primary tabular-nums">
                    ${Math.round(arcPayMonthlyCost).toLocaleString()} /mo
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                Funds settle directly into your wallet in{' '}
                <strong className="text-primary">~600ms</strong> with zero
                escrow.
              </div>
            </div>
          </Reveal>
        </div>

        {/* Comparison matrix */}
        <Reveal>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left border-collapse bg-card text-xs">
              <thead>
                <tr className="border-b border-border bg-white/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 sm:p-5 font-bold text-foreground">Feature / Metric</th>
                  <th className="p-4 sm:p-5">Stripe on the Web</th>
                  <th className="p-4 sm:p-5">EVM USDC Today</th>
                  <th className="p-4 sm:p-5 text-primary bg-emerald-50 font-bold">
                    ArcPay on Arc L1
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-foreground">Processing Fee</td>
                  <td className="p-4 sm:p-5 text-rose-500">2.9% + $0.30 per tx</td>
                  <td className="p-4 sm:p-5">1.0% + Gas Spikes</td>
                  <td className="p-4 sm:p-5 font-bold text-primary bg-emerald-50">
                    0.40% Flat (40 bps)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-foreground">Settlement Speed</td>
                  <td className="p-4 sm:p-5">2 to 7 Business Days</td>
                  <td className="p-4 sm:p-5">15 sec - 2 min</td>
                  <td className="p-4 sm:p-5 font-bold text-primary bg-emerald-50">~600ms</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-foreground">Checkout Experience</td>
                  <td className="p-4 sm:p-5">Card form / 3DS redirect</td>
                  <td className="p-4 sm:p-5 text-rose-500">2 Txs (Approve + Transfer)</td>
                  <td className="p-4 sm:p-5 font-bold text-primary bg-emerald-50">
                    1-click native USDC gas
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-foreground">Chargeback Risk</td>
                  <td className="p-4 sm:p-5 text-rose-500">High (fees + $15 fine)</td>
                  <td className="p-4 sm:p-5">0% (Irreversible)</td>
                  <td className="p-4 sm:p-5 font-bold text-primary bg-emerald-50">
                    0% (final on-chain)
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-foreground">Custody &amp; Payouts</td>
                  <td className="p-4 sm:p-5">Custodial (Stripe holds funds)</td>
                  <td className="p-4 sm:p-5">Non-custodial</td>
                  <td className="p-4 sm:p-5 font-bold text-primary bg-emerald-50">
                    100% direct routing
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}