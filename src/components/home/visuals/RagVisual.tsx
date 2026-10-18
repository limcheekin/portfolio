import { useRef } from 'react';
import type { VisualProps } from '../types';
import { useVisualTimeline } from './useVisualTimeline';
import VizFrame from './VizFrame';

const STEP = 0.8;
const PTS: [number, number][] = [[96, 40], [112, 62], [128, 34], [104, 92], [140, 78], [120, 118], [150, 52], [160, 100], [132, 140], [90, 128], [170, 70], [146, 124], [178, 40], [184, 112]];
const HITS = [4, 7, 10];
const DOCS: [number, number][] = [[14, 18], [58, 30], [102, 18]];

export default function RagVisual({ active }: VisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  useVisualTimeline(ref, active, (tl) => {
    tl.from('.doc', { opacity: 0, y: 5, duration: 0.35 }, 0);
    tl.from('.dot, .q', { opacity: 0, y: 5, duration: 0.35 }, STEP);
    tl.from('.hit', { scale: 1, duration: 0.4 }, 2 * STEP);
    tl.from('.glow', { opacity: 0, duration: 0.4 }, 2 * STEP);
    tl.from('.ans', { opacity: 0, y: 5, duration: 0.35 }, 3 * STEP);
  });
  return (
    <VizFrame frameRef={ref}>
      {DOCS.map(([top, left], i) => (
        <div key={i} className="doc absolute w-11 h-[54px] bg-[#141417] border border-[#2e2e33] rounded-[4px]" style={{ top, left }}>
          <div className="absolute inset-x-[7px] top-[9px] h-1 bg-[#2e2e33] rounded-[2px] shadow-[0_9px_0_#2e2e33,0_18px_0_#2e2e33,0_27px_0_#2e2e33]" />
        </div>
      ))}
      <div className="q absolute right-[14px] top-4 bg-[#1d1d22] rounded-[9px] px-[9px] py-[5px] text-[#f2f2f2]">what&apos;s our refund policy?</div>
      {PTS.map(([x, y], i) => {
        const hit = HITS.includes(i);
        return (
          <div key={i} className={`dot ${hit ? 'hit' : ''} absolute w-[7px] h-[7px] rounded-full bg-[#3a4a55]`} style={{ left: x, top: y, ...(hit ? { transform: 'scale(1.4)' } : {}) }}>
            {hit && <span className="glow absolute inset-0 rounded-full bg-sky shadow-[0_0_10px_#38bdf8]" />}
          </div>
        );
      })}
      <div className="ans absolute right-[14px] bottom-[18px] w-[110px] bg-[#0c1f2a] border border-[#1e3a4a] rounded-[9px_9px_2px_9px] px-[9px] py-[7px] text-[#cbeeff] leading-[1.45]">
        Refunds within 30 days… <span className="text-sky">[3 sources]</span>
      </div>
    </VizFrame>
  );
}
