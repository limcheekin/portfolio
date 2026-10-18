import { useRef } from 'react';
import type { VisualProps } from '../types';
import { useVisualTimeline } from './useVisualTimeline';
import { addPulse } from './pulse';
import VizFrame from './VizFrame';

const STEP = 0.8;
const lbl = { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 10, textAnchor: 'middle', dominantBaseline: 'middle' } as const;

export default function ConcordVisual({ active }: VisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  useVisualTimeline(ref, active, (tl) => {
    addPulse(tl, '.cp', 176, 0, 0, 1.8, 3);
    [1, 2, 3].forEach((n, i) => tl.from(`.q${n}`, { opacity: 0, y: 5, duration: 0.35 }, (i + 1) * STEP));
    tl.from('.res', { opacity: 0, y: 5, duration: 0.35 }, 4 * STEP);
  });
  return (
    <VizFrame frameRef={ref}>
      <svg viewBox="0 0 312 170" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <path d="M70 70 L246 70" fill="none" stroke="#26262b" strokeWidth="1" />
        <rect x="16" y="56" width="58" height="28" rx="6" fill="#0f0f12" stroke="#2c2c31" />
        <text x="45" y="70" fill="#b8b3b0" style={lbl}>agent</text>
        <path d="M156 46 l22 8 v14 c0 14 -10 22 -22 26 c-12 -4 -22 -12 -22 -26 v-14 z" fill="#0f0f12" stroke="#38bdf8" />
        <text x="156" y="70" fill="#38bdf8" style={lbl}>MCP</text>
        <ellipse cx="268" cy="52" rx="26" ry="8" fill="#0f0f12" stroke="#2c2c31" />
        <path d="M242 52 v34 c0 4.5 11.6 8 26 8 s26 -3.5 26 -8 v-34" fill="#0f0f12" stroke="#2c2c31" />
        <text x="268" y="74" fill="#b8b3b0" style={lbl}>legacy</text>
        <circle className="cp" cx="70" cy="70" r="3" fill="#38bdf8" />
      </svg>
      <div className="res absolute right-[14px] top-3 text-sky">1 row · allowed: sales</div>
      <div className="absolute left-[14px] right-[14px] bottom-3 text-[#b8b3b0] whitespace-nowrap overflow-hidden">
        <span className="q1 inline-block"><span className="text-sky">SELECT</span> name, credit_lmt&nbsp;</span>
        <span className="q2 inline-block"><span className="text-sky">FROM</span> CUST_MSTR&nbsp;</span>
        <span className="q3 inline-block"><span className="text-sky">WHERE</span> id=1042</span>
      </div>
    </VizFrame>
  );
}
