import type { VisualProps } from '../types';
import { reveal } from './helpers';
import VizFrame from './VizFrame';

const STEP = 0.85;
const user = 'self-end bg-[#1d1d22] text-lightest-slate rounded-[9px_9px_2px_9px]';
const bot = 'self-start bg-[#0f2a20] border border-[#1d4d3a] text-[#c9f5e4] rounded-[9px_9px_9px_2px]';
const msg = 'max-w-[78%] px-[9px] py-[5px] leading-[1.45]';

export default function WareVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    [1, 2, 3, 4].forEach((n, i) => reveal(tl, `.m${n}`, i * STEP));
    tl.from('.pressed', { opacity: 0, duration: 0.25 }, 4 * STEP);
    tl.from('.ok', { opacity: 0, duration: 0.3 }, 4 * STEP);
  };
  return (
    <VizFrame active={active} build={build}>
      <div className="flex flex-col gap-[6px] p-3">
        <div className={`m1 ${msg} ${user}`}>A4 boxes left in WH2?</div>
        <div className={`m2 ${msg} ${bot}`}>142 boxes across 3 bins.</div>
        <div className={`m3 ${msg} ${user}`}>Move 40 to WH1</div>
        <div className={`m4 ${msg} ${bot}`}>
          This writes to WMS.
          <span className="relative inline-block ml-[6px] px-[7px] py-px border border-green-accent rounded-[4px] text-green-accent">
            Confirm
            <span className="pressed absolute inset-0 rounded-[4px] bg-green-accent text-navy px-[7px] py-px">Confirm</span>
          </span>{' '}
          <span className="ok text-green-accent">✓ TR-778</span>
        </div>
      </div>
    </VizFrame>
  );
}
