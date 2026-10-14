import React from 'react';
import Link from 'next/link';
import { Zap, Github, ExternalLink, ShieldCheck } from 'lucide-react';
import { DEFAULT_APP_CHAIN_ID, DEFAULT_CHAIN_LABEL } from '@/lib/chain-config';

const product = [
  { label: 'Storefront Demo', href: '/demo' },
  { label: 'PayLink Studio', href: '/create' },
  { label: 'Merchant Dashboard', href: '/dashboard' },
  { label: 'Network Analytics', href: '/network' },
  { label: 'Documentation', href: '/docs' },
];

const developers = [
  { label: 'GitHub Repository', href: 'https://github.com' },
  { label: 'ArcScan Explorer', href: 'https://explorer.testnet.arc.io' },
  { label: 'Circle Faucet', href: 'https://faucet.circle.com' },
  { label: 'NPM Package', href: '/docs' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-canvas text-ink-2">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-ctl bg-accent flex items-center justify-center text-canvas">
                <Zap className="w-3.5 h-3.5 fill-canvas" />
              </div>
              <span className="text-title font-semibold text-ink tracking-tightish">
                ArcPay
              </span>
            </Link>
            <p className="text-tiny text-ink-3 leading-relaxed max-w-[240px]">
              Developer-first payment protocol and embeddable checkout SDK
              built for the Arc Network.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-2.5 h-7 rounded-pill border border-line bg-raised text-tiny font-medium text-ink-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent arc-pulse" />
              <span>Chain {DEFAULT_APP_CHAIN_ID} · {DEFAULT_CHAIN_LABEL}</span>
            </div>
          </div>

          <div>
            <h4 className="text-tiny font-medium uppercase tracking-mono-cap text-ink mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-tiny">
              {product.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-ink-2 hover:text-ink transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-tiny font-medium uppercase tracking-mono-cap text-ink mb-4">
              Developers
            </h4>
            <ul className="space-y-2.5 text-tiny">
              {developers.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="text-ink-2 hover:text-ink transition-colors flex items-center gap-1.5"
                  >
                    {l.label === 'GitHub Repository' && <Github className="w-3 h-3" />}
                    {l.label}
                    {l.href.startsWith('http') && (
                      <ExternalLink className="w-3 h-3 text-ink-3" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-tiny font-medium uppercase tracking-mono-cap text-ink mb-4">
              Network
            </h4>
            <div className="rounded-ctl border border-line bg-raised divide-y divide-line font-mono text-tiny tabular-nums">
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-ink-3">Chain ID</span>
                <span className="text-ink font-medium">{DEFAULT_APP_CHAIN_ID}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-ink-3">Gas Asset</span>
                <span className="text-accent font-medium">USDC · 18d</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-ink-3">Protocol Fee</span>
                <span className="text-accent font-medium">0.40% (40 bps)</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-ink-3">Finality</span>
                <span className="text-ink font-medium">~600ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-nano uppercase tracking-mono-cap text-ink-3">
          <div>© {new Date().getFullYear()} ArcPay Protocol · Open-source MIT</div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-accent" />
            Non-custodial smart-contract routing
          </div>
        </div>
      </div>
    </footer>
  );
}
