'use client';

import React, { useState, useEffect, use } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useCheckout } from '@arcpay/sdk/react';
import {
  shortenAddress,
  calculateArcFee,
  getExplorerTxUrl,
} from '@arcpay/sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_APP_CHAIN_ID } from '@/lib/chain-config';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Layers,
  ArrowRight,
  Mail,
  MessageSquare,
} from 'lucide-react';

const CONFETTI_COLORS = ['#F5A524', '#E89216', '#FFCB6B', '#FFFFFF'];

interface PayLinkPlan {
  id: string;
  name: string;
  tag: string | null;
  amount: number;
  interval: string | null;
  description: string | null;
  features: string[];
  featured: boolean;
}

interface PayLinkData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  amount: number | null;
  active: boolean;
  collectEmail: boolean;
  collectDiscord: boolean;
  redirectUrl: string | null;
  merchant: { address: string; name: string | null };
  plans: PayLinkPlan[];
}

export default function HostedSlugPayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  // Deployment config decides the target network, not the wallet's current
  // chain. Reading useChainId() here let a wallet left on Arc Testnet settle
  // this PayLink against the testnet gateway and still show success.
  const chainId = DEFAULT_APP_CHAIN_ID;
  const { checkout, isConnecting, isPaying, isSuccess, error, receipt } = useCheckout();

  const [loading, setLoading] = useState(true);
  const [payLink, setPayLink] = useState<PayLinkData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [buyerHandle, setBuyerHandle] = useState<string>('');
  const [copiedTx, setCopiedTx] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function fetchLink() {
      try {
        setLoading(true);
        const res = await fetch(`/api/paylinks/${slug}`);
        const data = await res.json();
        if (res.ok && data.payLink) {
          setPayLink(data.payLink);
          if (data.payLink.plans && data.payLink.plans.length > 0) {
            const featIdx = data.payLink.plans.findIndex((p: PayLinkPlan) => p.featured);
            setSelectedPlanIndex(featIdx >= 0 ? featIdx : 0);
          }
        } else {
          setFetchError(data.error || 'PayLink not found or deactivated');
        }
      } catch (err: unknown) {
        setFetchError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [slug]);

  const activePlan = payLink?.plans?.[selectedPlanIndex];
  const currentAmount = payLink?.type === 'multi_plan'
    ? (activePlan?.amount || 0)
    : (payLink?.amount || 0);
  const feeInfo = calculateArcFee(currentAmount);

  useEffect(() => {
    if (isSuccess && receipt && payLink) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
      setIsSyncing(true);
      fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: receipt.txHash,
          orderId: receipt.orderId,
          slug: payLink.slug,
          planId: activePlan?.id || null,
          buyerEmail: buyerEmail || null,
          buyerHandle: buyerHandle || null,
          chainId: chainId,
          metadata: {
            title: payLink.title,
            planName: activePlan?.name || null,
            buyerEmail: buyerEmail || null,
            buyerHandle: buyerHandle || null,
          },
        }),
      })
        .catch((err) => console.error('Settlement sync error:', err))
        .finally(() => setIsSyncing(false));
    }
  }, [isSuccess, receipt, payLink, activePlan, buyerEmail, buyerHandle, chainId]);

  const handlePay = async () => {
    if (!payLink) return;
    if (payLink.collectEmail && !buyerEmail) {
      toast.error('Please provide your email address for order fulfillment');
      return;
    }
    try {
      const targetRpc = chainId === 5042
        ? process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL
        : process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL;
      await checkout({
        merchant: payLink.merchant.address as `0x${string}`,
        amount: currentAmount,
        item: payLink.type === 'multi_plan' && activePlan
          ? `${payLink.title} — ${activePlan.name}`
          : payLink.title,
        metadata: JSON.stringify({
          payLinkSlug: payLink.slug,
          planId: activePlan?.id || null,
          buyerEmail: buyerEmail || null,
          buyerHandle: buyerHandle || null,
        }),
        chainId: chainId,
        rpcUrl: targetRpc || undefined,
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

  if (loading) {
    return (
      <div className="min-h-[85vh] pt-32 pb-20 flex items-center justify-center text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
          <p className="font-mono text-tiny text-ink-3">Loading checkout on Arc Layer-1…</p>
        </div>
      </div>
    );
  }

  if (fetchError || !payLink) {
    return (
      <div className="min-h-[85vh] pt-32 pb-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-ctl border border-line bg-surface p-8 text-center">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="text-h4 font-semibold text-ink mb-2">PayLink unavailable</h2>
          <p className="text-tiny text-ink-3 mb-6">
            {fetchError || 'This payment link does not exist or has been deactivated by the merchant.'}
          </p>
          <a href="/"><Button variant="outline" className="w-full text-tiny">Return to homepage</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] pt-28 pb-20 px-4 flex items-center justify-center">
      <div className={`w-full rounded-ctl border border-line bg-surface p-6 sm:p-8 relative z-10 ${
        payLink.type === 'multi_plan' ? 'max-w-2xl' : 'max-w-md'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-ctl bg-accent flex items-center justify-center text-canvas">
              <Zap className="w-4 h-4 fill-canvas" />
            </div>
            <div>
              <span className="text-body font-semibold text-ink block leading-tight">{payLink.title}</span>
              <span className="text-nano uppercase tracking-mono-cap text-ink-3 block font-mono leading-none mt-0.5">
                Merchant · {shortenAddress(payLink.merchant.address)}
              </span>
            </div>
          </div>
        </div>

        {isSuccess && receipt ? (
          <div className="text-center py-2">
            <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-3" strokeWidth={1.2} />
            <h2 className="text-h4 font-semibold text-ink mb-6">Payment confirmed</h2>

            <div className="rounded-ctl border border-line bg-raised p-4 text-tiny text-left space-y-2.5 mb-6 font-mono">
              <div className="flex justify-between">
                <span className="text-ink-3">Amount paid</span>
                <span className="text-accent font-medium tabular-nums">${currentAmount.toFixed(2)} USDC</span>
              </div>
              {activePlan && (
                <div className="flex justify-between">
                  <span className="text-ink-3">Selected option</span>
                  <span className="text-ink font-medium">{activePlan.name}</span>
                </div>
              )}
              {buyerEmail && (
                <div className="flex justify-between">
                  <span className="text-ink-3">Receipt email</span>
                  <span className="text-ink">{buyerEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-3">Order ID</span>
                <span className="text-ink">{receipt.orderId.slice(0, 14)}…</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-line">
                <span className="text-ink-3">Tx hash</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-ink">{receipt.txHash.slice(0, 12)}…</span>
                  <button onClick={() => handleCopy(receipt.txHash)} className="text-ink-3 hover:text-accent">
                    {copiedTx ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {payLink.redirectUrl && (
                <a href={payLink.redirectUrl} className="block">
                  <Button className="w-full gap-2">
                    <span>Continue to application</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
              <a href={getExplorerTxUrl(chainId, receipt.txHash)} target="_blank" rel="noreferrer" className="block">
                <Button variant="outline" className="w-full text-tiny gap-1.5">
                  <span>View on ArcScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {payLink.type === 'multi_plan' && payLink.plans && payLink.plans.length > 0 && (
              <div>
                <div className="text-tiny font-medium uppercase tracking-mono-cap text-ink-2 mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  Choose an option
                </div>
                <div className={`grid grid-cols-1 gap-px bg-line border border-line rounded-ctl overflow-hidden ${
                  payLink.plans.length === 2 ? 'sm:grid-cols-2' : payLink.plans.length >= 3 ? 'sm:grid-cols-3' : 'grid-cols-1'
                }`}>
                  {payLink.plans.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanIndex(idx)}
                      className={`relative p-4 cursor-pointer transition-colors flex flex-col justify-between ${
                        selectedPlanIndex === idx
                          ? 'bg-accent/10 ring-1 ring-accent'
                          : 'bg-canvas hover:bg-raised'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-body font-semibold text-ink">{p.name}</span>
                          {p.tag && (
                            <span className="text-nano font-mono px-1.5 h-5 inline-flex items-center rounded-pill border border-line bg-raised text-ink-2 uppercase tracking-mono-cap">
                              {p.tag}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-h4 font-semibold text-ink tabular-nums mb-2 leading-none">
                          ${p.amount.toFixed(2)}
                          <span className="text-nano font-normal text-ink-3 block font-sans mt-0.5">
                            USDC {p.interval ? `· ${p.interval}` : ''}
                          </span>
                        </div>
                        {p.description && (
                          <p className="text-nano text-ink-3 mb-3 leading-snug">{p.description}</p>
                        )}
                      </div>
                      {p.features && p.features.length > 0 && (
                        <ul className="space-y-1.5 text-nano text-ink-2 pt-2 border-t border-line">
                          {p.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-accent shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payLink.type === 'single_item' && (
              <div className="rounded-ctl border border-line bg-raised p-5 text-center">
                <div className="text-nano font-medium uppercase tracking-mono-cap text-ink-3 mb-1">Amount due</div>
                <div className="font-mono text-h1 font-semibold text-ink mb-2 tabular-nums leading-none">
                  ${currentAmount.toFixed(2)} <span className="text-h5 text-accent">USDC</span>
                </div>
                <h3 className="text-body font-medium text-ink mb-1">{payLink.title}</h3>
                {payLink.description && <p className="text-tiny text-ink-3">{payLink.description}</p>}
              </div>
            )}

            {(payLink.collectEmail || payLink.collectDiscord) && (
              <div className="space-y-3 pt-1">
                {payLink.collectEmail && (
                  <div>
                    <label className="text-tiny font-medium text-ink-2 block mb-1.5">
                      Your email <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
                {payLink.collectDiscord && (
                  <div>
                    <label className="text-tiny font-medium text-ink-2 block mb-1.5">
                      Discord or Telegram handle
                    </label>
                    <div className="relative">
                      <MessageSquare className="w-3.5 h-3.5 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="@username"
                        value={buyerHandle}
                        onChange={(e) => setBuyerHandle(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-ctl bg-danger/10 border border-danger/20 text-danger text-tiny flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}

            <Button onClick={handlePay} disabled={isConnecting || isPaying || isSyncing} size="lg" className="w-full gap-2">
              <Zap className="w-4 h-4 fill-canvas" />
              <span>
                {isConnecting
                  ? 'Connecting wallet…'
                  : isPaying
                  ? 'Confirming on Arc (~600ms)…'
                  : `Pay $${currentAmount.toFixed(2)} USDC`}
              </span>
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-nano text-ink-3 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Instant Arc settlement · direct to merchant wallet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
