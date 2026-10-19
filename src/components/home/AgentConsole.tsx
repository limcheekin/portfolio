import { Fragment, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMatchMedia } from '../../lib/use-match-media';
import { MQ } from '../../lib/motion';
import type { AgentRun } from './types';

const ROW_GAP = 0.65;
const HOLD = 2.6;

function renderDetail(detail: string) {
  return detail.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>,
  );
}

export default function AgentConsole({ runs }: { runs: AgentRun[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const run = runs[active];

  // The current run's row timeline and the visibility trigger that plays/pauses it.
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  // The loop also holds while the pointer is over the console or the visitor has paused it (WCAG 2.2.2).
  const hoverRef = useRef(false);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const shouldPlay = () => !!stRef.current?.isActive && !hoverRef.current && !pausedRef.current;
  const sync = () => (shouldPlay() ? tlRef.current?.play() : tlRef.current?.pause());

  // Created once: the visibility trigger (motion) or the static first run (reduced motion).
  useMatchMedia(root, (mm, el) => {
    mm.add(MQ.motion, () => {
      stRef.current = ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: sync,
      });
      sync();
      return () => {
        stRef.current = null;
      };
    });

    mm.add(MQ.reduce, () => {
      // Static: always show the finished first run.
      setActive(0);
    });
  });

  // Per run: reveal the rows one by one, hold, then advance to the next run.
  useMatchMedia(
    root,
    (mm, el) => {
      mm.add(MQ.motion, () => {
        const rows = Array.from(el.querySelectorAll('[data-run-row]'));
        gsap.set(rows, { opacity: 0, y: 6 });
        const tl = gsap.timeline();
        tl.to(rows, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: ROW_GAP });
        tl.call(() => setActive((i) => (i + 1) % runs.length), undefined, `+=${HOLD}`);
        if (!shouldPlay()) tl.pause();
        tlRef.current = tl;
        return () => {
          tlRef.current = null;
        };
      });
    },
    { dependencies: [active, runs.length], revertOnUpdate: true },
  );

  const setHover = (on: boolean) => {
    hoverRef.current = on;
    sync();
  };
  const togglePaused = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    sync();
  };

  return (
    <div className="relative w-full min-w-0" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div
        ref={root}
        data-agent-console
        aria-hidden="true"
        className="w-full rounded-xl border border-edge bg-well font-mono text-[13px] leading-[1.7] shadow-console"
      >
        <div className="flex items-center gap-1.5 border-b border-light-graphite py-2.5 pl-3.5 pr-12 text-xs text-slate-text">
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-edge" />
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-edge" />
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-edge" />
          <span className="ml-2">{run.name} · run</span>
        </div>
        <div className="min-h-[250px] px-[18px] pb-[18px] pt-3.5">
          {run.rows.map((row, i) => {
            const done = i === run.rows.length - 1;
            return (
              <div key={`${run.name}-${i}`} data-run-row className="grid grid-cols-[74px_1fr] gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
                <span className={done ? 'text-white-text' : 'text-green-accent'}>{row.step}</span>
                <span className={`overflow-hidden text-ellipsis text-light-slate ${done ? '[&_b]:text-white-text' : '[&_b]:text-lightest-slate'} [&_b]:font-medium`}>
                  {renderDetail(row.detail)}
                </span>
              </div>
            );
          })}
          <div key={`${run.name}-cursor`} data-run-row className="grid grid-cols-[74px_1fr] gap-2.5">
            <span className="text-green-accent">›</span>
            <span><span className={`agent-cursor ${paused ? '[animation-play-state:paused]' : ''}`} /></span>
          </div>
        </div>
        <div className="flex gap-1.5 px-[18px] pb-3.5">
          {runs.map((r, i) => (
            <span
              key={r.name}
              className={`rounded border px-2 py-0.5 text-[11px] ${i === active ? 'border-green-accent/40 text-green-accent' : 'border-edge text-slate-text'}`}
            >
              {r.name}
            </span>
          ))}
        </div>
      </div>
      {/* Outside the aria-hidden console so it stays operable. Hidden under reduced motion: nothing loops. */}
      <button
        type="button"
        onClick={togglePaused}
        aria-pressed={paused}
        aria-label="Pause the agent console animation"
        className="absolute -top-0.5 right-0 flex h-11 w-11 items-center justify-center rounded text-slate-text transition-colors duration-250 hover:text-green-accent motion-reduce:hidden"
      >
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          {paused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}
        </svg>
      </button>
    </div>
  );
}
