import { useRef } from 'react';
import { gsap, useGSAP, SplitText } from '../../lib/gsap';
import { MQ } from '../../lib/motion';
import type { HERO_CONTENT } from '../../data/site';

export default function HeroIntro({ content }: { content: typeof HERO_CONTENT }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      const h1 = root?.querySelector('h1');
      if (!root || !h1) return;
      const fades = Array.from(root.querySelectorAll('[data-hero-fade]'));
      const mm = gsap.matchMedia(root);

      mm.add(MQ.motion, () => {
        SplitText.create(h1, {
          type: 'lines, words',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, { yPercent: 100, opacity: 0, stagger: 0.04, duration: 0.8, ease: 'power3.out' }),
        });
        gsap.from(fades, { opacity: 0, y: 12, duration: 0.6, stagger: 0.12, delay: 0.7, ease: 'power2.out' });
      });

      mm.add(MQ.reduce, () => {
        gsap.from(h1, { opacity: 0, duration: 0.2 });
        gsap.from(fades, { opacity: 0, duration: 0.2 });
      });

      return () => mm.revert();
    },
    { scope },
  );

  const { eyebrow, headline, sub, primaryCta, resumeCta } = content;
  const btn =
    'font-mono inline-flex items-center justify-center rounded border px-7 py-3.5 text-sm transition-all duration-250 ease-custom-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy';

  return (
    <div ref={scope}>
      <p data-hero-fade className="font-mono text-green-accent mb-5 text-sm md:text-base">{eyebrow}</p>
      <h1 className="font-display font-bold text-lightest-slate text-4xl sm:text-5xl lg:text-[52px] leading-[1.06] tracking-tight">
        {headline.before}<em className="not-italic text-green-accent">{headline.accent}</em>{headline.after}
      </h1>
      <p data-hero-fade className="text-slate-text text-lg max-w-[520px] mt-6 mb-8 leading-relaxed">{sub}</p>
      <div data-hero-fade className="flex flex-wrap gap-3">
        <a href={primaryCta.href} data-testid="hero-cta" className={`${btn} border-green-accent bg-green-accent text-navy font-semibold hover:opacity-90`}>
          {primaryCta.label}
        </a>
        <a href={resumeCta.href} className={`${btn} border-lightest-navy text-lightest-slate hover:bg-green-tint hover:border-green-accent`}>
          {resumeCta.label}
        </a>
      </div>
    </div>
  );
}
