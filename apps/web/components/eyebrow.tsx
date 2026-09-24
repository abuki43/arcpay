import React from 'react';
import { cn } from '@/lib/utils';

export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p
    className={cn(
      'inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary',
      className
    )}
  >
    <span className="inline-block h-px w-6 bg-primary/50" aria-hidden />
    {children}
  </p>
);