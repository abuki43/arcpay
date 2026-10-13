'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Eyebrow } from '@/components/eyebrow';
import { Button } from '@/components/ui/button';
import { ModeSelector } from '@/components/studio/mode-selector';
import { GeneralForm } from '@/components/studio/general-form';
import { PlanTierEditor } from '@/components/studio/plan-tier-editor';
import { FulfillmentOptions } from '@/components/studio/fulfillment-options';
import { StudioPreview } from '@/components/studio/studio-preview';
import { PayLinkSuccessModal } from '@/components/studio/paylink-success-modal';
import { Zap } from 'lucide-react';
import type { PlanDraft, StudioPricingMode } from '@/components/studio/types';

export default function PayLinkStudioPage() {
  const { address } = useAccount();

  const [mode, setMode] = useState<StudioPricingMode>('multi_plan');
  const [merchant, setMerchant] = useState<string>('0xf46b169915c5820E9FcdcD79F5AA5B246E32220D');
  const [title, setTitle] = useState<string>('ArcCloud SaaS Platform');
  const [slug, setSlug] = useState<string>('arc-cloud-saas');
  const [description, setDescription] = useState<string>('Developer infrastructure for autonomous Web3 applications.');
  const [amount, setAmount] = useState<string>('29.00');
  const [collectEmail, setCollectEmail] = useState<boolean>(true);
  const [collectDiscord, setCollectDiscord] = useState<boolean>(false);
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [plans, setPlans] = useState<PlanDraft[]>([
    { id: '1', name: 'Starter', tag: 'Basic', amount: '15.00', interval: 'month', description: 'Standard access for developers testing on Arc.', features: ['10,000 API requests', 'Sub-second settlement'], featured: false },
    { id: '2', name: 'Pro', tag: 'Popular', amount: '49.00', interval: 'month', description: 'Full platform access with dedicated API routing.', features: ['Unlimited API requests', 'Direct merchant payout (99.6%)', 'Webhook dispatching'], featured: true },
  ]);

  const [origin, setOrigin] = useState<string>('https://arcpay.network');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [previewPlanIndex, setPreviewPlanIndex] = useState<number>(1);

  useEffect(() => { if (address) setMerchant(address); }, [address]);
  useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin); }, []);

  const activeSlug = savedSlug || slug;
  const publishedUrl = `${origin}/pay/${activeSlug}`;

  const handleSavePayLink = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/paylinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantAddress: merchant, title, description, slug,
          type: mode, amount: mode === 'single_item' ? amount : null,
          redirectUrl: redirectUrl || null, collectEmail, collectDiscord,
          plans: mode === 'multi_plan' ? plans : [],
        }),
      });
      const data = await response.json();
      if (response.ok && data.payLink) {
        setSavedSlug(data.payLink.slug);
        setShowSuccessModal(true);
      } else {
        alert(data.error || 'Failed to create PayLink');
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTitle('New Product');
    setSlug(`product-${Math.floor(Math.random() * 9000 + 1000)}`);
    setDescription('');
    setAmount('25.00');
    setSavedSlug(null);
    setShowSuccessModal(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-28 pb-20 min-h-[85vh]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-10">
          <Eyebrow className="mb-4">PayLink studio</Eyebrow>
          <h1 className="text-h1 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em]">
            Create a{' '}
            <span className="font-medium italic text-accent">PayLink</span>.
          </h1>
          <p className="mt-4 text-lead text-ink-3 leading-relaxed">
            Generate shareable payment links with fixed prices or tiered options,
            email collection, and instant ~600ms settlement.
          </p>
        </div>

        <ModeSelector mode={mode} setMode={setMode} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <GeneralForm
              merchant={merchant} setMerchant={setMerchant}
              title={title} setTitle={setTitle}
              slug={slug} setSlug={setSlug}
              description={description} setDescription={setDescription}
              mode={mode} amount={amount} setAmount={setAmount}
              connectedAddress={address}
            />
            {mode === 'multi_plan' && (
              <PlanTierEditor
                plans={plans} setPlans={setPlans}
                previewPlanIndex={previewPlanIndex} setPreviewPlanIndex={setPreviewPlanIndex}
              />
            )}
            <FulfillmentOptions
              collectEmail={collectEmail} setCollectEmail={setCollectEmail}
              collectDiscord={collectDiscord} setCollectDiscord={setCollectDiscord}
              redirectUrl={redirectUrl} setRedirectUrl={setRedirectUrl}
            />
            <Button onClick={handleSavePayLink} disabled={isSaving} size="lg" className="w-full gap-2">
              <Zap className="w-4 h-4 fill-canvas" />
              <span>{isSaving ? 'Publishing…' : 'Save & publish PayLink'}</span>
            </Button>
          </div>

          <StudioPreview
            mode={mode} title={title} description={description}
            amount={amount} plans={plans}
            previewPlanIndex={previewPlanIndex} setPreviewPlanIndex={setPreviewPlanIndex}
            publishedUrl={publishedUrl} isPublished={Boolean(savedSlug)}
            copied={copied} onCopy={handleCopy}
          />
        </div>
      </div>

      <PayLinkSuccessModal
        isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}
        slug={activeSlug} title={title} publishedUrl={publishedUrl} onReset={handleReset}
      />
    </div>
  );
}
