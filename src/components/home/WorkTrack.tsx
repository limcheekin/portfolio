import { useRef, useState } from 'react';
import { useLenis } from 'lenis/react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMatchMedia } from '../../lib/use-match-media';
import { MQ } from '../../lib/motion';
import { GUTTER } from '../../lib/layout';
import { PROJECT_KIND_INFO } from '../../lib/project-kind';
import SectionHeading from './SectionHeading';
import { VISUALS } from './visuals';
import type { WorkCard } from './types';

type Mode = 'pin' | 'swipe' | 'reduce';

const pad = (n: number) => String(n).padStart(2, '0');
// Layout modes (`pin` / `nopin` are Tailwind screens defined from MQ.pin; class strings stay literal
// for Tailwind's scanner):
// - pinned track: wide AND tall viewport (MQ.pin), motion allowed;
// - swipe row: every other motion case (narrow, or short-and-wide such as landscape phones).
// scrollWidth ignores the track's right padding while it is not a scroll container, so on the pinned
// track a trailing pseudo item (gutter minus the track's gap-6) lets the last card stop at the gutter.
const END_GUTTER =
  "pin:motion-safe:after:block pin:motion-safe:after:shrink-0 pin:motion-safe:after:content-[''] pin:motion-safe:after:w-[calc(var(--gutter)-theme(spacing.6))]";
// A scroll container clips on both axes, so the swipe row pads top and bottom to keep the cards' focus
// outlines (2px at a 4px offset) visible; the negative top margin keeps the row where it was.
const SWIPE_ROW =
  'nopin:motion-safe:snap-x nopin:motion-safe:snap-mandatory nopin:motion-safe:overflow-x-auto nopin:motion-safe:-mt-2 nopin:motion-safe:py-2';
// Accent classes per accent colour (literal strings for Tailwind's scanner).
const ACCENT = {
  green: { glow: 'border-green-accent/[.55] shadow-glow-green', label: 'text-green-accent' },
  sky: { glow: 'border-sky/[.55] shadow-glow-sky', label: 'text-sky' },
} as const;
const PINNED_SECTION = 'pin:motion-safe:flex pin:motion-safe:h-screen pin:motion-safe:flex-col pin:motion-safe:justify-center pin:motion-safe:py-0';

