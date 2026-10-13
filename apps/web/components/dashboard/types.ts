export interface SettlementRow {
  id: string;
  orderId: string;
  merchant: string;
  payer: string | null;
  payLinkTitle: string | null;
  payLinkSlug: string | null;
  planName: string | null;
  gross: string;
  protocolFee: string;
  merchantShare: string;
  affiliate?: string | null;
  affiliateShare?: string | null;
  kind: string;
  txHash: string;
  blockNumber: string;
  buyerEmail: string | null;
  buyerHandle: string | null;
  metadata: any;
  status: string;
  timestamp: number;
}

export interface PayLinkSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  amount: number | null;
  active: boolean;
  views: number;
  createdAt: string;
  plans: any[];
  stats: {
    totalOrders: number;
    grossVolumeUsdc: number;
    conversionRate: number;
  };
}

export interface PayLinkAnalytics {
  payLinkId: string;
  slug: string;
  title: string;
  type: string;
  views: number;
  ordersCount: number;
  conversionRate: number;
  grossVolumeUsdc: string;
  netVolumeUsdc: string;
  protocolFeeUsdc: string;
  planBreakdown: {
    planId: string;
    name: string;
    tag: string | null;
    price: number;
    ordersCount: number;
    volumeUsdc: string;
  }[];
  recentSettlements: any[];
}

export interface WebhookDeliveryItem {
  id: string;
  event: string;
  status: string;
  statusCode: number | null;
  responseBody: string | null;
  payload: any;
  createdAt: string;
}

export type DashboardTab = 'overview' | 'paylinks' | 'webhooks';
