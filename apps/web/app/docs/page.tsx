'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Copy,
  Check,
  Zap,
  Code,
  ShieldCheck,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export default function DocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="py-12 bg-[#070a12] min-h-[85vh] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[500px] bg-emerald-500/5 blur-[170px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs mb-3">
            DOCUMENTATION HUB
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Developer Guides & <span className="text-emerald-400">SDK Reference</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Everything you need to accept native USDC payments on Arc Layer-1 with 0.40% protocol fees and ~600ms finality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-12 space-y-12">
            {/* Section 1: Quickstart */}
            <section id="quickstart" className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <span>1. Installation & Quickstart</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Install `@arcpay/sdk` and `viem` in your React, Next.js, or TypeScript application:
              </p>

              <div className="relative mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy('pnpm add @arcpay/sdk viem', 'install')}
                  className="absolute top-3 right-3 bg-slate-900 border-white/10 text-xs text-slate-300"
                >
                  {copiedKey === 'install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1">{copiedKey === 'install' ? 'Copied' : 'Copy'}</span>
                </Button>
                <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 border border-white/5">
                  <code>pnpm add @arcpay/sdk viem</code>
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed">
                💡 <strong>1-Click Checkout:</strong> Because USDC is Arc's native gas asset, transactions execute via <code>msg.value</code> without requiring ERC-20 <code>approve()</code> steps or paymasters.
              </div>
            </section>

            {/* Section 2: React Button Component */}
            <section id="react-button" className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <span>2. React Component: &lt;ArcPayButton /&gt;</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6">
                Drop in the pre-built button component anywhere in your React application:
              </p>

              <div className="relative mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopy(
                      `import { ArcPayButton } from '@arcpay/sdk/react';\n\n<ArcPayButton\n  merchant="0xYourWalletAddress..."\n  amount={29.00}\n  item="CloudAI Pro Subscription"\n  metadata={{ userId: "usr_1042", plan: "pro" }}\n  theme="emerald"\n  onSuccess={(receipt) => console.log("Paid in ~600ms:", receipt.txHash)}\n  onError={(err) => console.error(err)}\n/>`,
                      'btn-react'
                    )
                  }
                  className="absolute top-3 right-3 bg-slate-900 border-white/10 text-xs text-slate-300"
                >
                  {copiedKey === 'btn-react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1">{copiedKey === 'btn-react' ? 'Copied' : 'Copy'}</span>
                </Button>
                <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300/90 border border-white/5 overflow-x-auto leading-relaxed">
                  <code>{`import { ArcPayButton } from '@arcpay/sdk/react';

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
/>`}</code>
                </pre>
              </div>

              {/* Props Table */}
              <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Props Reference</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border border-white/10 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-white/5">
                    <tr>
                      <th className="p-3">Prop</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Default</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="p-3 font-mono text-emerald-400">merchant</td>
                      <td className="p-3 font-mono">Address</td>
                      <td className="p-3">Required</td>
                      <td className="p-3">Merchant recipient wallet address</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400">amount</td>
                      <td className="p-3 font-mono">number | string</td>
                      <td className="p-3">Required</td>
                      <td className="p-3">USDC amount (e.g. 29.00)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400">item</td>
                      <td className="p-3 font-mono">string</td>
                      <td className="p-3">"One-Time Purchase"</td>
                      <td className="p-3">Product name shown in checkout modal</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400">theme</td>
                      <td className="p-3 font-mono">'emerald' | 'dark' | 'light' | 'minimal'</td>
                      <td className="p-3">'emerald'</td>
                      <td className="p-3">Visual button styling theme</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-emerald-400">metadata</td>
                      <td className="p-3 font-mono">object | string</td>
                      <td className="p-3">undefined</td>
                      <td className="p-3">Arbitrary metadata JSON string/object</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3: Universal Web Component */}
            <section id="web-component" className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>3. Universal Web Component: &lt;arc-pay-button&gt;</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6">
                For non-React platforms like Webflow, Shopify, WordPress, or Vanilla HTML:
              </p>

              <div className="relative mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopy(
                      `<script type="module" src="https://unpkg.com/@arcpay/sdk/dist/element.js"></script>\n\n<arc-pay-button\n  merchant="0xYourWalletAddress..."\n  amount="29.00"\n  item="Digital Download"\n  theme="emerald">\n</arc-pay-button>`,
                      'btn-wc'
                    )
                  }
                  className="absolute top-3 right-3 bg-slate-900 border-white/10 text-xs text-slate-300"
                >
                  {copiedKey === 'btn-wc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1">{copiedKey === 'btn-wc' ? 'Copied' : 'Copy'}</span>
                </Button>
                <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300/90 border border-white/5 overflow-x-auto leading-relaxed">
                  <code>{`<script type="module" src="https://unpkg.com/@arcpay/sdk/dist/element.js"></script>

<arc-pay-button
  merchant="0xYourWalletAddress..."
  amount="29.00"
  item="Digital Download"
  theme="emerald">
</arc-pay-button>`}</code>
                </pre>
              </div>
            </section>

            {/* Section 4: Server-Side Verification Engine */}
            <section id="server-verification" className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>4. Backend RPC Verification: verifyArcPayment()</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6">
                SaaS backends should verify payment receipts on Arc RPC before provisioning service access:
              </p>

              <div className="relative mb-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopy(
                      `import { verifyArcPayment } from '@arcpay/sdk/server';\n\nconst verification = await verifyArcPayment({\n  orderId: "0x...",\n  merchant: "0xYourWalletAddress...",\n  expectedAmount: 29.00,\n  maxAgeSeconds: 3600, // Max 1 hour age\n});\n\nif (verification.isValid) {\n  console.log("Verified on Arc in <50ms:", verification.txHash);\n}`,
                      'btn-server'
                    )
                  }
                  className="absolute top-3 right-3 bg-slate-900 border-white/10 text-xs text-slate-300"
                >
                  {copiedKey === 'btn-server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1">{copiedKey === 'btn-server' ? 'Copied' : 'Copy'}</span>
                </Button>
                <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300/90 border border-white/5 overflow-x-auto leading-relaxed">
                  <code>{`import { verifyArcPayment } from '@arcpay/sdk/server';

const verification = await verifyArcPayment({
  orderId: "0x...",
  merchant: "0xYourWalletAddress...",
  expectedAmount: 29.00,
  maxAgeSeconds: 3600, // Max 1 hour age
});

if (verification.isValid) {
  console.log("Verified on Arc in <50ms:", verification.txHash);
  // Provision SaaS user account
}`}</code>
                </pre>
              </div>
            </section>

            {/* Section 5: Network Parameters */}
            <section id="network" className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>5. Arc Network Parameters</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Testnet */}
                <div className="p-5 rounded-xl bg-slate-950 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="text-emerald-400 font-bold mb-3 font-sans text-sm">Arc Testnet</div>
                  <div className="flex justify-between"><span className="text-slate-500">Chain ID:</span> <span className="text-white">5042002</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">RPC URL:</span> <span className="text-white truncate">https://rpc.testnet.arc.io</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Gas Asset:</span> <span className="text-emerald-400">USDC (18 Decimals)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Explorer:</span> <span className="text-white truncate">https://explorer.testnet.arc.io</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Faucet:</span> <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">faucet.circle.com ↗</a></div>
                </div>

                {/* Mainnet */}
                <div className="p-5 rounded-xl bg-slate-950 border border-white/10 space-y-2 font-mono text-xs">
                  <div className="text-blue-400 font-bold mb-3 font-sans text-sm">Arc Mainnet</div>
                  <div className="flex justify-between"><span className="text-slate-500">Chain ID:</span> <span className="text-white">5042</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">RPC URL:</span> <span className="text-white truncate">https://rpc.mainnet.arc.io</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Gas Asset:</span> <span className="text-blue-400">USDC (18 Decimals)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Explorer:</span> <span className="text-white truncate">https://explorer.arc.io</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Protocol Fee:</span> <span className="text-white">0.40% (40 bps)</span></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
