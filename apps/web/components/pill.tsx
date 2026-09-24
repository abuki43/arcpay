import React from 'react';
import { cn } from '@/lib/utils';

export const px = (value: number) => `${value}px`;

export const Pill = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const polyRoundness = 6;
  const hypotenuse = polyRoundness * 2;
  const hypotenuseHalf = polyRoundness / 2 - 1.5;

  return (
    <div
      style={
        {
          '--poly-roundness': px(polyRoundness),
        } as React.CSSProperties
      }
      className={cn(
        'relative bg-[#161d28]/70 transform-gpu font-medium text-emerald-300 backdrop-blur-md font-mono text-xs sm:text-sm inline-flex items-center justify-center px-4 h-9 border border-emerald-500/30 [clip-path:polygon(var(--poly-roundness)_0,calc(100%_-_var(--poly-roundness))_0,100%_var(--poly-roundness),100%_calc(100%_-_var(--poly-roundness)),calc(100%_-_var(--poly-roundness))_100%,var(--poly-roundness)_100%,0_calc(100%_-_var(--poly-roundness)),0_var(--poly-roundness))] shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        className
      )}
    >
      <span
        style={
          {
            '--h': px(hypotenuse),
            '--hh': px(hypotenuseHalf),
          } as React.CSSProperties
        }
        className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2 bg-emerald-400"
      />
      <span
        style={
          {
            '--h': px(hypotenuse),
            '--hh': px(hypotenuseHalf),
          } as React.CSSProperties
        }
        className="absolute w-[var(--h)] top-[var(--hh)] right-[var(--hh)] h-[2px] bg-emerald-400 rotate-45 translate-x-1/2"
      />
      <span
        style={
          {
            '--h': px(hypotenuse),
            '--hh': px(hypotenuseHalf),
          } as React.CSSProperties
        }
        className="absolute w-[var(--h)] bottom-[var(--hh)] left-[var(--hh)] h-[2px] bg-emerald-400 rotate-45 -translate-x-1/2"
      />
      <span
        style={
          {
            '--h': px(hypotenuse),
            '--hh': px(hypotenuseHalf),
          } as React.CSSProperties
        }
        className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] bg-emerald-400 -rotate-45 translate-x-1/2"
      />

      <span className="inline-block size-2 rounded-full bg-emerald-400 mr-2.5 shadow-[0_0_8px_#10b981] animate-pulse" />

      {children}
    </div>
  );
};
