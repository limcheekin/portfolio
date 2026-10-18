import { useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap';
import { MQ } from '../../lib/motion';
import { VISUALS } from './visuals';
import type { WorkCard } from './types';

type Mode = 'pin' | 'swipe' | 'reduce';

const pad = (n: number) => String(n).padStart(2, '0');
const GUTTER = 'px-6 sm:px-10 md:px-16 lg:px-24';
// Layout modes (`pin` / `nopin` are Tailwind screens defined from MQ.pin; class strings stay literal
// for Tailwind's scanner):
// - pinned track: wide AND tall viewport (MQ.pin), motion allowed;
// - swipe row: every other motion case (narrow, or short-and-wide such as landscape phones).
// scrollWidth ignores the track's right padding while it is not a scroll container, so on the pinned
// track a trailing pseudo item (gutter minus the 24px gap) lets the last card stop at the gutter.
const END_GUTTER =
  "pin:motion-safe:after:block pin:motion-safe:after:shrink-0 pin:motion-safe:after:content-[''] [@media(min-width:768px)_and_(max-width:1023px)_and_(min-height:560px)]:motion-safe:after:w-10 [@media(min-width:1024px)_and_(min-height:560px)]:motion-safe:after:w-[72px]";
const SWIPE_ROW = 'nopin:motion-safe:snap-x nopin:motion-safe:snap-mandatory nopin:motion-safe:overflow-x-auto nopin:motion-safe:pb-2';
const PINNED_SECTION = 'pin:motion-safe:flex pin:motion-safe:h-screen pin:motion-safe:flex-col pin:motion-safe:justify-center pin:motion-safe:py-0';

export default function WorkTrack({ cards }: { cards: WorkCard[] }) {
  const n = cards.length;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const fill = useRef<HTMLElement>(null);
  const pinRef = useRef<ScrollTrigger | null>(null);
  const modeRef = useRef<Mode>('pin');
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

      // One branch per mode; GSAP re-runs it (after reverting the last run) whenever a condition flips.
      // Swipe is motion AND `not all and MQ.pin`, the complement of the pin screen.
      mm.add({ pin: MQ.pin, motion: MQ.motion, reduce: MQ.reduce }, (ctx) => {
        const { pin, motion, reduce } = ctx.conditions as Record<'pin' | 'motion' | 'reduce', boolean>;

        // Reduced motion (any width): static wrapped grid, nothing glows or moves.
        if (reduce) {
          modeRef.current = 'reduce';
          setActive(-1);
          return;
        }
        if (!motion) return;

        // Wide and tall: pin the section and translate the inner track sideways.
        if (pin) {
          modeRef.current = 'pin';
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
        }

        // Narrow, or short-and-wide: native swipe row with snap. Among the cards at least 60% visible
        // inside the row, the one whose centre is nearest the row's centre is active.
        modeRef.current = 'swipe';
        gsap.set(fillEl, { scaleX: 0 });
        const setFill = gsap.quickSetter(fillEl, 'scaleX') as (v: number) => void;
        const qualifying = new Set<number>();

        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const i = items.indexOf(e.target as HTMLElement);
              if (e.isIntersecting && e.intersectionRatio >= 0.6) qualifying.add(i);
              else qualifying.delete(i);
            }
            if (qualifying.size === 0) return;
            const box = trackEl.getBoundingClientRect();
            const mid = box.left + box.width / 2;
            let best = -1;
            let bestDist = Infinity;
            for (const i of qualifying) {
              const r = items[i].getBoundingClientRect();
              const d = Math.abs(r.left + r.width / 2 - mid);
              if (d < bestDist) {
                bestDist = d;
                best = i;
              }
            }
            setFill(n > 1 ? best / (n - 1) : 1);
            setActive(best);
          },
          // Extra thresholds above 0.6 re-run the decision as cards keep moving towards the centre.
          { root: trackEl, threshold: [0.6, 0.7, 0.8, 0.9, 1] },
        );
        items.forEach((el) => io.observe(el));

        return () => io.disconnect();
      });

      return () => mm.revert();
    },
    { scope: section },
  );

  // Keyboard: focusing a card makes it active and brings it into view.
  const onCardFocus = (i: number, el: HTMLElement) => {
    if (!el.matches(':focus-visible')) return; // pointer clicks focus links too; only follow keyboard focus
    if (modeRef.current === 'pin') {
      const st = pinRef.current;
      if (!st) return;
      const y = st.start + (n > 1 ? i / (n - 1) : 0) * (st.end - st.start);
      const reduced = window.matchMedia(MQ.reduce).matches;
      if (lenis) lenis.scrollTo(y, { immediate: reduced });
      else window.scrollTo(0, y);
    } else if (modeRef.current === 'swipe') {
      el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  };

  // -1: reduced motion, where every card shows its finished, undimmed frame.
  const settled = activeIndex === -1;

  return (
    <section
      ref={section}
      id="work"
      aria-labelledby="work-title"
      className={`relative overflow-x-clip py-20 ${PINNED_SECTION}`}
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
        className={`flex gap-6 ${GUTTER} ${SWIPE_ROW} motion-reduce:flex-wrap motion-reduce:justify-center ${END_GUTTER}`}
      >
        {cards.map((card, i) => {
          const isActive = i === activeIndex;
          const oss = card.kind === 'oss';
          const more = card.kind === 'more';
          const Visual = card.visual ? VISUALS[card.visual] : undefined;
          const activeCls = isActive
            ? `is-active opacity-100 ${oss ? 'border-[rgba(56,189,248,.55)] shadow-[0_0_60px_rgba(56,189,248,.06)]' : 'border-[rgba(0,217,146,.55)] shadow-[0_0_60px_rgba(0,217,146,.06)]'}`
            : `border-[#26262a] ${settled ? 'opacity-100' : 'opacity-90'}`;
          return (
            <li key={card.slug} className="shrink-0 snap-center">
              <a
                href={card.href}
                data-card
                onFocus={(e) => onCardFocus(i, e.currentTarget)}
                className={`flex h-full w-[min(360px,80vw)] [@media(min-height:560px)]:h-[min(470px,72vh)] flex-col overflow-hidden rounded-2xl border p-[22px] transition-[opacity,border-color,box-shadow] duration-[400ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-accent ${
                  more ? 'justify-center border-dashed bg-transparent' : 'bg-[#0e0e10]'
                } ${activeCls}`}
              >
                {!more && (
                  <div
                    aria-hidden="true"
                    data-visual
                    className={`relative h-[170px] shrink-0 overflow-hidden rounded-[10px] border border-[#1d1d21] bg-[#09090b] bg-[radial-gradient(circle_at_1px_1px,#1b1b1f_1px,transparent_0)] bg-[length:14px_14px] font-mono text-[10.5px] transition-[opacity,filter] duration-[400ms] ease-out ${
                      isActive || settled ? '' : 'opacity-70 saturate-[.55]'
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
        <div className="h-[2px] rounded-sm bg-light-graphite">
          <i ref={fill} data-progress className="block h-full origin-left rounded-sm bg-green-accent" />
        </div>
      </div>
    </section>
  );
}
