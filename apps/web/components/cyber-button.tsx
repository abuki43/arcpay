import React from 'react';
import { cn } from '@/lib/utils';
import { px } from './pill';

export function CyberButton({
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  onClick,
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'emerald';
}) {
  const polyRoundness = 14;
  const hypotenuse = polyRoundness * 2;
  const hypotenuseHalf = polyRoundness / 2 - 1.5;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={
        {
          '--poly-roundness': px(polyRoundness),
        } as React.CSSProperties
      }
      className={cn(
        'inline-flex relative uppercase border font-mono cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-bold ease-out transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 h-14 px-8 text-sm outline-none [clip-path:polygon(var(--poly-roundness)_0,calc(100%_-_var(--poly-roundness))_0,100%_0,100%_calc(100%_-_var(--poly-roundness)),calc(100%_-_var(--poly-roundness))_100%,0_100%,0_calc(100%_-_var(--poly-roundness)),0_var(--poly-roundness))]',
        variant === 'emerald'
          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.65)] hover:bg-emerald-400'
          : variant === 'outline'
          ? 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-slate-900'
          : 'bg-[#070c14]/90 border-emerald-500/80 text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]',
        className
      )}
    >
      <span
        style={{ '--h': px(hypotenuse), '--hh': px(hypotenuseHalf) } as React.CSSProperties}
        className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2 bg-emerald-400"
      />
      <span
        style={{ '--h': px(hypotenuse), '--hh': px(hypotenuseHalf) } as React.CSSProperties}
        className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] -rotate-45 translate-x-1/2 bg-emerald-400"
      />
      {children}
    </button>
  );
}
