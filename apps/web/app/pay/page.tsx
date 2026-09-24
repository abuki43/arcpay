'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import confetti from 'canvas-confetti';
import { useCheckout } from '@arcpay/sdk/react';
import {
  shortenAddress,
  calculateArcFee,
  getExplorerTxUrl,
} from '@arcpay/sdk';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

function PayContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { checkout, isConnecting, isPaying, isSuccess, error, receipt } =
    useCheckout();

  const merchant =
    searchParams.get('merchant') ||
    '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D';
  const amountStr = searchParams.get('amount') || '29.00';
  const item = searchParams.get('item') || 'One-Time Purchase';
  const chainIdStr = searchParams.get('chainId');
  const chainId = chainIdStr ? parseInt(chainIdStr, 10) : 5042002;
  const metadataRaw = searchParams.get('metadata');

  const [copiedTx, setCopiedTx] = useState(false);

  const parsedAmount = parseFloat(amountStr) || 0;
  const feeInfo = calculateArcFee(parsedAmount);

  useEffect(() => {
    if (isSuccess && receipt) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0E7A54', '#10B981', '#065F46', '#34D399'],
      });
    }
  }, [isSuccess, receipt]);

  const handlePay = async () => {
    try {
      await checkout({
        merchant: merchant as `0x${string}`,
        amount: parsedAmount,
        item,
        metadata: metadataRaw || undefined,
        chainId,
      });
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

  return (
    <div className="min-h-[85vh] pt-28 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="max-w-md w-full rounded-3xl border border-border bg-card p-6 sm:p-8 relative z-10 shadow-[0_2px_24px_rgba(14,122,84,0.06)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-sentient text-base text-foreground">
                ArcPay
              </span>
              <span className="text-[10px] text-primary block font-semibold leading-none mt-0.5">
                {chainId === 5042 ? 'Arc Mainnet' : 'Arc Testnet'}
              </span>
            </div>
          </div>
          <Badge className="text-[11px] font-mono" variant="secondary">
            0.40% protocol fee
          </Badge>
        </div>

        {/* Dynamic State: Settled */}
        {isSuccess && receipt ? (
          <div className="text-center py-4">
            <div>
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={1.2} />
            </div>
            <h2 className="font-sentient text-2xl text-foreground mb-1">
              Payment settled
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Confirmed in ~600ms on Arc Layer-1
            </p>

            <div className="rounded-2xl border border-border bg-white/70 p-4 text-xs text-left space-y-2.5 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount paid:</span>
                <span className="text-primary font-bold tabular-nums">
                  ${parsedAmount.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="text-foreground">{shortenAddress(merchant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="text-foreground">
                  {receipt.orderId.slice(0, 14)}...
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground">Tx hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground">{receipt.txHash.slice(0, 10)}...</span>
                  <button
                    onClick={() => handleCopy(receipt.txHash)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {copiedTx ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <a
              href={getExplorerTxUrl(chainId, receipt.txHash)}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full text-xs flex items-center justify-center gap-1.5"
              >
                <span>View on ArcScan explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        ) : (
          /* Checkout State */
          <div>
            {/* Order Card */}
            <div className="rounded-2xl border border-border bg-white/70 p-5 mb-6 text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
                Amount due
              </div>
              <div className="font-mono text-4xl font-extrabold text-foreground mb-2 tabular-nums">
                ${parsedAmount.toFixed(2)}{' '}
                <span className="text-base font-normal font-sans text-primary">USDC</span>
              </div>
              <h3 className="font-sentient text-base text-foreground mb-1">{item}</h3>
              <p className="text-xs text-muted-foreground">
                Merchant: {shortenAddress(merchant)}
              </p>

              <div className="mt-4 pt-4 border-t border-border flex justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
                <span>Protocol fee (0.4%): ${feeInfo.formattedFee}</span>
                <span className="text-primary">Pure native USDC gas</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              disabled={isConnecting || isPaying}
              className="w-full py-6 rounded-2xl text-base flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-white" />
              <span>
                {isConnecting
                  ? 'Connecting wallet...'
                  : isPaying
                  ? 'Confirming on Arc (~600ms)...'
                  : `Pay $${parsedAmount.toFixed(2)} USDC`}
              </span>
            </Button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Zero ERC-20 approvals required - non-custodial</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HostedPayPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-24 text-muted-foreground">
          Loading checkout...
        </div>
      }
    >
      <PayContent />
    </Suspense>
  );
}