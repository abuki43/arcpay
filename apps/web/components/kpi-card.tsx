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
        'rounded-2xl border border-border bg-card p-6',
        accent && 'border-emerald-700/25 bg-gradient-to-b from-emerald-50 to-card',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={cn(
            'text-xs font-medium uppercase tracking-wider',
            accent ? 'text-primary font-bold' : 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              'p-2 rounded-lg',
              accent
                ? 'bg-white text-primary border border-emerald-700/20'
                : 'bg-emerald-50 text-primary'
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={cn(
          'font-mono text-2xl sm:text-3xl font-bold tabular-nums',
          accent ? 'text-primary' : 'text-foreground'
        )}
      >
        {value}
      </div>
      {sub && (
        <div className={cn('text-[11px] mt-2', accent ? 'text-primary/80' : 'text-muted-foreground')}>
          {sub}
        </div>
      )}
    </div>
  );
}