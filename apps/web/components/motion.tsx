'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

const FORCE_REVEAL_MS = 1400;

function prefersReduced() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setForced(true), FORCE_REVEAL_MS);
    return () => clearTimeout(t);
  }, []);

  const inView = useInView(ref, {
    once: true,
    amount: 0.1,
    margin: '0px 0px -10% 0px',
  });

  const show = reduce || !mounted || inView || forced;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
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