'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi';
import {
  formatUsdc,
  shortenAddress,
  ARC_PAYMENT_GATEWAY_ABI,
  DEFAULT_GATEWAY_ADDRESSES,
  arcTestnet,
} from '@arcpay/sdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
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

// Mock fallback payments for initial visual demonstration when wallet hasn't transacted yet
const MOCK_HISTORICAL_PAYMENTS: DisplayPayment[] = [
  {
    orderId: '0x8f3c92a104b4c730e71910248834927519385920194857291039485729104829',
    payer: '0x3912048592019485729103948572910482910394',
    merchant: '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
    amount: 29000000000000000000n, // 29 USDC
    protocolFee: 116000000000000000n, // 0.116 USDC
    metadata: '{"sku":"cloud_ai_pro","plan":"monthly","userId":"usr_902"}',
    timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
    txHash: '0x9924857291039485729104829103948572910482910394857291048291039485',
  },
  {
    orderId: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    payer: '0x8834927519385920194857291039485729104829',
    merchant: '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
    amount: 99000000000000000000n, // 99 USDC
    protocolFee: 396000000000000000n, // 0.396 USDC
    metadata: '{"sku":"enterprise_tier","seats":5}',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    txHash: '0x7734857291039485729104829103948572910482910394857291048291039485',
  },
  {
    orderId: '0x4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e',
    payer: '0x1122334455667788990011223344556677889900',
    merchant: '0xf46b169915c5820E9FcdcD79F5AA5B246E32220D',
    amount: 9000000000000000000n, // 9 USDC
    protocolFee: 36000000000000000n, // 0.036 USDC
    metadata: '{"sku":"starter_tier"}',
    timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
    txHash: '0x5534857291039485729104829103948572910482910394857291048291039485',
  },
];

export default function MerchantDashboardPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [payments, setPayments] = useState<DisplayPayment[]>(MOCK_HISTORICAL_PAYMENTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [newAlert, setNewAlert] = useState<string | null>(null);

  const gatewayAddress = DEFAULT_GATEWAY_ADDRESSES[5042002];

  // Watch for live incoming PaymentSettled events on-chain
  useWatchContractEvent({
    address: gatewayAddress,
    abi: ARC_PAYMENT_GATEWAY_ABI,
    eventName: 'PaymentSettled',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { orderId, merchant, payer, amount, protocolFee, metadata, timestamp } =
          log.args;

        // If wallet is connected, filter by merchant or show all live
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
          setNewAlert(`Received $${formatUsdc(BigInt(amount))} USDC from ${shortenAddress(payer)}!`);
          setTimeout(() => setNewAlert(null), 5000);
        }
      });
    },
  });

  // Calculate totals
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

      const randomOrderId = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const randomPayer = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const randomTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

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
      setNewAlert(`Simulated Live Payment: $${selected}.00 USDC received in ~600ms!`);
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
    <div className="py-12 bg-[#070a12] min-h-[85vh] relative overflow-hidden">
      {/* Background radial */}
      <div className="absolute top-20 right-1/4 w-[600px] h-[400px] bg-emerald-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                CLIENT-SIDE STREAMING
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Event Stream</span>
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Merchant Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Zero-database real-time sales feed powered by Arc Layer-1 on-chain logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={simulateIncomingPayment}
              disabled={isSimulating}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Processing...' : 'Simulate Live Sale'}</span>
            </Button>
          </div>
        </div>

        {/* Live Alert Toast */}
        {newAlert && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between animate-bounce shadow-xl shadow-emerald-500/10">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💸</span>
              <span className="font-semibold text-sm">{newAlert}</span>
            </div>
            <Badge className="bg-emerald-500 text-slate-950 font-bold text-xs">Settled ~600ms</Badge>
          </div>
        )}

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Gross Sales */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gross Volume</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              ${formatUsdc(totalGross)} <span className="text-xs font-normal text-slate-400 font-sans">USDC</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">100% Native USDC Gas</div>
          </div>

          {/* Card 2: Net Payout */}
          <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-lg shadow-emerald-500/5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Net Payout (99.6%)</span>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              ${formatUsdc(totalNet)} <span className="text-xs font-normal text-slate-400 font-sans">USDC</span>
            </div>
            <div className="text-[11px] text-emerald-400/70 mt-2">Instant wallet settlement</div>
          </div>

          {/* Card 3: Total Transactions */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Orders Settled</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {transactionCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">Zero chargeback risk</div>
          </div>

          {/* Card 4: Protocol Fees Paid */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Protocol Fee (0.4%)</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
              ${formatUsdc(totalFees)} <span className="text-xs font-normal text-slate-400 font-sans">USDC</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">7x cheaper than Stripe</div>
          </div>
        </div>

        {/* Transactions Table Container */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Live Transactions Feed</h2>
              <p className="text-xs text-slate-400">Real-time payment settlements indexed directly from Arc L1</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order or payer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Order ID</th>
                  <th className="py-3.5 px-5">Payer</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Fee (0.4%)</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const isNew = Date.now() - p.timestamp < 10000;
                    return (
                      <tr
                        key={p.orderId}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          isNew ? 'bg-emerald-500/10' : ''
                        }`}
                      >
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Settled</span>
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white">{p.orderId.slice(0, 10)}...</span>
                            <button
                              onClick={() => handleCopy(p.orderId, p.orderId)}
                              className="text-slate-500 hover:text-white"
                              title="Copy Order ID"
                            >
                              {copiedId === p.orderId ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-400">
                          {shortenAddress(p.payer)}
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-white text-sm">
                          ${formatUsdc(p.amount)} <span className="text-xs font-normal text-slate-500">USDC</span>
                        </td>
                        <td className="py-4 px-5 font-mono text-purple-400">
                          ${formatUsdc(p.protocolFee)}
                        </td>
                        <td className="py-4 px-5 text-slate-400">
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
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
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
