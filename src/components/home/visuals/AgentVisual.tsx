import type { VisualProps } from '../types';
import { addPulse, svgLabel } from './helpers';
import VizFrame from './VizFrame';

const DUR = 2.4;
const CYCLES = 3;
const NODES = [
  { y: 38, in: 'Telegram', out: '🔒 ERP' },
  { y: 85, in: 'WhatsApp', out: '🔒 GL' },
  { y: 132, in: 'Voice', out: '🔒 M365' },
];
// Pulse starts (as in the mockup): inbound a0..a2 at 0/.8/1.6, outbound b0..b2 at .4/1.2/2.0.
const inAt = (i: number) => i * 0.8;
const outAt = (i: number) => 0.4 + i * 0.8;

export default function AgentVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    NODES.forEach(({ y }, i) => {
      addPulse(tl, `.pa${i}`, 108, 85 - y, inAt(i), DUR, CYCLES);
      addPulse(tl, `.pb${i}`, 108, y - 85, outAt(i), DUR, CYCLES);
    });
  };
  return (
    <VizFrame active={active} build={build}>
      <svg viewBox="0 0 312 170" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {NODES.map(({ y, in: from, out: to }) => (
          <g key={y}>
            <g fill="none" className="stroke-edge" strokeWidth="1">
              <path d={`M48 ${y} L156 85`} />
              <path d={`M156 85 L264 ${y}`} />
            </g>
            <rect x="18" y={y - 12} width="60" height="24" rx="6" className="fill-card stroke-edge-strong" />
            <text x="48" y={y} className="fill-light-slate" style={svgLabel}>{from}</text>
            <rect x="234" y={y - 12} width="60" height="24" rx="6" className="fill-card stroke-edge-strong" />
            <text x="264" y={y} className="fill-light-slate" style={svgLabel}>{to}</text>
          </g>
        ))}
        <circle cx="156" cy="85" r="28" className="fill-card stroke-green-accent" />
        <text x="156" y="85" className="fill-green-accent" style={svgLabel}>agent</text>
        <text x="210" y="160" className="fill-slate-text" style={svgLabel}>MCP · role-restricted</text>
        {NODES.map(({ y }, i) => (
          <g key={`p${y}`} className="fill-green-accent">
            <circle className={`pa${i}`} cx="48" cy={y} r="3" />
            <circle className={`pb${i}`} cx="156" cy="85" r="3" />
          </g>
        ))}
      </svg>
    </VizFrame>
  );
}
