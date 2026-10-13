'use client';

import React, { useState } from 'react';
import { Eyebrow } from '@/components/eyebrow';
import { Reveal } from '@/components/motion';
import { Input } from '@/components/ui/input';
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
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-chip border border-line bg-raised px-2.5 h-7 text-tiny text-ink-2 hover:text-ink hover:border-line-strong transition-colors font-mono"
      >
        {copiedKey === copyKey ? (
          <Check className="w-3 h-3 text-accent" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
        <span>{copiedKey === copyKey ? 'Copied' : 'Copy'}</span>
      </button>
      <pre className="p-4 rounded-ctl bg-raised font-mono text-tiny text-ink overflow-x-auto leading-relaxed border border-line">
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
  theme="instrument"
  onSuccess={(receipt) => {
    console.log("Paid in ~600ms:", receipt.txHash);
  }}
  onError={(err) => console.error(err)}
/>`;
  const webComponentCode = `<script type="module" src="https://unpkg.com/@arcpay/sdk/dist/element.js"></script>

<arc-pay-button
  merchant="0xYourWalletAddress..."
  amount="29.00"
  item="Digital Download"
  theme="instrument"
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
      rpcUrl: "https://arc-testnet.g.alchemy.com/v2/API_KEY",
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
          <p className="text-body text-ink-3 mb-5 leading-relaxed">
            Install <code className="font-mono text-tiny text-accent">@arcpay/sdk</code> and{' '}
            <code className="font-mono text-tiny text-accent">viem</code> in your React,
            Next.js, or TypeScript application.
          </p>
          <CodeBlock code={quickstartCode} copyKey="install" onCopy={handleCopy} copiedKey={copiedKey} />
          <div className="mt-5 rounded-ctl bg-accent/10 border border-accent/30 px-4 py-3 text-tiny text-ink leading-relaxed flex gap-2.5">
            <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>
              <strong className="text-accent">1-click checkout:</strong> because USDC is Arc's
              native gas asset, transactions execute via{' '}
              <code className="font-mono text-tiny text-ink">msg.value</code> without
              ERC-20 <code className="font-mono text-tiny text-ink">approve()</code> steps.
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
          <p className="text-body text-ink-3 mb-5 leading-relaxed">
            Drop in the pre-built button component anywhere in your React application.
          </p>
          <CodeBlock code={reactCode} copyKey="btn-react" onCopy={handleCopy} copiedKey={copiedKey} />

          <h3 className="text-tiny font-medium uppercase tracking-mono-cap text-ink-2 mb-3 mt-7">
            Props reference
          </h3>
          <div className="overflow-x-auto rounded-ctl border border-line">
            <table className="w-full text-left text-tiny">
              <thead className="bg-raised text-ink-3 font-mono border-b border-line">
                <tr>
                  <th className="p-3 font-medium">Prop</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Default</th>
                  <th className="p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-ink-2">
                {[
                  ['merchant', 'Address', 'Required', 'Merchant recipient wallet address'],
                  ['amount', 'number | string', 'Required', 'USDC amount (e.g. 29.00)'],
                  ['item', 'string', '"One-Time Purchase"', 'Product name shown in checkout modal'],
                  ['theme', "'emerald' | 'dark' | 'light' | 'minimal'", "'emerald'", 'Visual button styling theme'],
                  ['metadata', 'object | string', 'undefined', 'Arbitrary metadata JSON string/object'],
                ].map((row) => (
                  <tr key={row[0]} className="hover:bg-raised/40">
                    <td className="p-3 text-accent">{row[0]}</td>
                    <td className="p-3 text-ink">{row[1]}</td>
                    <td className="p-3 text-ink-2">{row[2]}</td>
                    <td className="p-3 text-ink-2 font-sans">{row[3]}</td>
                  </tr>
                ))}
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
          <p className="text-body text-ink-3 mb-5 leading-relaxed">
            For non-React platforms like Webflow, Shopify, WordPress, or vanilla HTML.
          </p>
          <CodeBlock code={webComponentCode} copyKey="btn-wc" onCopy={handleCopy} copiedKey={copiedKey} />
        </>
      ),
    },
    {
      id: 'use-checkout',
      title: 'useCheckout() hook',
      icon: MousePointerClick,
      body: (
        <>
          <p className="text-body text-ink-3 mb-5 leading-relaxed">
            Build a fully custom checkout UI with programmatic control.
          </p>
          <CodeBlock code={hookCode} copyKey="btn-hook" onCopy={handleCopy} copiedKey={copiedKey} />
        </>
      ),
    },
    {
      id: 'server-verification',
      title: 'Backend verification: verifyArcPayment()',
      icon: ShieldCheck,
      body: (
        <>
          <p className="text-body text-ink-3 mb-5 leading-relaxed">
            SaaS backends should verify payment receipts with a single
            cryptographic RPC check on Arc before provisioning service access.
          </p>
          <CodeBlock code={serverCode} copyKey="btn-server" onCopy={handleCopy} copiedKey={copiedKey} />
        </>
      ),
    },
    {
      id: 'network',
      title: 'Arc network parameters',
      icon: Zap,
      body: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line rounded-ctl overflow-hidden">
          <div className="bg-raised p-5 space-y-2 font-mono text-tiny">
            <div className="text-accent font-medium mb-3 font-sans text-tiny uppercase tracking-mono-cap">
              Arc Testnet
            </div>
            <div className="flex justify-between"><span className="text-ink-3">Chain ID</span><span className="text-ink">5042002</span></div>
            <div className="flex justify-between"><span className="text-ink-3">RPC URL</span><span className="text-ink truncate">https://rpc.testnet.arc.io</span></div>
            <div className="flex justify-between"><span className="text-ink-3">Gas asset</span><span className="text-accent">USDC · 18d</span></div>
            <div className="flex justify-between">
              <span className="text-ink-3">Explorer</span>
              <a href="https://explorer.testnet.arc.io" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:text-accent-2">
                explorer.testnet.arc.io<ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-3">Faucet</span>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="text-accent hover:text-accent-2">faucet.circle.com</a>
            </div>
          </div>
          <div className="bg-raised p-5 space-y-2 font-mono text-tiny">
            <div className="text-ink font-medium mb-3 font-sans text-tiny uppercase tracking-mono-cap">
              Arc Mainnet
            </div>
            <div className="flex justify-between"><span className="text-ink-3">Chain ID</span><span className="text-ink">5042</span></div>
            <div className="flex justify-between"><span className="text-ink-3">RPC URL</span><span className="text-ink truncate">https://rpc.mainnet.arc.io</span></div>
            <div className="flex justify-between"><span className="text-ink-3">Gas asset</span><span className="text-accent">USDC · 18d</span></div>
            <div className="flex justify-between"><span className="text-ink-3">Explorer</span><span className="text-ink">https://explorer.arc.io</span></div>
            <div className="flex justify-between"><span className="text-ink-3">Protocol fee</span><span className="text-accent">0.40% (40 bps)</span></div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="pt-28 pb-20 min-h-[85vh]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <Reveal className="max-w-2xl mb-12">
          <Eyebrow className="mb-4">Documentation</Eyebrow>
          <h1 className="text-h1 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Developer guides &amp;{' '}
            <span className="font-medium italic text-accent">SDK reference</span>.
          </h1>
        </Reveal>

        <div className="space-y-px bg-line border border-line rounded-ctl overflow-hidden">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <section key={s.id} id={s.id} className="bg-canvas p-6 sm:p-8 scroll-mt-28">
                <h2 className="text-h5 font-medium text-ink mb-5 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-ctl bg-raised border border-line text-accent flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-mono text-tiny text-accent">{String(i + 1).padStart(2, '0')}</span>
                  <span>{s.title}</span>
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
