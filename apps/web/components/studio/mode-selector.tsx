'use client';

import React from 'react';
import { FileText, Layers } from 'lucide-react';
import type { StudioPricingMode } from './types';

interface ModeSelectorProps {
  mode: StudioPricingMode;
  setMode: (mode: StudioPricingMode) => void;
}

const MODES: { id: StudioPricingMode; label: string; icon: React.ElementType }[] = [
  { id: 'single_item', label: 'Fixed price', icon: FileText },
  { id: 'multi_plan', label: 'Multiple options / tiers', icon: Layers },
];

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-ctl border border-line bg-surface mb-8">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-4 h-8 rounded-chip font-mono text-tiny font-medium uppercase tracking-mono-cap inline-flex items-center gap-2 transition-colors ${
              active
                ? 'bg-canvas text-ink border border-line'
                : 'text-ink-3 hover:text-ink border border-transparent'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-accent' : ''}`} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
