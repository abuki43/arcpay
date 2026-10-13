import React from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export function KpiCard({ label, value, sub, icon, accent, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-ctl border border-line bg-surface p-5',
        accent && 'border-accent/30 bg-accent/[0.06]',
        className
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span
          className={cn(
            'text-nano font-medium uppercase tracking-mono-cap',
            accent ? 'text-accent' : 'text-ink-3'
          )}
        >
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              'w-8 h-8 rounded-ctl border flex items-center justify-center',
              accent
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-raised border-line text-ink-2'
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={cn(
          'font-mono text-h4 font-medium tabular-nums leading-none',
          accent ? 'text-accent' : 'text-ink'
        )}
      >
        {value}
      </div>
      {sub && (
        <div className={cn('text-tiny mt-2', accent ? 'text-ink-2' : 'text-ink-3')}>
          {sub}
        </div>
      )}
    </div>
  );
}
