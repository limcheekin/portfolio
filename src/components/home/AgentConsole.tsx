import { Fragment, useRef, useState } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap';
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

  // Created once: the visibility trigger (motion) or the static first run (reduced motion).
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia(el);

      mm.add(MQ.motion, () => {
        const st = ScrollTrigger.create({
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? tlRef.current?.play() : tlRef.current?.pause()),
        });
        stRef.current = st;
        if (st.isActive) tlRef.current?.play();
        else tlRef.current?.pause();
        return () => {
          stRef.current = null;
        };
      });

      mm.add(MQ.reduce, () => {
        // Static: always show the finished first run.
        setActive(0);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // Per run: reveal the rows one by one, hold, then advance to the next run.
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia(el);

      mm.add(MQ.motion, () => {
        const rows = Array.from(el.querySelectorAll('[data-run-row]'));
        gsap.set(rows, { opacity: 0, y: 6 });
        const tl = gsap.timeline();
        tl.to(rows, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: ROW_GAP });
        tl.call(() => setActive((i) => (i + 1) % runs.length), undefined, `+=${HOLD}`);
        if (!stRef.current?.isActive) tl.pause();
        tlRef.current = tl;
        return () => {
          tlRef.current = null;
        };
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [active, runs.length], revertOnUpdate: true },
  );

  return (
    <div
      ref={root}
      data-agent-console
      aria-hidden="true"
      className="w-full min-w-0 rounded-xl border border-[#2a2a2e] bg-[#0b0b0d] font-mono text-[13px] leading-[1.7] shadow-[0_0_0_1px_rgba(0,217,146,0.06),0_30px_80px_rgba(0,0,0,0.6),0_0_80px_rgba(0,217,146,0.08)]"
    >
      <div className="flex items-center gap-1.5 border-b border-[#1f1f22] px-3.5 py-2.5 text-xs text-slate-text">
        <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#2a2a2e]" />
        <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#2a2a2e]" />
        <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#2a2a2e]" />
        <span className="ml-2">{run.name} · run</span>
      </div>
      <div className="min-h-[250px] px-[18px] pb-[18px] pt-3.5">
        {run.rows.map((row, i) => {
          const done = i === run.rows.length - 1;
          return (
            <div key={`${run.name}-${i}`} data-run-row className="grid grid-cols-[74px_1fr] gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className={done ? 'text-white' : 'text-green-accent'}>{row.step}</span>
              <span className={`overflow-hidden text-ellipsis text-light-slate ${done ? '[&_b]:text-white' : '[&_b]:text-lightest-slate'} [&_b]:font-medium`}>
                {renderDetail(row.detail)}
              </span>
            </div>
          );
        })}
        <div key={`${run.name}-cursor`} data-run-row className="grid grid-cols-[74px_1fr] gap-2.5">
          <span className="text-green-accent">›</span>
          <span><span className="agent-cursor" /></span>
        </div>
      </div>
      <div className="flex gap-1.5 px-[18px] pb-3.5">
        {runs.map((r, i) => (
          <span
            key={r.name}
            className={`rounded border px-2 py-0.5 text-[11px] ${i === active ? 'border-green-accent/40 text-green-accent' : 'border-[#222] text-slate-text'}`}
          >
            {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}