export default function WorkTrack({ cards }: { cards: WorkCard[] }) {
  const count = cards.length;
  // Track progress (0..1) and card index map onto each other the same way in every mode.
  const indexAt = (progress: number) => Math.round(progress * (count - 1));
  const progressAt = (index: number) => (count > 1 ? index / (count - 1) : 0);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const fill = useRef<HTMLElement>(null);
  const pinRef = useRef<ScrollTrigger | null>(null);
  const lenis = useLenis();
  // Mode and visibility change only when a media query flips or the section enters or leaves the viewport.
  const [mode, setMode] = useState<Mode>('pin');
  const [inView, setInView] = useState(false);

  // The active index lives in a ref; React state only changes when the index changes.
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const setActive = (i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActiveIndex(i);
  };

  useMatchMedia(section, (mm, sectionEl) => {
    const trackEl = track.current;
    const fillEl = fill.current;
    if (!trackEl || !fillEl) return;
    const items = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-card]'));
    // Empties the progress line and returns its setter (0..1).
    const resetFill = () => {
      gsap.set(fillEl, { scaleX: 0 });
      return gsap.quickSetter(fillEl, 'scaleX') as (v: number) => void;
    };

    // One branch per mode; GSAP re-runs it (after reverting the last run) whenever a condition flips.
    // Swipe is motion AND `not all and MQ.pin`, the complement of the pin screen.
    mm.add({ pin: MQ.pin, motion: MQ.motion, reduce: MQ.reduce }, (ctx) => {
      const { pin, motion, reduce } = ctx.conditions as Record<'pin' | 'motion' | 'reduce', boolean>;

      // Reduced motion (any width): static wrapped grid, nothing glows or moves.
      if (reduce) {
        setMode('reduce');
        return;
      }
      if (!motion) return;

      // The active card's illustration plays only while at least 10% of the section is on screen (a
      // pinned section stays visible for the whole pin). The threshold keeps a section that only
      // touches the fold, as it does under the full-height hero, from counting as visible.
      const visibility = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.1), { threshold: 0.1 });
      visibility.observe(sectionEl);

      // Wide and tall: pin the section and translate the inner track sideways.
      if (pin) {
        setMode('pin');
        const setFill = resetFill();
        const distance = () => trackEl.scrollWidth - window.innerWidth;
        const sync = (progress: number) => {
          setFill(progress);
          setActive(indexAt(progress));
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
          visibility.disconnect();
          pinRef.current = null;
        };
      }

      // Narrow, or short-and-wide: native swipe row with snap. Among the cards at least 60% visible
      // inside the row, the one whose centre is nearest the row's centre is active.
      setMode('swipe');
      const setFill = resetFill();
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
          setFill(progressAt(best));
          setActive(best);
        },
        // Extra thresholds above 0.6 re-run the decision as cards keep moving towards the centre.
        { root: trackEl, threshold: [0.6, 0.7, 0.8, 0.9, 1] },
      );
      items.forEach((el) => io.observe(el));

      return () => {
        visibility.disconnect();
        io.disconnect();
      };
    });
  });

  // Keyboard: focusing a card makes it active and brings it into view.
  const onCardFocus = (i: number, el: HTMLElement) => {
    if (!el.matches(':focus-visible')) return; // pointer clicks focus links too; only follow keyboard focus
    if (mode === 'pin') {
      const st = pinRef.current;
      if (!st) return;
      const y = st.start + progressAt(i) * (st.end - st.start);
      const reduced = window.matchMedia(MQ.reduce).matches;
      if (lenis) lenis.scrollTo(y, { immediate: reduced });
      else window.scrollTo(0, y);
    } else if (mode === 'swipe') {
      el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  };

  // Reduced motion: no card is active and every card shows its finished, undimmed frame.
  const settled = mode === 'reduce';

  return (
    <section
      ref={section}
      id="work"
      aria-labelledby="work-title"
      className={`relative overflow-x-clip py-20 ${PINNED_SECTION}`}
    >
      <div className={`mb-10 flex items-end justify-between gap-6 ${GUTTER}`}>
        <SectionHeading number="01" id="work-title">Selected Work</SectionHeading>
        <p aria-hidden="true" className="font-mono text-[13px] text-slate-text motion-reduce:hidden">
          <span data-counter className="text-lightest-slate">{pad(activeIndex + 1)}</span> / {pad(count)}
        </p>
      </div>

      <ul
        ref={track}
        data-track
        // Horizontal wheel and trackpad gestures over the row scroll it natively instead of going to Lenis.
        data-lenis-prevent-horizontal
        className={`flex gap-6 ${GUTTER} ${SWIPE_ROW} motion-reduce:flex-wrap motion-reduce:justify-center ${END_GUTTER}`}
      >
        {cards.map((card, i) => {
          const isActive = !settled && i === activeIndex;
          const isDimmed = !settled && !isActive;
          const isMoreCard = card.kind === 'more';
          const accent = ACCENT[card.kind === 'more' ? 'green' : PROJECT_KIND_INFO[card.kind].accent];
          const Visual = card.visual ? VISUALS[card.visual] : undefined;
          // The "All projects" card is a link to the list, not a section of the page: no heading.
          const Title = isMoreCard ? 'p' : 'h3';
          return (
            <li key={card.slug} className="shrink-0 snap-center">
              <a
                href={card.href}
                data-card
                data-testid={isMoreCard ? 'work-card-all' : 'work-card'}
                data-slug={isMoreCard ? undefined : card.slug}
                onFocus={(e) => onCardFocus(i, e.currentTarget)}
                className={`relative flex h-full w-[min(360px,80vw)] tall:h-[min(470px,72vh)] flex-col overflow-hidden rounded-2xl border border-edge p-[22px] transition-opacity duration-[400ms] ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-accent ${
                  isMoreCard ? 'justify-center border-dashed bg-transparent' : 'bg-card'
                } ${isActive ? 'is-active' : ''} ${isDimmed ? 'opacity-90' : 'opacity-100'}`}
              >
                {/* Active glow: a border-and-shadow overlay that fades in, so only opacity transitions. */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -inset-px rounded-2xl border transition-opacity duration-[400ms] ease-out ${
                    accent.glow
                  } ${isActive ? 'opacity-100' : 'opacity-0'}`}
                />
                {!isMoreCard && (
                  // Desaturation switches instantly; only the opacity change transitions.
                  <div
                    aria-hidden="true"
                    data-visual
                    className={`relative box-content aspect-[312/170] shrink-0 overflow-hidden rounded-[10px] border border-light-graphite bg-well bg-dot-pattern bg-[length:14px_14px] font-mono text-[10.5px] transition-opacity duration-[400ms] ease-out ${
                      isDimmed ? 'opacity-70 saturate-[.55]' : ''
                    }`}
                  >
                    {Visual && <Visual active={isActive && inView} />}
                  </div>
                )}
                <p className={`${isMoreCard ? '' : 'mt-[18px]'} font-mono text-[11px] uppercase tracking-[0.08em] ${accent.label}`}>
                  {card.label}
                </p>
                <Title className={`my-2 font-semibold tracking-[-0.02em] ${isMoreCard ? 'text-[28px] text-green-accent' : 'text-2xl text-lightest-slate'}`}>
                  {card.title}
                </Title>
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
