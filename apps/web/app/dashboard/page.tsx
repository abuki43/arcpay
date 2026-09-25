'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';
import {
  formatUsdc,
  shortenAddress,
  ARC_PAYMENT_GATEWAY_ABI,
  DEFAULT_GATEWAY_ADDRESSES,
} from '@arcpay/sdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DisplayPayment {
  orderId: string;
  payer: string;
  merchant: string;
  amount: bigint;
  protocolFee: bigint;
  metadata: string;
  timestamp: number;
  txHash: string;
}

const MOCK_HISTORICAL_PAYMENTS: DisplayPayment[] = [
  {
    orderId: '0x8f3c92a104b4c730e71910248834927519385920194857291039485729104829',
    payer: '0x3912048592019485729103948572910482910394',
    merchant: '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
    amount: 29000000000000000000n,
    protocolFee: 116000000000000000n,
    metadata: '{"sku":"cloud_ai_pro","plan":"monthly","userId":"usr_902"}',
    timestamp: Date.now() - 1000 * 60 * 12,
    txHash: '0x9924857291039485729104829103948572910482910394857291048291039485',
  },
  {
    orderId: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    payer: '0x8834927519385920194857291039485729104829',
    merchant: '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
    amount: 99000000000000000000n,
    protocolFee: 396000000000000000n,
    metadata: '{"sku":"enterprise_tier","seats":5}',
    timestamp: Date.now() - 1000 * 60 * 45,
    txHash: '0x7734857291039485729104829103948572910482910394857291048291039485',
  },
  {
    orderId: '0x4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e',
    payer: '0x1122334455667788990011223344556677889900',
    merchant: '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
    amount: 9000000000000000000n,
    protocolFee: 36000000000000000n,
    metadata: '{"sku":"starter_tier"}',
    timestamp: Date.now() - 1000 * 60 * 180,
    txHash: '0x5534857291039485729104829103948572910482910394857291048291039485',
  },
];

