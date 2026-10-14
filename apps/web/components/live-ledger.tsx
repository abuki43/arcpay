'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface ApiSettlement {
  orderId: string;
  merchant: string;
  gross: string;
  protocolFee: string;
  kind: 'direct' | 'split';
  txHash: string;
  timestamp: number;
}

function shortAddr(a: string): string {
  if (!a) return '0x…';
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function shortHash(h: string): string {
  if (!h) return '0x…';
  return `${h.slice(0, 6)}…${h.slice(-4)}`;
}

function formatUsdc(wei: bigint | number | string): string {
  const n = typeof wei === 'bigint' ? Number(wei) / 1e18
    : typeof wei === 'string' ? Number(wei) / 1e18
    : wei / 1e18;
  if (n === 0) return '0.00';
  if (n < 0.01) return n.toFixed(4);
  if (n < 100) return n.toFixed(2);
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function LiveLedger({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<ApiSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLedger() {
      try {
        const res = await fetch(`/api/settlements?limit=${limit}&page=1`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setItems(data.settlements ?? []);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLedger();
    const tick = setInterval(fetchLedger, 10_000);
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [limit]);

  const rows = useMemo(
    () =>
      items.slice(0, limit).map((it) => ({
        order: it.orderId,
        merchant: it.merchant,
        gross: BigInt(it.gross),
        fee: BigInt(it.protocolFee),
        kind: it.kind,
        hash: it.txHash,
        ts: it.timestamp,
      })),
    [items, limit],
  );

  return (
    <div className="rounded-ctl border border-line bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 h-10 border-b border-line">
        <div className="flex items-center gap-2 text-tiny font-medium uppercase tracking-mono-cap text-ink">
          <span className="w-1.5 h-1.5 rounded-full bg-accent arc-pulse" />
          Live settlement feed
        </div>
        <div className="text-tiny font-mono text-ink-3">
          {rows.length > 0 ? `${rows.length} recent` : isLoading ? 'syncing…' : '—'}
        </div>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-tiny font-mono text-ink-3">
          Loading indexed activity…
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-tiny font-mono text-ink-3">
          No settlements indexed yet.
        </div>
      ) : (
        <ul className="divide-y divide-line font-mono text-tiny">
          {rows.map((r) => (
            <li
              key={r.order}
              className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3 hover:bg-raised/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-1.5 h-1.5 rounded-full shrink-0',
                    r.kind === 'split' ? 'bg-ink-2' : 'bg-accent',
                  )}
                  aria-hidden
                />
                <span className="text-ink truncate">{shortHash(r.order)}</span>
                <span className="text-ink-3 truncate">→ {shortAddr(r.merchant)}</span>
              </div>
              <div className="text-right tabular-nums text-ink whitespace-nowrap">
                {formatUsdc(r.gross)}{' '}
                <span className="text-ink-3">USDC</span>
              </div>
              <div className="col-start-2 text-right text-nano uppercase tracking-mono-cap text-ink-3 tabular-nums">
                −{formatUsdc(r.fee)} fee · {timeAgo(r.ts)}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="px-4 h-9 border-t border-line flex items-center justify-between text-nano uppercase tracking-mono-cap text-ink-3">
        <span>Arc L1 · chain 5042002</span>
        <a
          href="/network"
          className="text-ink-2 hover:text-accent transition-colors"
        >
          Full ledger →
        </a>
      </div>
    </div>
  );
}
