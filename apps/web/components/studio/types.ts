export interface PlanDraft {
  id: string;
  name: string;
  tag: string;
  amount: string;
  interval: string;
  description: string;
  features: string[];
  featured: boolean;
}

export type StudioPricingMode = 'single_item' | 'multi_plan';
