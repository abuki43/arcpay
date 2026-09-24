'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GL } from './gl';
import { Pill } from './pill';
import { CyberButton } from './cyber-button';
import { Zap, ArrowRight, ShieldCheck, Clock, Percent, Sparkles, Terminal } from 'lucide-react';

export function Hero() {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="relative min-h-svh flex flex-col justify-between overflow-hidden bg-[#050810]">
      {/* 3D WebGL Particle Background (Interactive on Hover) */}
      <GL hovering={hovering} />

      {/* Top Spacer for Fixed Nav */}
      <div className="pt-24 md:pt-32"></div>

      {/* Hero Center Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 my-auto pb-12">
        {/* Cyber Beveled Pill Badge */}
        <Pill className="mb-8">
          [ 0.40% PROTOCOL FEE • ARC LAYER-1 ]
        </Pill>

        {/* High-End Sentient Serif Typography */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-sentient text-white leading-[1.05] tracking-tight mb-8">
          Unlock <i className="font-light italic text-emerald-400">1-Click</i> <br />
          USDC Checkout
        </h1>

        {/* Monospace Subtitle */}
        <p className="font-mono text-xs sm:text-sm md:text-base text-slate-300/80 text-balance max-w-2xl mx-auto leading-relaxed mb-12">
          Accept native USDC with <span className="text-emerald-400 font-bold">0.40% protocol fees</span> (7x cheaper than Stripe), <span className="text-white font-semibold">~600ms sub-second finality</span>, and <span className="text-emerald-400 font-bold">zero ERC-20 approvals</span>.
        </p>

        {/* Cyber Polygon CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 max-w-md mx-auto">
          <Link href="/#demo" className="contents">
            <CyberButton
              variant="emerald"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="w-full sm:w-auto"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>[ Try Live Demo ]</span>
            </CyberButton>
          </Link>

          <Link href="/create" className="contents">
            <CyberButton
              variant="outline"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="w-full sm:w-auto"
            >
              <span>[ Create PayLink ]</span>
            </CyberButton>
          </Link>
        </div>
      </div>

      {/* Bottom KPI Feature Strip */}
      <div className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-mono">
          <div className="p-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">0.40%</div>
            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Protocol Fee</div>
            <div className="text-[10px] text-slate-500 font-sans">7x cheaper than Stripe (2.9% + $0.30)</div>
          </div>

          <div className="p-2 border-l border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-white">~600ms</div>
            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Sub-Second Finality</div>
            <div className="text-[10px] text-slate-500 font-sans">Deterministic Arc L1 speed</div>
          </div>

          <div className="p-2 border-l border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-400">1-Click</div>
            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Zero Approvals</div>
            <div className="text-[10px] text-slate-500 font-sans">Pure native USDC gas token</div>
          </div>

          <div className="p-2 border-l border-white/5">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">&lt; 50ms</div>
            <div className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">RPC Verify</div>
            <div className="text-[10px] text-slate-500 font-sans">Server-side cryptographic check</div>
          </div>
        </div>
      </div>
    </div>
  );
}
