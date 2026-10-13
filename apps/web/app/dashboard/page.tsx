'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useConnect } from 'wagmi';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { WalletGuard } from '@/components/dashboard/wallet-guard';
import { OverviewTab } from '@/components/dashboard/overview-tab';
import { PayLinksTab } from '@/components/dashboard/paylinks-tab';
import { PayLinkAnalyticsModal } from '@/components/dashboard/paylink-analytics-modal';
import { WebhooksTab } from '@/components/dashboard/webhooks-tab';
import type {
  DashboardTab, PayLinkAnalytics, PayLinkSummary, SettlementRow, WebhookDeliveryItem,
} from '@/components/dashboard/types';

export default function MerchantDashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [payLinks, setPayLinks] = useState<PayLinkSummary[]>([]);
  const [analyticsSlug, setAnalyticsSlug] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PayLinkAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDeliveryItem[]>([]);
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [testPingSuccess, setTestPingSuccess] = useState<boolean | null>(null);

  const loadSettlements = useCallback(async () => {
    if (!address) return;
    try {
      setIsLoadingFeed(true);
      const res = await fetch(`/api/settlements?merchant=${address}`);
      const data = await res.json();
      if (res.ok && data.settlements) setSettlements(data.settlements);
    } catch (err) { console.error(err); } finally { setIsLoadingFeed(false); }
  }, [address]);

  const loadPayLinks = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/paylinks?merchant=${address}`);
      const data = await res.json();
      if (res.ok && data.payLinks) setPayLinks(data.payLinks);
    } catch (err) { console.error(err); }
  }, [address]);

  const loadWebhooks = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/webhooks?merchant=${address}`);
      const data = await res.json();
      if (res.ok) {
        setWebhookUrl(data.webhookUrl || '');
        setWebhookSecret(data.webhookSecret || null);
        setWebhookDeliveries(data.deliveries || []);
      }
    } catch (err) { console.error(err); }
  }, [address]);

  useEffect(() => {
    if (address) { loadSettlements(); loadPayLinks(); loadWebhooks(); }
  }, [address, loadSettlements, loadPayLinks, loadWebhooks]);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAnalytics = async (slug: string) => {
    setAnalyticsSlug(slug); setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/paylinks/${slug}/analytics`);
      const data = await res.json();
      if (res.ok && data.analytics) setAnalyticsData(data.analytics);
    } catch (err) { console.error(err); } finally { setIsLoadingAnalytics(false); }
  };

  const handleToggleActive = async (slug: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/paylinks/${slug}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) loadPayLinks();
    } catch (err) { console.error(err); }
  };

  const handleSaveWebhook = async (regenerateSecret = false) => {
    if (!address) return;
    setIsSavingWebhook(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantAddress: address, webhookUrl, regenerateSecret }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhookSecret(data.webhookSecret);
        alert(regenerateSecret ? 'New secret generated.' : 'Webhook URL saved.');
        loadWebhooks();
      }
    } catch (err) { console.error(err); } finally { setIsSavingWebhook(false); }
  };

  const handleSendTestPing = async () => {
    if (!address) return;
    setIsSendingPing(true); setTestPingSuccess(null);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantAddress: address }),
      });
      const data = await res.json();
      setTestPingSuccess(res.ok && data.delivery?.status === 'success');
      loadWebhooks();
    } catch { setTestPingSuccess(false); } finally { setIsSendingPing(false); }
  };

  const handleExportCsv = () => {
    if (settlements.length === 0) return;
    const headers = ['Order ID', 'Transaction Hash', 'Block Number', 'Payer', 'PayLink Title', 'Plan Name', 'Gross USDC', 'Protocol Fee USDC (0.4%)', 'Net Received USDC', 'Customer Email', 'Status', 'Timestamp (ISO)'];
    const rows = settlements.map((s) => [s.orderId, s.txHash, s.blockNumber, s.payer || 'Anonymous', s.payLinkTitle || 'Direct Checkout', s.planName || 'One-Time', (Number(BigInt(s.gross)) / 1e18).toFixed(2), (Number(BigInt(s.protocolFee)) / 1e18).toFixed(2), (Number(BigInt(s.merchantShare)) / 1e18).toFixed(2), s.buyerEmail || '', s.status, new Date(s.timestamp).toISOString()]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map((v) => `"${v}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `arcpay-sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!isConnected || !address) {
    return <WalletGuard onConnect={() => { if (connectors[0]) connect({ connector: connectors[0] }); }} />;
  }

  return (
    <div className="pt-28 pb-20 min-h-[85vh]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <DashboardHeader
          address={address} activeTab={activeTab} setActiveTab={setActiveTab}
          payLinksCount={payLinks.length}
        />

        {activeTab === 'overview' && (
          <OverviewTab
            settlements={settlements} isLoading={isLoadingFeed}
            onRefresh={loadSettlements} chainId={chainId || 5042002}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            copiedId={copiedId} onCopy={handleCopy} onExportCsv={handleExportCsv}
          />
        )}
        {activeTab === 'paylinks' && (
          <PayLinksTab
            payLinks={payLinks} copiedId={copiedId} onCopy={handleCopy}
            onToggleActive={handleToggleActive} onOpenAnalytics={handleOpenAnalytics}
          />
        )}
        {activeTab === 'webhooks' && (
          <WebhooksTab
            webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}
            webhookSecret={webhookSecret} webhookDeliveries={webhookDeliveries}
            isSaving={isSavingWebhook} isSendingPing={isSendingPing}
            testPingSuccess={testPingSuccess} copiedId={copiedId}
            onCopy={handleCopy} onSaveWebhook={handleSaveWebhook}
            onSendTestPing={handleSendTestPing}
          />
        )}
        <PayLinkAnalyticsModal
          slug={analyticsSlug} data={analyticsData}
          isLoading={isLoadingAnalytics} onClose={() => setAnalyticsSlug(null)}
        />
      </div>
    </div>
  );
}
