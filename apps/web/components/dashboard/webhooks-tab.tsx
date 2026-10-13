'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, CheckCircle2, Copy, Send, Webhook, XCircle } from 'lucide-react';
import type { WebhookDeliveryItem } from './types';

interface WebhooksTabProps {
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  webhookSecret: string | null;
  webhookDeliveries: WebhookDeliveryItem[];
  isSaving: boolean;
  isSendingPing: boolean;
  testPingSuccess: boolean | null;
  copiedId: string | null;
  onCopy: (value: string, key: string) => void;
  onSaveWebhook: (regenerateSecret?: boolean) => void;
  onSendTestPing: () => void;
}

export function WebhooksTab({
  webhookUrl,
  setWebhookUrl,
  webhookSecret,
  webhookDeliveries,
  isSaving,
  isSendingPing,
  testPingSuccess,
  copiedId,
  onCopy,
  onSaveWebhook,
  onSendTestPing,
}: WebhooksTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-ctl border border-line bg-surface p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-h6 font-medium text-ink flex items-center gap-2">
            <Webhook className="w-4 h-4 text-accent" />
            Webhook endpoint
          </h2>
          <p className="text-tiny text-ink-3 mt-1">
            ArcPay delivers <code className="font-mono text-tiny text-accent">payment.settled</code> and{' '}
            <code className="font-mono text-tiny text-accent">payment.split_settled</code> events
            with HMAC-SHA256 signatures upon Arc confirmation.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-tiny font-medium text-ink-2 block mb-1.5">Your webhook URL</label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://api.my-app.com/webhooks/arcpay"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="font-mono"
              />
              <Button onClick={() => onSaveWebhook(false)} disabled={isSaving} className="shrink-0">
                {isSaving ? 'Saving…' : 'Save URL'}
              </Button>
            </div>
          </div>

          {webhookSecret && (
            <div className="p-4 rounded-ctl border border-line bg-raised space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-tiny font-medium text-ink-2">
                  Signing secret <code className="font-mono text-nano text-ink-3">(arc-signature)</code>
                </span>
                <button
                  type="button"
                  onClick={() => onSaveWebhook(true)}
                  className="text-nano text-ink-3 hover:text-danger font-mono uppercase tracking-mono-cap"
                >
                  Regenerate
                </button>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={webhookSecret} type="password" className="font-mono text-accent select-all" />
                <Button variant="outline" onClick={() => onCopy(webhookSecret, 'whsec')} className="shrink-0 px-3">
                  {copiedId === 'whsec' ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-nano text-ink-3">
                Verify with <code className="font-mono">Arc-Signature: t=timestamp,v1=hmac-sha256</code>.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onSendTestPing} disabled={isSendingPing || !webhookUrl} className="gap-2">
              <Send className="w-3.5 h-3.5 text-accent" />
              {isSendingPing ? 'Sending ping…' : 'Send test ping'}
            </Button>
            {testPingSuccess === true && (
              <span className="text-tiny text-accent font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> HTTP 200 OK
              </span>
            )}
            {testPingSuccess === false && (
              <span className="text-tiny text-danger font-mono flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Endpoint error or timeout
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-ctl border border-line bg-surface overflow-hidden">
        <div className="p-5 border-b border-line">
          <h3 className="text-h6 font-medium text-ink">Recent webhook deliveries</h3>
          <p className="text-tiny text-ink-3">Logs of HTTP requests dispatched to your server</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-raised text-nano uppercase tracking-mono-cap text-ink-3 font-mono">
                <th className="py-3.5 px-5 font-medium">Status</th>
                <th className="py-3.5 px-5 font-medium">Event</th>
                <th className="py-3.5 px-5 font-medium">HTTP code</th>
                <th className="py-3.5 px-5 font-medium">Payload preview</th>
                <th className="py-3.5 px-5 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-nano text-ink-2 font-mono">
              {webhookDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-3">No deliveries dispatched yet.</td>
                </tr>
              ) : (
                webhookDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-raised/40">
                    <td className="py-3.5 px-5">
                      {del.status === 'success' ? (
                        <span className="px-2 h-5 inline-flex items-center rounded-pill border border-accent/30 bg-accent/10 text-accent font-medium uppercase tracking-mono-cap">200 OK</span>
                      ) : (
                        <span className="px-2 h-5 inline-flex items-center rounded-pill border border-danger/30 bg-danger/10 text-danger font-medium uppercase tracking-mono-cap">Failed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-ink">{del.event}</td>
                    <td className="py-3.5 px-5 text-ink-3">{del.statusCode || 'Timeout'}</td>
                    <td className="py-3.5 px-5 truncate max-w-xs text-ink-3">{JSON.stringify(del.payload)}</td>
                    <td className="py-3.5 px-5 text-right text-ink-3">{new Date(del.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
