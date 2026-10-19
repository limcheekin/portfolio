import type { VisualProps } from '../types';
import { addPulse, reveal, svgLabel } from './helpers';
import VizFrame from './VizFrame';

const STEP = 0.8;

export default function ConcordVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    addPulse(tl, '.cp', 176, 0, 0, 1.8, 2);
    [1, 2, 3].forEach((n, i) => reveal(tl, `.q${n}`, (i + 1) * STEP));
    reveal(tl, '.res', 4 * STEP);
  };
  return (
    <VizFrame active={active} build={build}>
      <svg viewBox="0 0 312 170" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <path d="M70 70 L246 70" fill="none" className="stroke-edge" strokeWidth="1" />
        <rect x="16" y="56" width="58" height="28" rx="6" className="fill-card stroke-edge-strong" />
        <text x="45" y="70" className="fill-light-slate" style={svgLabel}>agent</text>
        <path d="M156 46 l22 8 v14 c0 14 -10 22 -22 26 c-12 -4 -22 -12 -22 -26 v-14 z" className="fill-card stroke-sky" />
        <text x="156" y="70" className="fill-sky" style={svgLabel}>MCP</text>
        <ellipse cx="268" cy="52" rx="26" ry="8" className="fill-card stroke-edge-strong" />
        <path d="M242 52 v34 c0 4.5 11.6 8 26 8 s26 -3.5 26 -8 v-34" className="fill-card stroke-edge-strong" />
        <text x="268" y="74" className="fill-light-slate" style={svgLabel}>legacy</text>
        <circle className="cp fill-sky" cx="70" cy="70" r="3" />
      </svg>
      <div className="res absolute right-[14px] top-3 text-sky">1 row · allowed: sales</div>
      {/* Wraps between clauses rather than clipping where the mono face runs wide. */}
      <div className="absolute left-[14px] right-[14px] bottom-3 text-light-slate leading-[1.5]">
        <span className="q1 inline-block"><span className="text-sky">SELECT</span> name, credit_lmt&nbsp;</span>
        <span className="q2 inline-block"><span className="text-sky">FROM</span> CUST_MSTR&nbsp;</span>
        <span className="q3 inline-block"><span className="text-sky">WHERE</span> id=1042</span>
      </div>
    </VizFrame>
  );
}
