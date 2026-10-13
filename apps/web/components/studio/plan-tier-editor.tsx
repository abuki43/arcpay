'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Layers, Plus, Trash2 } from 'lucide-react';
import type { PlanDraft } from './types';

interface PlanTierEditorProps {
  plans: PlanDraft[];
  setPlans: (plans: PlanDraft[]) => void;
  previewPlanIndex: number;
  setPreviewPlanIndex: (index: number) => void;
}

export function PlanTierEditor({ plans, setPlans, previewPlanIndex, setPreviewPlanIndex }: PlanTierEditorProps) {
  const handleAddPlan = () => {
    setPlans([...plans, {
      id: Date.now().toString(), name: `Option ${plans.length + 1}`, tag: '',
      amount: '29.00', interval: 'month', description: '',
      features: ['Instant access'], featured: false,
    }]);
  };
  const handleRemovePlan = (index: number) => {
    if (plans.length <= 1) return;
    const next = plans.filter((_, i) => i !== index);
    setPlans(next);
    if (previewPlanIndex >= next.length) setPreviewPlanIndex(0);
  };
  const handleUpdatePlan = (index: number, field: keyof PlanDraft, value: any) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
  };
  const handleAddFeature = (planIndex: number) => {
    const updated = [...plans];
    updated[planIndex].features.push('Feature');
    setPlans(updated);
  };
  const handleUpdateFeature = (planIndex: number, featureIndex: number, text: string) => {
    const updated = [...plans];
    updated[planIndex].features[featureIndex] = text;
    setPlans(updated);
  };
  const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
    const updated = [...plans];
    updated[planIndex].features = updated[planIndex].features.filter((_, i) => i !== featureIndex);
    setPlans(updated);
  };

  return (
    <div className="rounded-ctl border border-line bg-surface p-6 sm:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h6 font-medium text-ink flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            Pricing options ({plans.length})
          </h2>
          <p className="text-tiny text-ink-3 mt-0.5">Customers choose from these at checkout.</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={handleAddPlan} className="gap-2">
          <Plus className="w-3.5 h-3.5" />
          Add option
        </Button>
      </div>

      <div className="space-y-3">
        {plans.map((p, idx) => (
          <div
            key={p.id}
            className={`p-4 rounded-ctl border transition-colors ${
              p.featured ? 'border-accent/40 bg-accent/[0.05]' : 'border-line bg-raised'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-raised border border-line text-accent font-mono text-nano font-medium flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-tiny font-medium text-ink">{p.name || `Plan #${idx + 1}`}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-nano flex items-center gap-1.5 cursor-pointer font-mono uppercase tracking-mono-cap text-ink-3 hover:text-ink">
                  <input
                    type="checkbox"
                    checked={p.featured}
                    onChange={(e) => handleUpdatePlan(idx, 'featured', e.target.checked)}
                    className="rounded border-line accent-[var(--accent)]"
                  />
                  <span>Highlight</span>
                </label>
                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlan(idx)}
                    className="text-ink-3 hover:text-danger p-1 transition-colors"
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-nano text-ink-3 block mb-1">Option name</label>
                <Input type="text" placeholder="e.g. Pro plan" value={p.name} onChange={(e) => handleUpdatePlan(idx, 'name', e.target.value)} />
              </div>
              <div>
                <label className="text-nano text-ink-3 block mb-1">Badge / tag (optional)</label>
                <Input type="text" placeholder="e.g. Most popular" value={p.tag} onChange={(e) => handleUpdatePlan(idx, 'tag', e.target.value)} />
              </div>
              <div>
                <label className="text-nano text-ink-3 block mb-1">Price (USDC)</label>
                <Input type="number" step="0.01" placeholder="29.00" value={p.amount} onChange={(e) => handleUpdatePlan(idx, 'amount', e.target.value)} className="font-mono font-medium" />
              </div>
            </div>

            <div>
              <label className="text-nano text-ink-3 block mb-1">Description (optional)</label>
              <Input type="text" placeholder="Brief summary of what's included" value={p.description} onChange={(e) => handleUpdatePlan(idx, 'description', e.target.value)} className="mb-3" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-nano text-ink-3 font-medium">Highlights / features</label>
                <button
                  type="button"
                  onClick={() => handleAddFeature(idx)}
                  className="text-nano text-accent hover:underline font-mono uppercase tracking-mono-cap"
                >
                  + Add feature
                </button>
              </div>
              <div className="space-y-1.5">
                {p.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex gap-2 items-center">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <Input type="text" value={feat} onChange={(e) => handleUpdateFeature(idx, fIdx, e.target.value)} className="h-8" />
                    <button type="button" onClick={() => handleRemoveFeature(idx, fIdx)} className="text-ink-3 hover:text-danger transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
