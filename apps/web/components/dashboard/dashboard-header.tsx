'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@arcpay/sdk';
import { BarChart3, Layers, Webhook, Zap } from 'lucide-react';
import type { DashboardTab } from './types';

interface DashboardHeaderProps {
  address: string;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  payLinksCount: number;
}

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview & sales', icon: BarChart3 },
  { id: 'paylinks', label: 'PayLinks', icon: Layers },
  { id: 'webhooks', label: 'Developer & webhooks', icon: Webhook },
];

export function DashboardHeader({
  address,
  activeTab,
  setActiveTab,
  payLinksCount,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-8 mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="secondary">Merchant · {shortenAddress(address)}</Badge>
            <span className="inline-flex items-center gap-1.5 text-tiny text-accent font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-accent arc-pulse" />
              Connected to Arc L1
            </span>
          </div>
          <h1 className="text-h1 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Merchant control center
          </h1>
          <p className="mt-3 text-lead text-ink-3">
            Persistent PayLinks, indexed settlements, and automated webhooks.
          </p>
        </div>
        <Link href="/create">
          <Button className="gap-2">
            <Zap className="w-3.5 h-3.5 fill-canvas" />
            <span>+ Create PayLink</span>
          </Button>
        </Link>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-ctl border border-line bg-surface">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 h-8 rounded-chip font-mono text-tiny font-medium uppercase tracking-mono-cap inline-flex items-center gap-2 transition-colors ${
                active
                  ? 'bg-canvas text-ink border border-line'
                  : 'text-ink-3 hover:text-ink border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-accent' : ''}`} />
              {t.id === 'paylinks' ? `${t.label} (${payLinksCount})` : t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
