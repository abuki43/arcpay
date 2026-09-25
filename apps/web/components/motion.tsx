'use client';

import React, { useEffect, useRef } from 'react';
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

function prefersReduced() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 2.4,
  delay = 0,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce || prefersReduced()) {
      ref.current.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [
    inView,
    to,
    prefix,
    suffix,
    decimals,
    duration,
    delay,
    reduce,
  ]);

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {to.toFixed(decimals)}
      {suffix}
    </span>
  );
}