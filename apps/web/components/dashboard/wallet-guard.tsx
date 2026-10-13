'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/eyebrow';
import { Wallet, Zap } from 'lucide-react';

export function WalletGuard({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="pt-32 pb-20 min-h-[85vh] flex items-center justify-center">
      <div className="max-w-lg w-full rounded-ctl border border-line bg-surface p-10 text-center">
        <div className="w-12 h-12 rounded-ctl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-5 h-5" />
        </div>
        <Eyebrow className="justify-center mb-4">Merchant workspace</Eyebrow>
        <h1 className="text-h2 font-semibold text-ink leading-[1.05] tracking-[-0.02em]">
          Connect your{' '}
          <span className="font-medium italic text-accent">merchant wallet</span>.
        </h1>
        <p className="text-body text-ink-3 mt-4 leading-relaxed">
          View sales analytics, manage multi-plan PayLinks, configure
          webhooks, and export accounting reports.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Button onClick={onConnect} className="gap-2">
            <Wallet className="w-4 h-4" />
            Connect wallet
          </Button>
          <Link href="/create">
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4 fill-accent" />
              Create a PayLink
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
