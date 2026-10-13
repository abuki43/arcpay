'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2, Code, Copy, ExternalLink, QrCode, Sparkles, X, Zap } from 'lucide-react';

interface PayLinkSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  title: string;
  publishedUrl: string;
  onReset: () => void;
}

type Tab = 'link' | 'qr' | 'embed';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'link', label: 'Direct link', icon: Zap },
  { id: 'qr', label: 'QR code', icon: QrCode },
  { id: 'embed', label: 'Embed button', icon: Code },
];

export function PayLinkSuccessModal({ isOpen, onClose, slug, title, publishedUrl, onReset }: PayLinkSuccessModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('link');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const embedCode = `<a href="${publishedUrl}" target="_blank" rel="noopener noreferrer" style="background:#F5A524;color:#0B0B0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-family:ui-sans-serif,system-ui,sans-serif;">
  Pay with ArcPay (USDC)
</a>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-ctl border border-line bg-surface p-6 sm:p-8 space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-full text-ink-3 hover:text-ink hover:bg-raised transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-ctl bg-accent/10 border border-accent/30 text-accent mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7 fill-accent" />
          </div>
          <h2 className="text-h4 font-semibold text-ink">PayLink is live.</h2>
          <p className="text-tiny text-ink-3 max-w-sm mx-auto">
            Your link for <span className="font-medium text-ink">{title}</span> is ready to accept native USDC payments on Arc.
          </p>
        </div>

        <div className="flex items-center justify-center gap-1 p-1 rounded-ctl border border-line bg-raised">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-1.5 px-3 rounded-chip text-tiny font-medium uppercase tracking-mono-cap inline-flex items-center justify-center gap-1.5 transition-colors ${
                  active ? 'bg-canvas text-ink border border-line' : 'text-ink-3 hover:text-ink border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-accent' : ''}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'link' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-ctl border border-line bg-raised flex items-center justify-between gap-3">
              <span className="font-mono text-tiny text-ink truncate select-all">{publishedUrl}</span>
              <Button size="sm" onClick={handleCopyLink} className="shrink-0 gap-2">
                {copiedLink ? (<><Check className="w-3.5 h-3.5" /><span>Copied</span></>) : (<><Copy className="w-3.5 h-3.5" /><span>Copy</span></>)}
              </Button>
            </div>
            <a href={publishedUrl} target="_blank" rel="noreferrer" className="block">
              <Button variant="outline" className="w-full text-tiny gap-2 py-5">
                <span>Preview hosted checkout</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="text-center space-y-3 py-2">
            <div className="inline-block p-4 rounded-ctl bg-canvas border border-line">
              <QRCodeSVG value={publishedUrl} size={180} level="M" includeMargin={false} />
            </div>
            <p className="text-nano text-ink-3">Scan with a mobile wallet or display at point of sale.</p>
          </div>
        )}

        {activeTab === 'embed' && (
          <div className="space-y-3">
            <pre className="p-3 rounded-ctl bg-raised border border-line text-tiny font-mono text-ink overflow-x-auto leading-relaxed max-h-36">
              <code>{embedCode}</code>
            </pre>
            <Button size="sm" variant="outline" onClick={handleCopyCode} className="w-full text-tiny gap-2">
              {copiedCode ? (<><Check className="w-3.5 h-3.5 text-accent" /><span>Snippet copied</span></>) : (<><Copy className="w-3.5 h-3.5" /><span>Copy HTML snippet</span></>)}
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => { onReset(); onClose(); }} className="text-ink-3 hover:text-ink">
            Create another
          </Button>
          <Link href="/dashboard?tab=paylinks" className="inline-block">
            <Button size="sm" className="gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Go to dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
