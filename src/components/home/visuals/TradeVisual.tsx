import type { VisualProps } from '../types';
import { reveal } from './helpers';
import VizFrame from './VizFrame';

const STEP = 0.7;
const ROWS: [string, string][] = [['A4 80g', '×40'], ['Toner', '×6'], ['Folder', '×120']];
const rowCls = 'flex justify-between px-2 py-[5px] border-b border-[#1a1a1e]';
const bodyCls = 'text-light-slate';
const headCls = 'text-slate-text bg-[#0f0f12]';

export default function TradeVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    reveal(tl, '.bubble, .arrow', 0);
    ROWS.forEach((_, i) => reveal(tl, `.r${i}`, (i + 1) * STEP));
    reveal(tl, '.so', 4 * STEP);
  };
  return (
    <VizFrame active={active} build={build}>
      <div className="bubble absolute left-[14px] top-[22px] w-[122px] bg-[#0f2a20] border border-[#1d4d3a] rounded-[10px_10px_10px_2px] p-2 text-[#c9f5e4] leading-[1.5]">
        <span className="block bg-[#0a1f17] rounded-[5px] px-[6px] py-1 mb-[5px] text-lightest-slate">▤ po_0412.pdf</span>PO attached, pls quote
      </div>
      <div className="arrow absolute left-[142px] top-[52px] text-slate-text text-sm">→</div>
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
