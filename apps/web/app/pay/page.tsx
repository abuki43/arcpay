'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import confetti from 'canvas-confetti';
import { useCheckout } from '@arcpay/sdk/react';
import {
  formatUsdc,
  shortenAddress,
  calculateArcFee,
  getExplorerTxUrl,
  parseUsdc,
} from '@arcpay/sdk';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Wallet,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

function PayContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { checkout, isConnecting, isPaying, isSuccess, error, receipt } = useCheckout();

  const merchant = searchParams.get('merchant') || '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D';
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
        colors: ['#10b981', '#059669', '#3b82f6', '#34d399'],
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
    <div className="min-h-[85vh] py-16 px-4 flex items-center justify-center bg-[#070a12] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Zap className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base">ArcPay</span>
              <span className="text-[10px] text-emerald-400 block font-semibold leading-none mt-0.5">
                {chainId === 5042 ? 'Arc Mainnet' : 'Arc Testnet'}
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-mono">
            0.40% Protocol Fee
          </Badge>
        </div>

        {/* Dynamic State: Settled */}
        {isSuccess && receipt ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-1">Payment Settled!</h2>
            <p className="text-xs text-slate-400 mb-6">Confirmed in ~600ms on Arc Layer-1</p>

            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-xs text-left space-y-2.5 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="text-emerald-400 font-bold">${parsedAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant:</span>
                <span className="text-white">{shortenAddress(merchant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="text-white">{receipt.orderId.slice(0, 14)}...</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-slate-500">Tx Hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">{receipt.txHash.slice(0, 10)}...</span>
                  <button
                    onClick={() => handleCopy(receipt.txHash)}
                    className="text-slate-500 hover:text-white"
                  >
                    {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <a
              href={getExplorerTxUrl(chainId, receipt.txHash)}
              target="_blank"
              rel="noreferrer"
              className="block mb-4"
            >
              <Button
                variant="outline"
                className="w-full bg-slate-950 border-white/10 hover:bg-slate-900 text-xs text-slate-300 flex items-center justify-center gap-1.5"
              >
                <span>View on ArcScan Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        ) : (
          /* Checkout State */
          <div>
            {/* Order Card */}
            <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 mb-6 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Amount Due
              </div>
              <div className="text-4xl font-black text-white font-mono mb-2">
                ${parsedAmount.toFixed(2)}{' '}
                <span className="text-base font-normal text-emerald-400 font-sans">USDC</span>
              </div>
              <h3 className="font-bold text-base text-slate-200 mb-1">{item}</h3>
              <p className="text-xs text-slate-500">Merchant: {shortenAddress(merchant)}</p>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[11px] text-slate-400">
                <span>Protocol Fee (0.4%): ${feeInfo.formattedFee}</span>
                <span className="text-emerald-400">Pure Native USDC Gas</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              disabled={isConnecting || isPaying}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-6 rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 text-base transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>
                {isConnecting
                  ? 'Connecting Wallet...'
                  : isPaying
                  ? 'Confirming on Arc (~600ms)...'
                  : `Pay $${parsedAmount.toFixed(2)} USDC`}
              </span>
            </Button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero ERC-20 approvals required • Non-Custodial</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HostedPayPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-slate-400">Loading Checkout...</div>}>
      <PayContent />
    </Suspense>
  );
}
