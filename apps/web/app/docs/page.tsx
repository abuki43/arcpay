'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/eyebrow';
import {
  Copy,
  Check,
  Zap,
  Code,
  ShieldCheck,
  Terminal,
  Layers,
  MousePointerClick,
  ExternalLink,
} from 'lucide-react';

function CodeBlock({
  code,
  copyKey,
  onCopy,
  copiedKey,
}: {
  code: string;
  copyKey: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onCopy(code, copyKey)}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {copiedKey === copyKey ? (
          <Check className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        <span>{copiedKey === copyKey ? 'Copied' : 'Copy'}</span>
      </button>
      <pre className="p-4 rounded-xl bg-[#0F1115] font-mono text-xs text-emerald-100/90 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const quickstartCode = `pnpm add @arcpay/sdk viem`;

  const reactCode = `import { ArcPayButton } from '@arcpay/sdk/react';

<ArcPayButton
  merchant="0xYourWalletAddress..."
  amount={29.00}
  item="CloudAI Pro Subscription"
  metadata={{ userId: "usr_1042", plan: "pro" }}
  theme="emerald"
  onSuccess={(receipt) => {
    console.log("Paid in ~600ms:", receipt.txHash);
    // Provision access immediately
  }}
  onError={(err) => console.error(err)}
/>`;

  const webComponentCode = `<script type="module" src="https://unpkg.com/@arcpay/sdk/dist/element.js"></script>

<arc-pay-button
  merchant="0xYourWalletAddress..."
  amount="29.00"
  item="Digital Download"
  theme="emerald"
  rpc-url="https://arc-testnet.g.alchemy.com/v2/API_KEY">
</arc-pay-button>

<script>
  document
    .querySelector('arc-pay-button')
    .addEventListener('arcpay:success', (e) => {
      console.log('Payment Settled:', e.detail.txHash);
    });
</script>`;

  const hookCode = `import { useCheckout } from '@arcpay/sdk/react';

export function CustomCheckout() {
  const { checkout, isPaying, isSuccess, receipt } = useCheckout();

  const handlePay = async () => {
    const res = await checkout({
      merchant: "0xYourWalletAddress...",
      amount: 29.00,
      item: "Custom Bespoke SaaS Tier",
      rpcUrl: "https://arc-testnet.g.alchemy.com/v2/API_KEY", // optional override
    });
    console.log("Receipt:", res);
  };

  return (
    <button onClick={handlePay} disabled={isPaying}>
      {isPaying ? "Settling on Arc..." : "Pay $29 USDC"}
    </button>
  );
}`;

  const serverCode = `import { verifyArcPayment } from '@arcpay/sdk/server';

// Next.js App Router: app/api/verify-payment/route.ts
const verification = await verifyArcPayment({
  orderId: "0x...",
  merchant: "0xYourWalletAddress...",
  expectedAmount: 29.00,
  maxAgeSeconds: 3600, // Reject payments older than 1 hour
});

if (verification.isValid) {
  console.log("Verified on Arc:", verification.txHash);
  // Provision SaaS user account idempotently
}`;

  const sections = [
    {
      id: 'quickstart',
      title: 'Installation & quickstart',
      icon: Terminal,
      body: (
        <>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Install <code className="font-mono text-xs text-primary">@arcpay/sdk</code> and{' '}
            <code className="font-mono text-xs text-primary">viem</code> in your React,
            Next.js, or TypeScript application:
          </p>
          <CodeBlock
            code={quickstartCode}
            copyKey="install"
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-700/25 px-4 py-3 text-xs text-primary leading-relaxed flex gap-2.5">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>1-click checkout:</strong> because USDC is Arc&rsquo;s native gas
              asset, transactions execute via <code className="font-mono">msg.value</code>{' '}
              without ERC-20 <code className="font-mono">approve()</code> steps or
              paymasters.
            </span>
          </div>
        </>
      ),
    },
    {
      id: 'react-button',
      title: 'React component: <ArcPayButton />',
      icon: Code,
      body: (
        <>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Drop in the pre-built button component anywhere in your React application:
          </p>
          <CodeBlock
            code={reactCode}
            copyKey="btn-react"
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />

          <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
            Props reference
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="bg-white/60 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Prop</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Default</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">merchant</td>
                  <td className="p-3 font-mono">Address</td>
                  <td className="p-3">Required</td>
                  <td className="p-3">Merchant recipient wallet address</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">amount</td>
                  <td className="p-3 font-mono">number | string</td>
                  <td className="p-3">Required</td>
                  <td className="p-3">USDC amount (e.g. 29.00)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">item</td>
                  <td className="p-3 font-mono">string</td>
                  <td className="p-3">&quot;One-Time Purchase&quot;</td>
                  <td className="p-3">Product name shown in checkout modal</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">theme</td>
                  <td className="p-3 font-mono">&apos;emerald&apos; | &apos;dark&apos; | &apos;light&apos; | &apos;minimal&apos;</td>
                  <td className="p-3">&apos;emerald&apos;</td>
                  <td className="p-3">Visual button styling theme</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">metadata</td>
                  <td className="p-3 font-mono">object | string</td>
                  <td className="p-3">undefined</td>
                  <td className="p-3">Arbitrary metadata JSON string/object</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'web-component',
      title: 'Universal web component: <arc-pay-button>',
      icon: Layers,
      body: (
        <>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            For non-React platforms like Webflow, Shopify, WordPress, or vanilla HTML:
          </p>
          <CodeBlock
            code={webComponentCode}
            copyKey="btn-wc"
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
        </>
      ),
    },
    {
      id: 'use-checkout',
      title: 'useCheckout() hook',
      icon: MousePointerClick,
      body: (
        <>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Build a fully custom checkout UI with programmatic control:
          </p>
          <CodeBlock
            code={hookCode}
            copyKey="btn-hook"
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
        </>
      ),
    },
    {
      id: 'server-verification',
      title: 'Backend verification: verifyArcPayment()',
      icon: ShieldCheck,
      body: (
        <>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            SaaS backends should verify payment receipts with a single
            cryptographic RPC check on Arc before provisioning service access:
          </p>
          <CodeBlock
            code={serverCode}
            copyKey="btn-server"
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
        </>
      ),
    },
    {
      id: 'network',
      title: 'Arc network parameters',
      icon: Zap,
      body: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-white/70 p-5 space-y-2 font-mono text-xs">
            <div className="text-emerald-700 font-bold mb-3 font-sans text-sm">
              Arc Testnet
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chain ID:</span>
              <span className="text-foreground">5042002</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RPC URL:</span>
              <span className="text-foreground truncate">https://rpc.testnet.arc.io</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas asset:</span>
              <span className="text-primary">USDC (18 decimals)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Explorer:</span>
              <span className="text-foreground truncate">
                <a
                  href="https://explorer.testnet.arc.io"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  explorer.testnet.arc.io
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Faucet:</span>
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                faucet.circle.com
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white/70 p-5 space-y-2 font-mono text-xs">
            <div className="text-foreground font-bold mb-3 font-sans text-sm">
              Arc Mainnet
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chain ID:</span>
              <span className="text-foreground">5042</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RPC URL:</span>
              <span className="text-foreground truncate">https://rpc.mainnet.arc.io</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas asset:</span>
              <span className="text-primary">USDC (18 decimals)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Explorer:</span>
              <span className="text-foreground truncate">https://explorer.arc.io</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol fee:</span>
              <span className="text-primary">0.40% (40 bps)</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="pt-28 pb-16 min-h-[85vh] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <Eyebrow className="mb-4">Documentation</Eyebrow>
          <h1 className="text-3xl sm:text-5xl font-sentient text-foreground tracking-tight">
            Developer guides &amp;{' '}
            <i className="font-light italic text-primary">SDK reference</i>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
            Everything you need to accept native USDC payments on Arc Layer-1
            with 0.40% protocol fees and ~600ms finality.
          </p>
        </div>

        <div className="space-y-12">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <section
                key={s.id}
                id={s.id}
                className="rounded-2xl border border-border bg-card p-6 sm:p-8 scroll-mt-28"
              >
                <h2 className="font-sentient text-xl text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-700/20 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="text-primary font-mono text-sm mr-2">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.title}
                  </span>
                </h2>
                {s.body}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}