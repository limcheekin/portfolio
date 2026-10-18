import { useRef } from 'react';
import type { VisualProps } from '../types';
import { useVisualTimeline } from './useVisualTimeline';
import VizFrame from './VizFrame';

const STEP = 0.7;
const ROWS: [string, string][] = [['A4 80g', '×40'], ['Toner', '×6'], ['Folder', '×120']];
const rowCls = 'flex justify-between px-2 py-[5px] border-b border-[#1a1a1e]';
const bodyCls = 'text-[#b8b3b0]';
const headCls = 'text-[#8b949e] bg-[#0f0f12]';

export default function TradeVisual({ active }: VisualProps) {
  const ref = useRef<HTMLDivElement>(null);
  useVisualTimeline(ref, active, (tl) => {
    const step = (sel: string, n: number) => tl.from(sel, { opacity: 0, y: 5, duration: 0.35 }, n * STEP);
    step('.bubble, .arrow', 0);
    ROWS.forEach((_, i) => step(`.r${i}`, i + 1));
    step('.so', 4);
  });
  return (
    <VizFrame frameRef={ref}>
      <div className="bubble absolute left-[14px] top-[22px] w-[122px] bg-[#0f2a20] border border-[#1d4d3a] rounded-[10px_10px_10px_2px] p-2 text-[#c9f5e4] leading-[1.5]">
        <span className="block bg-[#0a1f17] rounded-[5px] px-[6px] py-1 mb-[5px] text-[#f2f2f2]">▤ po_0412.pdf</span>PO attached, pls quote
      </div>
      <div className="arrow absolute left-[142px] top-[52px] text-[#8b949e] text-sm">→</div>
      <div className="absolute left-[162px] top-[18px] w-[134px] border border-[#232327] rounded-[6px] overflow-hidden">
        <div className={`${rowCls} ${headCls}`}><span>item</span><span>qty</span></div>
        {ROWS.map(([a, b], i) => (
          <div key={a} className={`r${i} ${rowCls} ${bodyCls}`}><span>{a}</span><span>{b}</span></div>
        ))}
      </div>
      <div className="so absolute left-[162px] bottom-4 bg-[rgba(0,217,146,.12)] text-green-accent border border-[rgba(0,217,146,.35)] rounded-[6px] px-[9px] py-[5px]">SO-0412 created ✓</div>
    </VizFrame>
  );
}