export default function MerchantDashboardPage() {
  const { address } = useAccount();

  const [payments, setPayments] = useState<DisplayPayment[]>(
    MOCK_HISTORICAL_PAYMENTS
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [newAlert, setNewAlert] = useState<string | null>(null);

  const gatewayAddress = DEFAULT_GATEWAY_ADDRESSES[5042002];

  useWatchContractEvent({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    eventName: 'PaymentSettled',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { orderId, merchant, payer, amount, protocolFee, metadata, timestamp } =
          log.args;

        if (!address || merchant.toLowerCase() === address.toLowerCase()) {
          const newPayment: DisplayPayment = {
            orderId,
            merchant,
            payer,
            amount: BigInt(amount),
            protocolFee: BigInt(protocolFee),
            metadata: metadata || '',
            timestamp: Number(timestamp) * 1000 || Date.now(),
            txHash: log.transactionHash,
          };

          setPayments((prev) => [newPayment, ...prev]);
          setNewAlert(
            `Received $${formatUsdc(BigInt(amount))} USDC from ${shortenAddress(payer)}!`
          );
          setTimeout(() => setNewAlert(null), 5000);
        }
      });
    },
  });

  const totalGross = useMemo(
    () => payments.reduce((acc, p) => acc + p.amount, 0n),
    [payments]
  );
  const totalFees = useMemo(
    () => payments.reduce((acc, p) => acc + p.protocolFee, 0n),
    [payments]
  );
  const totalNet = totalGross - totalFees;
  const transactionCount = payments.length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const simulateIncomingPayment = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const simAmounts = [9, 29, 49, 99];
      const selected = simAmounts[Math.floor(Math.random() * simAmounts.length)];
      const gross = BigInt(selected) * 10n ** 18n;
      const fee = (gross * 40n) / 10000n;

      const randomOrderId =
        '0x' +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      const randomPayer =
        '0x' +
        Array.from({ length: 40 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      const randomTx =
        '0x' +
        Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');

      const simPayment: DisplayPayment = {
        orderId: randomOrderId,
        payer: randomPayer,
        merchant: address || '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
        amount: gross,
        protocolFee: fee,
        metadata: JSON.stringify({ item: 'CloudAI Live Order', testSim: true }),
        timestamp: Date.now(),
        txHash: randomTx,
      };

      setPayments((prev) => [simPayment, ...prev]);
      setNewAlert(`Live sale simulated: $${selected}.00 USDC received in ~600ms`);
      setIsSimulating(false);
      setTimeout(() => setNewAlert(null), 6000);
    }, 600);
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.payer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metadata.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-28 pb-16 min-h-[85vh] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="text-xs" variant="secondary">
                Client-side streaming
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-primary font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Live event stream</span>
              </span>
            </div>
            <h1 className="font-sentient text-3xl text-foreground tracking-tight">
              Merchant dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Zero-database real-time sales feed powered by Arc Layer-1 on-chain
              logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={simulateIncomingPayment}
              disabled={isSimulating}
              variant="outline"
              size="sm"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                {isSimulating ? 'Processing...' : 'Simulate live sale'}
              </span>
            </Button>
          </div>
        </div>

        {/* Live Alert Toast */}
        {newAlert && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-700/25 text-primary flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold text-sm">{newAlert}</span>
            </div>
            <Badge className="font-bold text-xs" variant="emerald">
              Settled ~600ms
            </Badge>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Gross volume
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-primary">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
              ${formatUsdc(totalGross)}{' '}
              <span className="text-xs font-normal text-muted-foreground font-sans">USDC</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">
              100% native USDC gas
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-700/25 bg-gradient-to-b from-emerald-50 to-card p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Net payout (99.6%)
              </span>
              <div className="p-2 rounded-lg bg-white text-primary border border-emerald-700/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-primary tabular-nums">
              ${formatUsdc(totalNet)}{' '}
              <span className="text-xs font-normal text-muted-foreground font-sans">USDC</span>
            </div>
            <div className="text-[11px] text-primary/80 mt-2">
              Instant wallet settlement
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Orders settled
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-primary">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
              {transactionCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">
              Zero chargeback risk
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Protocol fee (0.4%)
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-primary">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
              ${formatUsdc(totalFees)}{' '}
              <span className="text-xs font-normal text-muted-foreground font-sans">USDC</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">
              0.40% flat &middot; no interchange tiers
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-sentient text-foreground">
                Live transactions feed
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time payment settlements indexed directly from Arc L1
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order or payer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-white/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-white/60 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Order ID</th>
                  <th className="py-3.5 px-5">Payer</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Fee (0.4%)</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-muted-foreground">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isNew = Date.now() - p.timestamp < 10000;
                    return (
                      <tr
                        key={p.orderId}
                        className={`transition-colors ${
                          isNew ? 'bg-emerald-50/60' : 'hover:bg-muted/50'
                        }`}
                      >
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-700/25 text-primary font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Settled</span>
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground">{p.orderId.slice(0, 10)}...</span>
                            <button
                              onClick={() => handleCopy(p.orderId, p.orderId)}
                              className="text-muted-foreground hover:text-primary"
                              title="Copy Order ID"
                            >
                              {copiedId === p.orderId ? (
                                <Check className="w-3 h-3 text-primary" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-muted-foreground">
                          {shortenAddress(p.payer)}
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-foreground text-sm tabular-nums">
                          ${formatUsdc(p.amount)}{' '}
                          <span className="text-xs font-normal text-muted-foreground">USDC</span>
                        </td>
                        <td className="py-4 px-5 font-mono text-primary tabular-nums">
                          ${formatUsdc(p.protocolFee)}
                        </td>
                        <td className="py-4 px-5 text-muted-foreground">
                          {new Date(p.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <a
                            href={`https://explorer.testnet.arc.io/tx/${p.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}