import type { VisualProps } from '../types';
import { reveal } from './helpers';
import VizFrame from './VizFrame';

const STEP = 0.8;
const PTS: [number, number][] = [[96, 40], [112, 62], [128, 34], [104, 92], [140, 78], [120, 118], [150, 52], [160, 100], [132, 140], [90, 128], [170, 70], [146, 124], [178, 40], [184, 112]];
const HITS = [4, 7, 10];
const DOCS: [number, number][] = [[14, 18], [58, 30], [102, 18]];

export default function RagVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    reveal(tl, '.doc', 0);
    reveal(tl, '.dot, .q', STEP);
    tl.from('.hit', { scale: 1, duration: 0.4 }, 2 * STEP);
    tl.from('.glow', { opacity: 0, duration: 0.4 }, 2 * STEP);
    reveal(tl, '.ans', 3 * STEP);
  };
  return (
    <VizFrame active={active} build={build}>
      {DOCS.map(([top, left], i) => (
        <div key={i} className="doc absolute w-11 h-[54px] bg-graphite border border-edge-strong rounded-[4px]" style={{ top, left }}>
          <div className="absolute inset-x-[7px] top-[9px] h-1 bg-edge-strong rounded-[2px] shadow-doc-lines" />
        </div>
      ))}
      <div className="q absolute right-[14px] top-4 bg-light-graphite rounded-[9px] px-[9px] py-[5px] text-lightest-slate">what&apos;s our refund policy?</div>
      {PTS.map(([x, y], i) => {
        const hit = HITS.includes(i);
        return (
          <div key={i} className={`dot ${hit ? 'hit' : ''} absolute w-[7px] h-[7px] rounded-full bg-slate-text/40`} style={{ left: x, top: y, ...(hit ? { transform: 'scale(1.4)' } : {}) }}>
            {hit && <span className="glow absolute inset-0 rounded-full bg-sky shadow-spark" />}
          </div>
        );
      })}
      <div className="ans absolute right-[14px] bottom-[18px] w-[110px] bg-sky-deep border border-sky-dim rounded-[9px_9px_2px_9px] px-[9px] py-[7px] text-sky-pale leading-[1.45]">
        Refunds within 30 days… <span className="text-sky">[3 sources]</span>
      </div>
    </VizFrame>
  );
}
