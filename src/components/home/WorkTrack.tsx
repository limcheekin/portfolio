import { useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap';
import { MQ } from '../../lib/motion';
import { VISUALS } from './visuals';
import type { WorkCard } from './types';

type Mode = 'desktop' | 'mobile' | 'reduce';

const pad = (n: number) => String(n).padStart(2, '0');
const GUTTER = 'px-6 sm:px-10 md:px-16 lg:px-24';
// scrollWidth ignores the track's right padding while it is not a scroll container, so on the pinned
// desktop track a trailing pseudo item (gutter minus the 24px gap) lets the last card stop at the gutter.
const END_GUTTER =
  "md:motion-safe:after:block md:motion-safe:after:shrink-0 md:motion-safe:after:content-[''] md:motion-safe:after:w-10 lg:motion-safe:after:w-[72px]";

export default function WorkTrack({ cards }: { cards: WorkCard[] }) {
  const n = cards.length;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const fill = useRef<HTMLElement>(null);
  const pinRef = useRef<ScrollTrigger | null>(null);
  const modeRef = useRef<Mode>('desktop');
  const lenis = useLenis();

  // The active index lives in a ref; React state only changes when the index changes.
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const setActive = (i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActiveIndex(i);
  };

  useGSAP(
    () => {
      const sectionEl = section.current;
      const trackEl = track.current;
      const fillEl = fill.current;
      if (!sectionEl || !trackEl || !fillEl) return;
      const mm = gsap.matchMedia(sectionEl);
      const items = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-card]'));

      // Desktop: pin the section and translate the inner track sideways.
      mm.add(`${MQ.desktop} and ${MQ.motion}`, () => {
        modeRef.current = 'desktop';
        gsap.set(fillEl, { scaleX: 0 });
        const setFill = gsap.quickSetter(fillEl, 'scaleX') as (v: number) => void;
        const distance = () => trackEl.scrollWidth - window.innerWidth;
        const sync = (progress: number) => {
          setFill(progress);
          setActive(Math.round(progress * (n - 1)));
        };

        const tween = gsap.to(trackEl, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => '+=' + distance(),
            invalidateOnRefresh: true,
            refreshPriority: 10,
            onUpdate: (self) => sync(self.progress),
          },
        });
        const st = tween.scrollTrigger!;
        pinRef.current = st;
        sync(st.progress);

        return () => {
          pinRef.current = null;
        };
      });

      // Mobile: native swipe row with snap; the card most in view (within the row) is active.
      mm.add(`${MQ.mobile} and ${MQ.motion}`, () => {
        modeRef.current = 'mobile';
        gsap.set(fillEl, { scaleX: 0 });
        const setFill = gsap.quickSetter(fillEl, 'scaleX') as (v: number) => void;
        const ratios = new Map<number, number>();

        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const i = items.indexOf(e.target as HTMLElement);
              if (e.isIntersecting && e.intersectionRatio >= 0.6) ratios.set(i, e.intersectionRatio);
              else ratios.delete(i);
            }
            if (ratios.size === 0) return;
            const mid = trackEl.getBoundingClientRect().left + trackEl.clientWidth / 2;
            const dist = (i: number) => {
              const r = items[i].getBoundingClientRect();
              return Math.abs(r.left + r.width / 2 - mid);
            };
            const best = [...ratios.keys()].sort((a, b) => ratios.get(b)! - ratios.get(a)! || dist(a) - dist(b))[0];
            setFill(n > 1 ? best / (n - 1) : 1);
            setActive(best);
          },
          { root: trackEl, threshold: 0.6 },
        );
        items.forEach((el) => io.observe(el));

        return () => io.disconnect();
      });

      // Reduced motion (any width): static wrapped grid, nothing glows or moves.
      mm.add(MQ.reduce, () => {
        modeRef.current = 'reduce';
        setActive(-1);
      });

      return () => mm.revert();
    },
    { scope: section },
  );

  // Keyboard: focusing a card makes it active and brings it into view.
  const onCardFocus = (i: number, el: HTMLElement) => {
    if (!el.matches(':focus-visible')) return; // pointer clicks focus links too; only follow keyboard focus
    if (modeRef.current === 'desktop') {
      const st = pinRef.current;
      if (!st) return;
      const y = st.start + (n > 1 ? i / (n - 1) : 0) * (st.end - st.start);
      const reduced = window.matchMedia(MQ.reduce).matches;
      if (lenis) lenis.scrollTo(y, { immediate: reduced });
      else window.scrollTo(0, y);
    } else if (modeRef.current === 'mobile') {
      el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  };

  return (
    <section
      ref={section}
      id="work"
      aria-labelledby="work-title"
      className="relative overflow-x-clip py-20 md:motion-safe:flex md:motion-safe:h-screen md:motion-safe:flex-col md:motion-safe:justify-center md:motion-safe:py-0"
    >
      <div className={`mb-10 flex items-end justify-between gap-6 ${GUTTER}`}>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-lg text-green-accent md:text-2xl">01</span>
          <h2 id="work-title" className="text-[clamp(28px,4vw,48px)] font-semibold leading-tight tracking-[-0.03em] text-lightest-slate">
            Selected Work
          </h2>
        </div>
        <p aria-hidden="true" className="font-mono text-[13px] text-slate-text motion-reduce:hidden">
          <span data-counter className="text-lightest-slate">{pad(Math.max(activeIndex, 0) + 1)}</span> / {pad(n)}
        </p>
      </div>

      <ul
        ref={track}
        data-track
        className={`flex gap-6 ${GUTTER} max-md:motion-safe:snap-x max-md:motion-safe:snap-mandatory max-md:motion-safe:overflow-x-auto max-md:motion-safe:pb-2 motion-reduce:flex-wrap motion-reduce:justify-center ${END_GUTTER}`}
      >
        {cards.map((card, i) => {
          const isActive = i === activeIndex;
          const oss = card.kind === 'oss';
          const more = card.kind === 'more';
          const Visual = card.visual ? VISUALS[card.visual] : undefined;
          const activeCls = isActive
            ? `is-active opacity-100 shadow-[0_0_60px_rgba(0,217,146,.06)] ${oss ? 'border-[rgba(56,189,248,.55)]' : 'border-[rgba(0,217,146,.55)]'}`
            : `border-[#26262a] ${activeIndex === -1 ? 'opacity-100' : 'opacity-90'}`;
          return (
            <li key={card.slug} className="shrink-0 snap-center">
              <a
                href={card.href}
                data-card
                onFocus={(e) => onCardFocus(i, e.currentTarget)}
                className={`flex h-[min(470px,72vh)] w-[min(360px,80vw)] flex-col overflow-hidden rounded-2xl border p-[22px] transition-[opacity,border-color,box-shadow] duration-[400ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-accent ${
                  more ? 'justify-center border-dashed bg-transparent' : 'bg-[#0e0e10]'
                } ${activeCls}`}
              >
                {!more && (
                  <div
                    aria-hidden="true"
                    data-visual
                    className={`relative h-[170px] shrink-0 overflow-hidden rounded-[10px] border border-[#1d1d21] bg-[#09090b] bg-[radial-gradient(circle_at_1px_1px,#1b1b1f_1px,transparent_0)] bg-[length:14px_14px] font-mono text-[10.5px] transition-[opacity,filter] duration-[400ms] ease-out ${
                      isActive || activeIndex === -1 ? '' : 'opacity-70 saturate-[.55]'
                    }`}
                  >
                    {Visual && <Visual active={isActive} />}
                  </div>
                )}
                <p className={`${more ? '' : 'mt-[18px]'} font-mono text-[11px] uppercase tracking-[0.08em] ${oss ? 'text-sky' : 'text-green-accent'}`}>
                  {card.label}
                </p>
                <h3 className={`my-2 font-semibold tracking-[-0.02em] ${more ? 'text-[28px] text-green-accent' : 'text-2xl text-lightest-slate'}`}>
                  {card.title}
                </h3>
                <p className="text-sm leading-normal text-light-slate">{card.tagline}</p>
                {card.stack.length > 0 && (
                  <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 font-mono text-[11.5px] text-slate-text">
                    {card.stack.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      <div aria-hidden="true" className={`mt-10 motion-reduce:hidden ${GUTTER}`}>
        <div className="h-[2px] rounded-sm bg-[#1c1c20]">
          <i ref={fill} data-progress className="block h-full origin-left rounded-sm bg-green-accent" />
        </div>
      </div>
    </section>
  );
}
