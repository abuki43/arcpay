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
      'inline-flex items-center gap-2.5 text-tiny font-medium uppercase tracking-mono-cap text-accent',
      className
    )}
  >
    <span className="inline-block h-px w-6 bg-accent/60" aria-hidden />
    {children}
  </p>
);
