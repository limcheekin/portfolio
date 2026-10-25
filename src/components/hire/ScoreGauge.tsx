import { useRef } from 'react';
import { gsap } from '../../lib/gsap';
import { MQ } from '../../lib/motion';
import { useMatchMedia } from '../../lib/use-match-media';
import { THRESHOLDS } from '../../lib/hire/checklist';
import { SCORE_FLOOR } from '../../lib/hire/score';
import type { Verdict } from '../../lib/hire/types';
import { points } from './styles';

export const FLOOR = SCORE_FLOOR;
const CEIL = THRESHOLDS.ceiling;
const SPAN = CEIL - FLOOR;
const CX = 100;
const CY = 100;
const R = 82;
const ORIGIN = `${CX} ${CY}`;

const clamp = (v: number) => Math.min(CEIL, Math.max(FLOOR, v));
/** Needle rotation in degrees: −90 at the floor, 0 at the middle, +90 at the ceiling. */
export const needleAngle = (total: number) => ((clamp(total) - FLOOR) / SPAN) * 180 - 90;

function polar(v: number, r: number): [number, number] {
  const a = Math.PI * (1 - (clamp(v) - FLOOR) / SPAN);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
}
function arc(from: number, to: number): string {
  const [x1, y1] = polar(from, R);
  const [x2, y2] = polar(to, R);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
function tick(v: number) {
  const [x1, y1] = polar(v, R - 10);
  const [x2, y2] = polar(v, R + 10);
  return { x1, y1, x2, y2 };
}

const BANDS = [
  { from: FLOOR, to: THRESHOLDS.doNotBuildMax, cls: 'stroke-danger' },
  { from: THRESHOLDS.doNotBuildMax, to: THRESHOLDS.trainMax, cls: 'stroke-amber' },
  { from: THRESHOLDS.trainMax, to: CEIL, cls: 'stroke-green-accent' },
];

/**
 * The live score dial, −55 to 77 with band ticks at 30 and 50. The needle turns with a GSAP rotation tween
 * (with `from`, its first run sweeps from there: Focus mode's reveal); under reduced motion it is set directly. The SVG is an image with a text equivalent (`label`).
 */
export default function ScoreGauge({ total, verdict, label, className = '', from, duration = 0.6 }: {
  total: number;
  verdict: Verdict | null;
  label: string;
  className?: string;
  /** Where the needle starts on its first run (Focus mode's reveal sweeps from the floor); default: no sweep. */
  from?: number;
  /** Seconds for the needle's turn (the reveal takes longer than a live update, but stays under 1.5 s). */
  duration?: number;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const needle = useRef<SVGGElement>(null);
  const deg = needleAngle(total);
  // The angle on screen, so a re-run (which reverts the last tween) starts from where the needle is.
  const shown = useRef<number | null>(null);

  useMatchMedia(
    svg,
    (mm) => {
      const n = needle.current;
      if (!n) return;
      mm.add(MQ.motion, () => {
        gsap.fromTo(
          n,
          { rotation: shown.current ?? (from === undefined ? deg : needleAngle(from)), svgOrigin: ORIGIN },
          {
            rotation: deg,
            svgOrigin: ORIGIN,
            duration: shown.current === null ? duration : 0.6,
            ease: shown.current === null && from !== undefined ? 'power2.inOut' : 'power3.out',
            onUpdate: () => { shown.current = Number(gsap.getProperty(n, 'rotation')); },
          },
        );
      });
      mm.add(MQ.reduce, () => {
        gsap.set(n, { rotation: deg, svgOrigin: ORIGIN });
        shown.current = deg;
      });
    },
    { dependencies: [deg], revertOnUpdate: true },
  );

  const tone =
    verdict === 'HIRE' ? 'stroke-green-accent fill-green-accent'
      : verdict === 'TRAIN' ? 'stroke-amber fill-amber'
        : verdict ? 'stroke-danger fill-danger' : 'stroke-lightest-slate fill-lightest-slate';

  return (
    <svg ref={svg} viewBox="0 0 200 112" role="img" aria-label={label} className={className} data-testid="hire-gauge" data-total={total}>
      {BANDS.map((b) => (
        <path key={b.cls} d={arc(b.from, b.to)} className={`${b.cls} fill-none opacity-40`} strokeWidth={8} />
      ))}
      {[THRESHOLDS.doNotBuildMax, THRESHOLDS.trainMax].map((v) => {
        const t = tick(v);
        return <line key={v} {...t} className="stroke-light-slate" strokeWidth={1.5} />;
      })}
      <text x={CX - R} y={CY + 11} textAnchor="middle" className="fill-slate-text font-mono text-[9px]">{points(FLOOR)}</text>
      <text x={CX + R} y={CY + 11} textAnchor="middle" className="fill-slate-text font-mono text-[9px]">{CEIL}</text>
      <g ref={needle} className={tone}>
        <line x1={CX} y1={CY} x2={CX} y2={CY - R + 14} strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={5} />
      </g>
    </svg>
  );
}
