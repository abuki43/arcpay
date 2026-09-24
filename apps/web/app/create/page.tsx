'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createPayLinkUrl, calculateArcFee, shortenAddress } from '@arcpay/sdk';
import {
  Zap,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Sparkles,
  DollarSign,
  User,
  FileText,
  Share2,
  Percent,
} from 'lucide-react';

export default function PayLinkStudioPage() {
  const { address } = useAccount();

  const [merchant, setMerchant] = useState<string>('0xf46b169915c5820E9FcdcD79F5AA5B246E32220D');
  const [amount, setAmount] = useState<string>('29.00');
  const [item, setItem] = useState<string>('Freelance Design Sprint');
  const [description, setDescription] = useState<string>('Final vector deliverables + Figma license');
  const [copied, setCopied] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('https://arcpay.network');

  // Auto-populate merchant if wallet connects
  useEffect(() => {
    if (address) {
      setMerchant(address);
    }
  }, [address]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const numAmount = parseFloat(amount) || 0;
  const feeBreakdown = calculateArcFee(numAmount);

  const payLinkUrl = createPayLinkUrl(origin, {
    merchant: merchant || '0x0000000000000000000000000000000000000000',
    amount: amount || '0',
    item: item || undefined,
    metadata: description ? { description } : undefined,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(payLinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-12 bg-[#070a12] min-h-[85vh] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs mb-3">
            NO-CODE STUDIO
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Create a 1-Click <span className="text-emerald-400">PayLink</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Generate shareable payment links and QR codes for digital products, consulting invoices, and client deposits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Builder */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Payment Details</span>
            </h2>

            <div className="space-y-5">
              {/* Field 1: Merchant Wallet */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Recipient Merchant Wallet</label>
                  {address && (
                    <button
                      type="button"
                      onClick={() => setMerchant(address)}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Use Connected ({shortenAddress(address)})
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="bg-slate-950/80 border-white/10 font-mono text-xs text-white"
                />
              </div>

              {/* Field 2: Amount & Currency */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Amount (USDC)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="29.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-slate-950/80 border-white/10 font-mono text-sm pl-9 text-white font-bold"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 px-1">
                  <span>Protocol Fee (0.4%): ${feeBreakdown.formattedFee}</span>
                  <span className="text-emerald-400 font-semibold">
                    Net to You: ${feeBreakdown.formattedNet} USDC
                  </span>
                </div>
              </div>

              {/* Field 3: Item Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Item / Service Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Design Retainer, API Pro Plan"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="bg-slate-950/80 border-white/10 text-xs text-white"
                />
              </div>

              {/* Field 4: Description / Metadata */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Order Metadata / Description (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Invoice #1042, Client: Acme Corp"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-950/80 border-white/10 text-xs text-white"
                />
              </div>
            </div>

            {/* Generated Link Output */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs font-semibold text-slate-300 mb-2">Shareable 1-Click PayLink</div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={payLinkUrl}
                  className="bg-slate-950 border-emerald-500/30 text-emerald-400 font-mono text-xs select-all"
                />
                <Button
                  onClick={handleCopy}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Live Customer Preview Card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Customer Checkout Preview
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                LIVE
              </Badge>
            </div>

            {/* Customer Facing Card */}
            <div className="rounded-xl bg-slate-950 border border-white/10 p-5 mb-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 fill-emerald-400" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">{item || 'Purchase Item'}</h3>
              <p className="text-xs text-slate-400 mb-4">{description || '1-Click payment via Arc Network'}</p>

              <div className="text-3xl font-extrabold text-emerald-400 font-mono mb-1">
                ${numAmount.toFixed(2)} <span className="text-xs font-sans text-slate-400 font-normal">USDC</span>
              </div>
              <div className="text-[11px] text-slate-500 mb-6">Settles to: {shortenAddress(merchant)}</div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-xl inline-block shadow-lg mb-6">
                <QRCodeSVG value={payLinkUrl} size={130} level="M" />
              </div>

              <div className="text-[11px] text-slate-400">
                Scan with mobile wallet or open link directly
              </div>
            </div>

            <div className="space-y-3">
              <a href={payLinkUrl} target="_blank" rel="noreferrer" className="block">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  <span>Test Hosted Checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>

              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full bg-slate-900 border-white/10 hover:bg-slate-800 text-slate-300 text-xs py-4"
              >
                {copied ? 'Link Copied to Clipboard!' : 'Copy Shareable PayLink'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
