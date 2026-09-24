import React from 'react';
import Link from 'next/link';
import { Zap, Github, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050810] text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                <Zap className="w-4 h-4 fill-slate-950" />
              </div>
              <span className="font-extrabold text-white text-base">ArcPay</span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Developer-first payment protocol and embeddable checkout SDK purpose-built for the Arc Network.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <Sparkles className="w-3 h-3" />
              <span>DoraHacks Microgrants Track</span>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/#demo" className="hover:text-emerald-400 transition-colors">Storefront Demo</Link></li>
              <li><Link href="/create" className="hover:text-emerald-400 transition-colors">PayLink Studio</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Merchant Dashboard</Link></li>
              <li><Link href="/docs" className="hover:text-emerald-400 transition-colors">Documentation</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Developers</h4>
            <ul className="space-y-2">
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1"><span>GitHub Repository</span> <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href="https://explorer.testnet.arc.io" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1"><span>ArcScan Explorer</span> <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1"><span>Circle Faucet</span> <ExternalLink className="w-3 h-3" /></a></li>
              <li><Link href="/docs" className="hover:text-emerald-400 transition-colors">NPM Package (@arcpay/sdk)</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div>
            <h4 className="text-white font-semibold mb-3 uppercase tracking-wider text-[11px]">Network</h4>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Chain ID</span>
                <span className="text-white font-bold">5042002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gas Asset</span>
                <span className="text-emerald-400 font-bold">USDC (18 Dec)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Protocol Fee</span>
                <span className="text-emerald-400 font-bold">0.40% (40 bps)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Finality</span>
                <span className="text-white font-bold">~600ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} ArcPay Protocol. Built with open-source MIT license for the Arc Network.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Non-Custodial Smart Contract Routing
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
