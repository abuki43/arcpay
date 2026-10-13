import Image from 'next/image';
import { Eyebrow } from './eyebrow';
import { Reveal } from './motion';

export function CinemaPanel() {
  return (
    <section className="relative border-b border-line overflow-hidden min-h-[680px] flex items-center">
      {/* Background image — full bleed */}
      <Image
        src="/hero-cinema.jpg"
        alt="Long-exposure photograph of a merchant terminal at night, with amber light trails passing across an instrument panel"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Gradient scrim — strong at top (kills cyan sky behind heading), strong at bottom (event card readability) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-canvas/95 via-canvas/70 to-canvas/95"
      />

      {/* Frosted overlay — softens the image for text readability */}
      <div
        aria-hidden
        className="absolute inset-0 bg-canvas/30 backdrop-blur-sm"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-10 w-full pt-24 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        <Reveal className="lg:col-span-7">
          <Eyebrow className="mb-6 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">The rail</Eyebrow>
          <h2 className="text-h2 sm:text-display font-semibold text-ink leading-[1.02] tracking-[-0.02em] max-w-2xl drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)]">
            Sub-second settlement,{' '}
            <span className="font-medium italic text-accent drop-shadow-[0_2px_12px_rgba(245,165,36,0.4)]">visible to the merchant</span>.
          </h2>
          <p className="mt-5 text-lead text-ink-2 max-w-xl leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]">
            Every order settled through the gateway is an on-chain event.
            The ArcPay dashboard streams the live ledger so finance, ops,
            and engineering see the same source of truth.
          </p>
        </Reveal>

        <Reveal delay={0.05} className="lg:col-span-5 lg:justify-self-end w-full max-w-md">
          <div className="rounded-ctl border border-line/40 bg-canvas/70 backdrop-blur-md p-4 text-tiny text-ink font-mono">
            <div className="flex items-center gap-2 mb-2 text-nano uppercase tracking-mono-cap text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent arc-pulse" />
              Settlement · event 48293
            </div>
            <div className="text-ink">orderId <span className="text-ink-2">0x7e1c…f3a0</span></div>
            <div className="text-ink">merchant <span className="text-ink-2">0x91ad…7b22</span></div>
            <div className="text-ink">gross <span className="text-accent">29.00 USDC</span></div>
            <div className="text-ink-3">fee −0.116 · net 28.884 · ~600ms</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
