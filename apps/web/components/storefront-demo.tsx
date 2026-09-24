'use client';

import React, { useState } from 'react';
import { ArcPayButton } from '@arcpay/sdk/react';
import confetti from 'canvas-confetti';
import { Pill } from './pill';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Check, Copy, Zap, Code, ShieldCheck, Sparkles, Terminal, ExternalLink } from 'lucide-react';

const DEMO_MERCHANT = '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D';

export function StorefrontDemo() {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const handlePaymentSuccess = (receipt: any) => {
    setLastReceipt(receipt);
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#3b82f6', '#34d399'],
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const reactCodeSnippet = `import { ArcPayButton } from '@arcpay/sdk/react';

export function PricingCard() {
  return (
    <ArcPayButton
      merchant="${DEMO_MERCHANT}"
      amount={29.00}
      item="CloudAI Pro Plan"
      metadata={{ userId: "usr_4021", plan: "pro_monthly" }}
      theme="emerald"
      onSuccess={(receipt) => {
        console.log("Settled on Arc in ~600ms:", receipt.txHash);
        // Provision SaaS access immediately
      }}
      onError={(err) => console.error("Payment failed:", err)}
    />
  );
}`;

  const webComponentSnippet = `<!-- Add ArcPay script once to your <head> or HTML -->
<script type="module" src="https://unpkg.com/@arcpay/sdk/dist/element.js"></script>

<!-- Drop in the web component anywhere (Webflow, Shopify, WordPress) -->
<arc-pay-button
  merchant="${DEMO_MERCHANT}"
  amount="29.00"
  item="CloudAI Pro Plan"
  theme="emerald"
  metadata='{"plan":"pro_monthly"}'
></arc-pay-button>

<script>
  document.querySelector('arc-pay-button').addEventListener('arcpay:success', (e) => {
    console.log('Payment Settled:', e.detail.txHash);
  });
</script>`;

  const hookSnippet = `import { useCheckout } from '@arcpay/sdk/react';

export function CustomCheckout() {
  const { checkout, isPaying, isSuccess, receipt } = useCheckout();

  const handlePay = async () => {
    const res = await checkout({
      merchant: "${DEMO_MERCHANT}",
      amount: 29.00,
      item: "Custom Bespoke SaaS Tier",
    });
    console.log("Receipt:", res);
  };

  return (
    <button onClick={handlePay} disabled={isPaying}>
      {isPaying ? "Settling on Arc..." : "Pay $29 USDC"}
    </button>
  );
}`;

  const serverVerificationSnippet = `// Next.js App Router: app/api/verify-payment/route.ts
import { NextResponse } from 'next/server';
import { verifyArcPayment } from '@arcpay/sdk/server';

export async function POST(req: Request) {
  const { orderId } = await req.json();

  // Cryptographic on-chain verification in <50ms
  const result = await verifyArcPayment({
    orderId,
    merchant: "${DEMO_MERCHANT}",
    expectedAmount: 29.00,
    maxAgeSeconds: 3600, // Reject payments older than 1 hour
  });

  if (!result.isValid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Idempotently activate SaaS subscription
  await activateUserPlan(result.metadata.userId, "pro");

  return NextResponse.json({
    success: true,
    txHash: result.txHash,
    settledAmount: result.formattedAmount,
  });
}`;

  return (
    <section id="demo" className="py-24 bg-[#050810] border-t border-white/10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Pill className="mb-4">[ LIVE STOREFRONT DEMO ]</Pill>
          <h2 className="text-4xl sm:text-5xl font-sentient text-white tracking-tight">
            Try the <i className="font-light italic text-emerald-400">1-Click</i> Checkout Flow
          </h2>
          <p className="font-mono text-xs sm:text-sm text-slate-400 mt-4 max-w-2xl mx-auto">
            Click any plan below to trigger the live `@arcpay/sdk` checkout modal. Pay with Circle Faucet USDC on Arc Testnet in ~600ms.
          </p>
        </div>

        {/* Live Notification Bar if paid */}
        {lastReceipt && (
          <div className="mb-10 max-w-2xl mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-emerald-500/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="text-sm font-bold text-emerald-300">Payment Settled Live on Arc!</div>
                <div className="text-xs text-slate-400 font-mono">Tx: {lastReceipt.txHash.slice(0, 16)}...</div>
              </div>
            </div>
            <a
              href={`https://explorer.testnet.arc.io/tx/${lastReceipt.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
            >
              <span>View on ArcScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* 3 Pricing Cards with Live <ArcPayButton /> */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Plan 1: Starter */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition-all backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-sentient font-bold text-white">Starter</h3>
                <span className="text-[11px] font-mono text-slate-400">HOBBY & INDIE</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white font-mono">$9.00</span>
                <span className="text-xs font-mono text-slate-400">USDC / mo</span>
              </div>
              <p className="font-mono text-xs text-slate-400 mb-6 leading-relaxed">
                Perfect for indie developers testing micro-services and Web3 SaaS prototypes.
              </p>

              <ul className="space-y-3 font-mono text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>10,000 API calls / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sub-second ~600ms settlement</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>0.40% Protocol fee ($0.036)</span>
                </li>
              </ul>
            </div>

            <div>
              <ArcPayButton
                merchant={DEMO_MERCHANT}
                amount={9.0}
                item="CloudAI Starter Plan"
                metadata={{ plan: 'starter', tier: 1 }}
                theme="light"
                size="md"
                className="w-full"
                onSuccess={handlePaymentSuccess}
              />
              <div className="text-[10px] font-mono text-slate-500 text-center mt-2">Zero token approvals required</div>
            </div>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(16,185,129,0.15)] backdrop-blur-xl scale-102">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-emerald-500 text-slate-950 font-mono font-black px-3 py-1 rounded-full text-[10px] tracking-wider uppercase shadow-md">
                ★ MOST POPULAR
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <h3 className="text-2xl font-sentient font-bold text-white flex items-center gap-1.5">
                  <span>Pro Plan</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">SCALING SAAS</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-emerald-400 font-mono">$29.00</span>
                <span className="text-xs font-mono text-slate-400">USDC / mo</span>
              </div>
              <p className="font-mono text-xs text-slate-300 mb-6 leading-relaxed">
                Complete developer infrastructure for high-growth SaaS and automated agent platforms.
              </p>

              <ul className="space-y-3 font-mono text-xs text-slate-200 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                  <span className="font-semibold">Unlimited API requests</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                  <span className="font-semibold">Direct merchant payout (99.6%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                  <span className="font-semibold">PayLink Studio generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                  <span className="font-semibold">Server verification SDK</span>
                </li>
              </ul>
            </div>

            <div>
              <ArcPayButton
                merchant={DEMO_MERCHANT}
                amount={29.0}
                item="CloudAI Pro Plan"
                metadata={{ plan: 'pro', tier: 2 }}
                theme="emerald"
                size="lg"
                className="w-full shadow-lg shadow-emerald-500/20"
                onSuccess={handlePaymentSuccess}
              />
              <div className="text-[10px] font-mono text-emerald-400 text-center mt-2 font-semibold">
                ⚡ 1-Click checkout with pure native USDC
              </div>
            </div>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition-all backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-sentient font-bold text-white">Enterprise</h3>
                <span className="text-[11px] font-mono text-slate-400">PLATFORMS & SCALE</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white font-mono">$99.00</span>
                <span className="text-xs font-mono text-slate-400">USDC / mo</span>
              </div>
              <p className="font-mono text-xs text-slate-400 mb-6 leading-relaxed">
                For platforms needing affiliate revenue splits, marketplace payouts, and custom routing.
              </p>

              <ul className="space-y-3 font-mono text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Affiliate / split payment routing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time WebSocket event streaming</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dedicated Arc RPC node routing</span>
                </li>
              </ul>
            </div>

            <div>
              <ArcPayButton
                merchant={DEMO_MERCHANT}
                amount={99.0}
                item="CloudAI Enterprise Plan"
                metadata={{ plan: 'enterprise', tier: 3 }}
                theme="dark"
                size="md"
                className="w-full border border-white/20"
                onSuccess={handlePaymentSuccess}
              />
              <div className="text-[10px] font-mono text-slate-500 text-center mt-2">Zero token approvals required</div>
            </div>
          </div>
        </div>

        {/* Developer Integration Code Box */}
        <div className="bg-slate-950/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 bg-slate-900/60 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                Integration Snippets (&lt; 2 Minutes)
              </span>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="react" className="w-full">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <TabsList className="bg-slate-900 border border-white/10 font-mono">
                  <TabsTrigger value="react" className="text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950">
                    React Component
                  </TabsTrigger>
                  <TabsTrigger value="webcomponent" className="text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950">
                    Web Component
                  </TabsTrigger>
                  <TabsTrigger value="hook" className="text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950">
                    useCheckout() Hook
                  </TabsTrigger>
                  <TabsTrigger value="server" className="text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-slate-950">
                    Server Verification
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* React Tab */}
              <TabsContent value="react" className="mt-0 relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => copyToClipboard(reactCodeSnippet, 'react')}
                    className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1"
                  >
                    {copiedTab === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTab === 'react' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
                  <code>{reactCodeSnippet}</code>
                </pre>
              </TabsContent>

              {/* Web Component Tab */}
              <TabsContent value="webcomponent" className="mt-0 relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => copyToClipboard(webComponentSnippet, 'wc')}
                    className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1"
                  >
                    {copiedTab === 'wc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTab === 'wc' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
                  <code>{webComponentSnippet}</code>
                </pre>
              </TabsContent>

              {/* Hook Tab */}
              <TabsContent value="hook" className="mt-0 relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => copyToClipboard(hookSnippet, 'hook')}
                    className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1"
                  >
                    {copiedTab === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTab === 'hook' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
                  <code>{hookSnippet}</code>
                </pre>
              </TabsContent>

              {/* Server Tab */}
              <TabsContent value="server" className="mt-0 relative">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={() => copyToClipboard(serverVerificationSnippet, 'server')}
                    className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1"
                  >
                    {copiedTab === 'server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTab === 'server' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
                  <code>{serverVerificationSnippet}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </section>
  );
}
