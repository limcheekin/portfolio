import { useRef } from 'react';
import type { VisualProps } from '../types';
import { useVisualTimeline } from './useVisualTimeline';
import { addPulse } from './pulse';
import VizFrame from './VizFrame';

const DUR = 2.4;
const CYCLES = 3;
const ROWS = [38, 85, 132];
const IN = ['Telegram', 'WhatsApp', 'Voice'];
const OUT = ['🔒 ERP', '🔒 GL', '🔒 M365'];
// Pulse starts: inbound a0..a2 at 0/.8/1.6, outbound b0..b2 at .4/1.2/2.0 (as in the mockup).
const DELAYS = { a: [0, 0.8, 1.6], b: [0.4, 1.2, 2.0] };
const lbl = { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 10, textAnchor: 'middle', dominantBaseline: 'middle' } as const;

export default function AgentVisual({ active }: VisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  useVisualTimeline(ref, active, (tl) => {
    ROWS.forEach((y, i) => {
      addPulse(tl, `.pa${i}`, 108, 85 - y, DELAYS.a[i], DUR, CYCLES);
      addPulse(tl, `.pb${i}`, 108, y - 85, DELAYS.b[i], DUR, CYCLES);
    });
  });
  return (
    <VizFrame frameRef={ref}>
      <svg viewBox="0 0 312 170" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {ROWS.map((y) => (
          <g key={y} fill="none" stroke="#26262b" strokeWidth="1">
            <path d={`M48 ${y} L156 85`} />
            <path d={`M156 85 L264 ${y}`} />
          </g>
        ))}
        {ROWS.map((y, i) => (
          <g key={`n${y}`}>
            <rect x="18" y={y - 12} width="60" height="24" rx="6" fill="#0f0f12" stroke="#2c2c31" />
            <text x="48" y={y} fill="#b8b3b0" style={lbl}>{IN[i]}</text>
            <rect x="234" y={y - 12} width="60" height="24" rx="6" fill="#0f0f12" stroke="#2c2c31" />
            <text x="264" y={y} fill="#b8b3b0" style={lbl}>{OUT[i]}</text>
          </g>
        ))}
        <circle cx="156" cy="85" r="28" fill="#0f0f12" stroke="#00d992" />
        <text x="156" y="85" fill="#00d992" style={lbl}>agent</text>
        <text x="210" y="160" fill="#8b949e" style={lbl}>MCP · role-restricted</text>
        {ROWS.map((y, i) => (
          <circle key={`pa${y}`} className={`pa${i}`} cx="48" cy={y} r="3" fill="#00d992" />
        ))}
        {ROWS.map((y, i) => (
          <circle key={`pb${y}`} className={`pb${i}`} cx="156" cy="85" r="3" fill="#00d992" />
        ))}
      </svg>
    </VizFrame>
  );
}
