'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduce) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    let animated = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      if (animated) return;
      animated = true;
      if (reduced) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        return;
      }
      const start = performance.now();
      const duration = 550;
      const delayMs = delay * 1000;
      const tick = (now: number) => {
        const elapsed = now - start - delayMs;
        if (elapsed < 0) {
          requestAnimationFrame(tick);
          return;
        }
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.style.opacity = String(eased);
        el.style.transform = `translateY(${(1 - eased) * y}px)`;
        if (t < 1) requestAnimationFrame(tick);
        else {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.willChange = 'auto';
        }
      };
      requestAnimationFrame(tick);
    };

    // Trigger on mount (handles already-in-viewport case)
    animate();

    // Also trigger on intersection (for elements scrolled into view later)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            animate();
            io.disconnect();
          }
        },
        { threshold: 0.01, rootMargin: '0px 0px -5% 0px' }
      );
      io.observe(el);
      return () => io.disconnect();
    }
  }, [delay, y, reduce]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: 0,
        transform: `translateY(${y}px)`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

type CountUpProps = {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
};

export function CountUp({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.6,
  delay = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [text, setText] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    if (reduce) {
      setText(`${prefix}${to.toFixed(decimals)}${suffix}`);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start - delay * 1000) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setText(`${prefix}${(eased * to).toFixed(decimals)}${suffix}`);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, prefix, suffix, decimals, duration, delay, reduce]);

  return (
    <span ref={ref} className={cn(className)}>
      {text}
    </span>
  );
}

type MarqueeProps = {
  items: string[];
  duration?: number;
  className?: string;
};

export function Marquee({ items, duration = 38, className }: MarqueeProps) {
  const reduce = useReducedMotion();
  const seq = [...items, ...items, ...items];
  return (
    <div className={cn('overflow-hidden border-y border-line bg-canvas', className)}>
      <div
        className="flex gap-12 whitespace-nowrap py-5 will-change-transform"
        style={{
          animation: reduce
            ? undefined
            : `marquee ${duration}s linear infinite`,
        }}
      >
        {seq.map((item, i) => (
          <span
            key={i}
            className="text-tiny font-medium uppercase tracking-mono-cap text-ink-2 flex items-center gap-3"
          >
            <span className="w-1 h-1 rounded-full bg-accent" aria-hidden />
            {item}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-33.33%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
