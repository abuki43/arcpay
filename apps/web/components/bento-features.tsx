'use client';

import React, { useState, useEffect } from 'react';
import { Pill } from './pill';
import { Zap, ShieldCheck, Clock, Layers, ArrowRight, CheckCircle2, Cpu, Sparkles } from 'lucide-react';

export function BentoFeatures() {
  const [activeTab, setActiveTab] = useState<'arc' | 'legacy'>('arc');
  const [pulseTick, setPulseTick] = useState<number>(0);

  // 600ms rhythmic pulse simulating Arc sub-second block times
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((prev) => (prev + 1) % 100);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-[#050810] border-t border-white/10 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[500px] bg-emerald-500/5 blur-[170px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Pill className="mb-4">[ ARCHITECTURE & ADVANTAGES ]</Pill>
          <h2 className="text-4xl sm:text-5xl font-sentient text-white tracking-tight">
            Engineered for <i className="font-light italic text-emerald-400">Pure Speed</i> & Simplicity
          </h2>
          <p className="font-mono text-xs sm:text-sm text-slate-400 mt-4 max-w-2xl mx-auto">
            Arc’s native USDC gas architecture removes the two biggest barriers in Web3 checkout: token approval friction and volatile gas fees.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
          {/* Bento 1: ~600ms Sub-Second Settlement Engine (7 cols) */}
          <div className="md:col-span-7 bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>BLOCK TIME: ~600MS</span>
                </div>
              </div>

              <h3 className="text-2xl font-sentient font-bold text-white mb-2">
                Sub-Second Deterministic Finality
              </h3>
              <p className="font-mono text-xs text-slate-400 mb-8 leading-relaxed">
                While Ethereum takes 15 seconds and credit cards take 3 days, Arc settles payments in a single ~600ms block. No waiting screens or payment pending spinners.
              </p>
            </div>

            {/* Live Visualizer: Arc ~600ms vs Legacy */}
            <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-5 font-mono text-xs space-y-4">
              {/* Arc Stream */}
              <div>
                <div className="flex justify-between items-center text-[11px] mb-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>Arc Layer-1</span>
                  </span>
                  <span className="text-emerald-400 font-bold">~600ms Finality</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                    style={{ width: `${(pulseTick % 10) * 10 + 10}%` }}
                  ></div>
                </div>
              </div>

              {/* Ethereum Stream */}
              <div>
                <div className="flex justify-between items-center text-[11px] mb-2 text-slate-400">
                  <span>Ethereum / Rollups</span>
                  <span>12,000ms - 60,000ms</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-700 w-1/4"></div>
                </div>
              </div>

              {/* Stripe Stream */}
              <div>
                <div className="flex justify-between items-center text-[11px] mb-2 text-slate-500">
                  <span>Stripe Credit Card ACH</span>
                  <span>259,200,000ms (3 Days)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 w-1/12"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento 2: 1-Click Native Gas vs 2-Step Approvals (5 cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 fill-teal-400" />
              </div>

              <h3 className="text-2xl font-sentient font-bold text-white mb-2">
                Pure Native USDC Gas
              </h3>
              <p className="font-mono text-xs text-slate-400 mb-6 leading-relaxed">
                Zero approval steps. 1 USDC = 1 USD throughout the entire stack without volatile gas token friction.
              </p>
            </div>

            {/* Interactive 1-Click Comparison */}
            <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                    1
                  </div>
                  <span className="text-emerald-300 font-bold text-[11px]">ArcPay 1-Click</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-bold">1 Transaction</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                    2
                  </div>
                  <span className="text-slate-400 text-[11px]">Standard ERC-20</span>
                </div>
                <span className="text-rose-400 text-[10px]">Approve + Transfer</span>
              </div>
            </div>
          </div>

          {/* Bento 3: 0.40% Protocol Split Engine (5 cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h3 className="text-2xl font-sentient font-bold text-white mb-2">
                Instant Non-Custodial Split
              </h3>
              <p className="font-mono text-xs text-slate-400 mb-6 leading-relaxed">
                99.60% directly to your merchant wallet. 0.40% to protocol treasury. No funds ever held in escrow.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Customer Pays:</span>
                <span className="font-bold text-white">$100.00 USDC</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Merchant Receives (99.6%):</span>
                <span>$99.60 USDC</span>
              </div>
              <div className="flex justify-between text-purple-400 text-[11px]">
                <span>ArcPay Treasury (0.40%):</span>
                <span>$0.40 USDC</span>
              </div>
            </div>
          </div>

          {/* Bento 4: Developer Verification Engine (7 cols) */}
          <div className="md:col-span-7 bg-gradient-to-br from-slate-900/80 to-slate-950/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6">
                <Cpu className="w-5 h-5" />
              </div>

              <h3 className="text-2xl font-sentient font-bold text-white mb-2">
                Server Verification in &lt; 50ms
              </h3>
              <p className="font-mono text-xs text-slate-400 mb-6 leading-relaxed">
                Verify any payment receipt server-side using <code>verifyArcPayment()</code>. Direct cryptographic RPC checks with zero webhook delays or spoofing risk.
              </p>
            </div>

            <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto">
              <code>{`const res = await verifyArcPayment({ orderId, merchant, expectedAmount: 29 });
if (res.isValid) await provisionSubscription(res.metadata.userId);`}</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
