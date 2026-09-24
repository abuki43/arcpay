'use client';

import React, { useState } from 'react';
import { Pill } from './pill';
import { Check, X, ArrowRight, TrendingUp, DollarSign, Sparkles } from 'lucide-react';

export function ComparisonSection() {
  const [monthlyVolume, setMonthlyVolume] = useState<number>(50000);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(50);

  const transactionCount = Math.max(1, Math.round(monthlyVolume / avgOrderValue));

  // Stripe standard pricing: 2.9% + $0.30 per transaction
  const stripeMonthlyCost = monthlyVolume * 0.029 + transactionCount * 0.3;
  // ArcPay protocol pricing: 0.40% flat
  const arcPayMonthlyCost = monthlyVolume * 0.004;

  const monthlySavings = Math.max(0, stripeMonthlyCost - arcPayMonthlyCost);
  const annualSavings = monthlySavings * 12;
  const savingsPercent = stripeMonthlyCost > 0 ? ((monthlySavings / stripeMonthlyCost) * 100).toFixed(0) : 0;

  return (
    <section className="py-24 bg-[#050810] border-t border-white/10 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Pill className="mb-4">[ ECONOMICS OF 0.40% ]</Pill>
          <h2 className="text-4xl sm:text-5xl font-sentient text-white tracking-tight">
            Stop losing <i className="font-light italic text-emerald-400">3%+</i> to legacy payment rails
          </h2>
          <p className="font-mono text-xs sm:text-sm text-slate-400 mt-4 max-w-2xl mx-auto">
            See how much revenue your SaaS or creator business keeps by switching to ArcPay’s 0.40% protocol settlement on Arc Layer-1.
          </p>
        </div>

        {/* Interactive Savings Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-20">
          {/* Controls Card */}
          <div className="lg:col-span-6 bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h3 className="text-xl font-sentient font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Revenue & Volume Calculator</span>
            </h3>

            {/* Slider 1: Monthly Volume */}
            <div className="mb-6 font-mono">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Monthly Processing Volume</label>
                <span className="text-base font-bold text-emerald-400">
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
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>$2,000/mo</span>
                <span>$250,000/mo</span>
                <span>$500,000/mo</span>
              </div>
            </div>

            {/* Slider 2: Average Order Value */}
            <div className="mb-8 font-mono">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Average Order Value (AOV)</label>
                <span className="text-base font-bold text-teal-400">${avgOrderValue} USDC</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>$5 (Micro-transactions)</span>
                <span>$50 (SaaS Subscription)</span>
                <span>$250 (Enterprise)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 font-mono text-xs text-slate-400 flex items-center justify-between">
              <span>Estimated Monthly Sales:</span>
              <span className="font-bold text-white">{transactionCount.toLocaleString()} orders/month</span>
            </div>
          </div>

          {/* Results Comparison Card */}
          <div className="lg:col-span-6 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative font-mono">
            <div className="absolute top-6 right-6">
              <span className="bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                SAVE ~{savingsPercent}%
              </span>
            </div>

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Estimated Annual Savings
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-400 mb-6">
              +${Math.round(annualSavings).toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400">/ year</span>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-900/60 border border-white/5">
                <div>
                  <div className="text-xs font-bold text-slate-300">Stripe (2.9% + $0.30)</div>
                  <div className="text-[11px] text-rose-400">High interchange + fixed fee penalty</div>
                </div>
                <div className="text-sm font-bold text-rose-400">
                  ${Math.round(stripeMonthlyCost).toLocaleString()} /mo
                </div>
              </div>

              <div className="flex justify-between items-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div>
                  <div className="text-xs font-bold text-emerald-300">ArcPay Protocol (0.40% Flat)</div>
                  <div className="text-[11px] text-emerald-400/80">Pure native USDC • Zero fixed order penalty</div>
                </div>
                <div className="text-base font-extrabold text-emerald-400">
                  ${Math.round(arcPayMonthlyCost).toLocaleString()} /mo
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400 font-sans">
              ⚡ Funds settle directly into your merchant wallet in <strong className="text-white">~600ms</strong> with zero escrow.
            </div>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-white/10 rounded-3xl overflow-hidden bg-slate-900/40 backdrop-blur-md font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-4 sm:p-5 font-bold">Feature / Metric</th>
                <th className="p-4 sm:p-5 text-slate-300">Traditional Stripe</th>
                <th className="p-4 sm:p-5 text-slate-300">Ethereum / Base USDC</th>
                <th className="p-4 sm:p-5 text-emerald-400 bg-emerald-500/10 font-bold">ArcPay on Arc L1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="p-4 sm:p-5 font-bold text-white">Processing Fee</td>
                <td className="p-4 sm:p-5 text-rose-400">2.9% + $0.30 per tx</td>
                <td className="p-4 sm:p-5">1.0% + Gas Spikes</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">0.40% Flat (40 bps)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-white">Settlement Speed</td>
                <td className="p-4 sm:p-5">2 to 7 Business Days</td>
                <td className="p-4 sm:p-5">15 seconds - 2 minutes</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">~600ms Sub-Second</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-white">Checkout Experience</td>
                <td className="p-4 sm:p-5">Credit card form / 3DS redirect</td>
                <td className="p-4 sm:p-5 text-rose-400">2 Txs (Approve + Transfer)</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">1-Click Native USDC Gas</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-white">Chargeback & Dispute Risk</td>
                <td className="p-4 sm:p-5 text-rose-400">High (1% - 2% fee loss + $15 fine)</td>
                <td className="p-4 sm:p-5">0% (Irreversible)</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">0% (Cryptographically Final)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-white">Custody & Payouts</td>
                <td className="p-4 sm:p-5">Custodial (Stripe holds funds)</td>
                <td className="p-4 sm:p-5">Non-custodial</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">100% Non-Custodial Direct Routing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
