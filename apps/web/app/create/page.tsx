'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eyebrow } from '@/components/eyebrow';
import {
  createPayLinkUrl,
  calculateArcFee,
  shortenAddress,
} from '@arcpay/sdk';
import {
  Zap,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Share2,
} from 'lucide-react';

export default function PayLinkStudioPage() {
  const { address } = useAccount();

  const [merchant, setMerchant] = useState<string>(
    '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D'
  );
  const [amount, setAmount] = useState<string>('29.00');
  const [item, setItem] = useState<string>('Freelance Design Sprint');
  const [description, setDescription] = useState<string>(
    'Final vector deliverables + Figma license'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>('https://arcpay.network');

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
    <div className="pt-28 pb-16 min-h-[85vh] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <Eyebrow className="mb-4">No-code studio</Eyebrow>
          <h1 className="text-3xl sm:text-5xl font-sentient text-foreground tracking-tight">
            Create a 1-click <i className="font-light italic text-primary">PayLink</i>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 leading-relaxed">
            Generate shareable payment links and QR codes for digital products,
            consulting invoices, and client deposits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Builder */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-sentient text-foreground mb-6 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span>Payment details</span>
            </h2>

            <div className="space-y-5">
              {/* Field 1: Merchant Wallet */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-foreground/80">
                    Recipient merchant wallet
                  </label>
                  {address && (
                    <button
                      type="button"
                      onClick={() => setMerchant(address)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Use connected ({shortenAddress(address)})
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {/* Field 2: Amount */}
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                  Amount (USDC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60 font-mono text-xs">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="29.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="font-mono text-sm pl-8 font-bold"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5 px-1 font-mono tabular-nums">
                  <span>Protocol fee (0.4%): ${feeBreakdown.formattedFee}</span>
                  <span className="text-primary font-semibold">
                    Net to you: ${feeBreakdown.formattedNet} USDC
                  </span>
                </div>
              </div>

              {/* Field 3: Item */}
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                  Item / service name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Design Retainer, API Pro Plan"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Field 4: Description */}
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">
                  Order metadata / description (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Invoice #1042, Client: Acme Corp"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Generated Link Output */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-xs font-semibold text-foreground/80 mb-2">
                Shareable 1-click PayLink
              </div>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={payLinkUrl}
                  className="font-mono text-xs text-primary select-all"
                />
                <Button
                  onClick={handleCopy}
                  className="px-4 flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Perforated Invoice Preview */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/70">
                Customer preview
              </span>
              <Badge variant="emerald" className="text-[10px]">
                LIVE
              </Badge>
            </div>

            <div className="rounded-2xl bg-white border border-border shadow-[0_24px_70px_rgba(14,122,84,0.10)] rotate-[0.5deg] transition-transform duration-300 hover:rotate-0">
              {/* Invoice header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-dashed border-emerald-700/25">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      ArcPay invoice
                    </div>
                    <div className="text-sm font-sentient text-foreground leading-tight">
                      ArcPay Protocol
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  #PAY-{Date.now().toString().slice(-5)}
                </Badge>
              </div>

              <div className="px-6 py-5 text-center">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Amount due
                </div>
                <div className="font-mono text-4xl font-extrabold text-foreground tabular-nums mb-1">
                  ${numAmount.toFixed(2)}{' '}
                  <span className="text-sm font-sans font-normal text-primary">USDC</span>
                </div>
                <h3 className="font-sentient text-base text-foreground mb-1">
                  {item || 'Purchase item'}
                </h3>
                <p className="text-xs text-muted-foreground mb-5">
                  {description || '1-click payment via Arc Network'}
                </p>

                <div className="bg-white rounded-xl inline-block border border-border p-3 mb-4">
                  <QRCodeSVG value={payLinkUrl} size={120} level="M" />
                </div>

                <div className="text-[11px] text-muted-foreground mb-5">
                  Settles to: {shortenAddress(merchant)}
                </div>

                {/* Perforation seam */}
                <div className="relative mb-5">
                  <div className="border-t border-dashed border-emerald-700/25" />
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-background" aria-hidden />
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <Share2 className="w-3.5 h-3.5 text-primary" />
                  Scan with mobile wallet or open the link directly
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <a href={payLinkUrl} target="_blank" rel="noreferrer" className="block">
                <Button className="w-full py-6 flex items-center justify-center gap-2">
                  <span>Test hosted checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
              <Button variant="outline" onClick={handleCopy} className="w-full py-4 text-xs">
                {copied ? 'Link copied to clipboard' : 'Copy shareable PayLink'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}