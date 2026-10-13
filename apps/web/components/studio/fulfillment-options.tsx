'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';

interface FulfillmentOptionsProps {
  collectEmail: boolean;
  setCollectEmail: (val: boolean) => void;
  collectDiscord: boolean;
  setCollectDiscord: (val: boolean) => void;
  redirectUrl: string;
  setRedirectUrl: (val: string) => void;
}

export function FulfillmentOptions({ collectEmail, setCollectEmail, collectDiscord, setCollectDiscord, redirectUrl, setRedirectUrl }: FulfillmentOptionsProps) {
  return (
    <div className="rounded-ctl border border-line bg-surface p-6 sm:p-8 space-y-3">
      <h2 className="text-h6 font-medium text-ink flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-accent" />
        Customer data &amp; fulfillment
      </h2>

      <label className="flex items-start gap-3 p-3 rounded-ctl border border-line bg-raised cursor-pointer hover:border-line-strong transition-colors">
        <input
          type="checkbox"
          checked={collectEmail}
          onChange={(e) => setCollectEmail(e.target.checked)}
          className="mt-0.5 rounded border-line accent-[var(--accent)]"
        />
        <div>
          <span className="text-tiny font-medium text-ink block">Collect customer email</span>
          <span className="text-nano text-ink-3">Prompts buyer for email on checkout to send licenses, receipts, and order updates.</span>
        </div>
      </label>

      <label className="flex items-start gap-3 p-3 rounded-ctl border border-line bg-raised cursor-pointer hover:border-line-strong transition-colors">
        <input
          type="checkbox"
          checked={collectDiscord}
          onChange={(e) => setCollectDiscord(e.target.checked)}
          className="mt-0.5 rounded border-line accent-[var(--accent)]"
        />
        <div>
          <span className="text-tiny font-medium text-ink block">Collect Discord / Telegram username</span>
          <span className="text-nano text-ink-3">Great for gated communities, bots, and role granting upon payment.</span>
        </div>
      </label>

      <div className="pt-1">
        <label className="text-tiny font-medium text-ink-2 block mb-1.5">Post-payment redirect URL (optional)</label>
        <Input type="url" placeholder="https://my-app.com/welcome" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} />
      </div>
    </div>
  );
}
