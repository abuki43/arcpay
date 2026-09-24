import React from 'react';
import Link from 'next/link';
import { Zap, Github, ExternalLink, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/50 text-muted-foreground text-xs py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <span className="font-sentient text-base text-foreground">
                ArcPay
              </span>
            </Link>
            <p className="text-muted-foreground text-xs leading-relaxed mb-4 max-w-[240px]">
              Developer-first payment protocol and embeddable checkout SDK
              built for the Arc Network.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-700/20 text-primary text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              DoraHacks Microgrants Track
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-[11px] uppercase tracking-[0.14em]">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#demo" className="hover:text-primary transition-colors">
                  Storefront Demo
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-primary transition-colors">
                  PayLink Studio
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Merchant Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-[11px] uppercase tracking-[0.14em]">
              Developers
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3 h-3" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://explorer.testnet.arc.io"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  ArcScan Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  Circle Faucet
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/docs" className="hover:text-primary transition-colors">
                  NPM Package (@arcpay/sdk)
                </Link>
              </li>
            </ul>
          </div>

          {/* Network Spec */}
          <div>
            <h4 className="text-foreground font-semibold mb-3 text-[11px] uppercase tracking-[0.14em]">
              Network
            </h4>
            <div className="p-3.5 rounded-xl border border-border bg-background space-y-1.5 font-mono text-[11px] tabular-nums">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain ID</span>
                <span className="text-foreground font-semibold">5042002</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas Asset</span>
                <span className="text-primary font-semibold">USDC (18 Dec)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protocol Fee</span>
                <span className="text-primary font-semibold">0.40% (40 bps)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Finality</span>
                <span className="text-foreground font-semibold">~600ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-foreground text-[11px]">
          <div>
            © {new Date().getFullYear()} ArcPay Protocol. Open-source MIT.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Non-custodial smart contract routing
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}