'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import confetti from 'canvas-confetti';
import { useCheckout } from '@arcpay/sdk/react';
import {
  shortenAddress,
  getExplorerTxUrl,
} from '@arcpay/sdk';
import { Button } from '@/components/ui/button';
import { DEFAULT_APP_CHAIN_ID } from '@/lib/chain-config';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

const CONFETTI_COLORS = ['#F5A524', '#E89216', '#FFCB6B', '#FFFFFF'];

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
  // NOTE: chainId comes from the query string, not wagmi, so it can be absent.
  // Fall back to the configured default rather than a hardcoded testnet id —
  // otherwise a link without ?chainId= settles on the wrong network.
  const chainId = chainIdStr
    ? parseInt(chainIdStr, 10)
    : DEFAULT_APP_CHAIN_ID;
  const metadataRaw = searchParams.get('metadata');

  const [copiedTx, setCopiedTx] = useState(false);

  const parsedAmount = parseFloat(amountStr) || 0;

  useEffect(() => {
    if (isSuccess && receipt) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS,
      });
      fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.txHash,
          orderId: receipt.orderId,
          chainId,
          metadata: metadataRaw ? { raw: metadataRaw } : { item },
        }),
      }).catch((err) => console.error('Settlement sync error:', err));
    }
  }, [isSuccess, receipt, chainId, metadataRaw, item]);

  const handlePay = async () => {
    try {
      const activeRpc = chainId === 5042
        ? process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL
        : process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL;
      await checkout({
        merchant: merchant as `0x${string}`,
        amount: parsedAmount,
        item,
        metadata: metadataRaw || undefined,
        chainId,
        rpcUrl: activeRpc || undefined,
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
    <div className="min-h-[85vh] pt-28 pb-20 px-4 flex items-center justify-center relative">
      <div className="max-w-md w-full rounded-ctl border border-line bg-surface p-6 sm:p-8 relative z-10">
        <div className="flex items-center justify-between pb-5 border-b border-line mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-ctl bg-accent flex items-center justify-center text-canvas">
              <Zap className="w-4 h-4 fill-canvas" />
            </div>
            <div>
              <span className="text-h6 font-semibold text-ink block leading-tight">ArcPay</span>
              <span className="text-nano uppercase tracking-mono-cap text-accent block leading-none mt-0.5">
                {chainId === 5042 ? 'Arc Mainnet' : 'Arc Testnet'}
              </span>
            </div>
          </div>
        </div>

        {isSuccess && receipt ? (
          <div className="text-center py-2">
            <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" strokeWidth={1.2} />
            <h2 className="text-h4 font-semibold text-ink mb-1">Payment settled</h2>
            <p className="text-tiny text-ink-3 mb-6">Confirmed in ~600ms on Arc Layer-1</p>

            <div className="rounded-ctl border border-line bg-raised p-4 text-tiny text-left space-y-2.5 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-ink-3">Amount paid</span>
                <span className="text-accent font-medium tabular-nums">${parsedAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Merchant</span>
                <span className="text-ink">{shortenAddress(merchant)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Order ID</span>
                <span className="text-ink">{receipt.orderId.slice(0, 14)}…</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-line">
                <span className="text-ink-3">Tx hash</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-ink">{receipt.txHash.slice(0, 10)}…</span>
                  <button onClick={() => handleCopy(receipt.txHash)} className="text-ink-3 hover:text-accent">
                    {copiedTx ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <a href={getExplorerTxUrl(chainId, receipt.txHash)} target="_blank" rel="noreferrer" className="block">
              <Button variant="outline" className="w-full text-tiny gap-1.5">
                <span>View on ArcScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        ) : (
          <div>
            <div className="rounded-ctl border border-line bg-raised p-5 mb-6 text-center">
              <div className="text-nano font-medium uppercase tracking-mono-cap text-ink-3 mb-1">Amount due</div>
              <div className="font-mono text-h1 font-semibold text-ink mb-2 tabular-nums leading-none">
                ${parsedAmount.toFixed(2)} <span className="text-h5 text-accent">USDC</span>
              </div>
              <h3 className="text-body font-medium text-ink mb-1">{item}</h3>
              <p className="text-tiny text-ink-3">Merchant: {shortenAddress(merchant)}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-ctl bg-danger/10 border border-danger/20 text-danger text-tiny flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}

            <Button onClick={handlePay} disabled={isConnecting || isPaying} size="lg" className="w-full gap-2">
              <Zap className="w-4 h-4 fill-canvas" />
              <span>
                {isConnecting
                  ? 'Connecting wallet…'
                  : isPaying
                  ? 'Confirming on Arc (~600ms)…'
                  : `Pay $${parsedAmount.toFixed(2)} USDC`}
              </span>
            </Button>

            <div className="mt-5 flex items-center justify-center gap-2 text-tiny text-ink-3">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>Zero ERC-20 approvals · non-custodial</span>
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
        <div className="text-center py-24 text-ink-3 text-tiny">Loading checkout…</div>
      }
    >
      <PayContent />
    </Suspense>
  );
}
