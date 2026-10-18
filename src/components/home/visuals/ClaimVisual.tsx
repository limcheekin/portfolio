import type { VisualProps } from '../types';
import { reveal } from './helpers';
import VizFrame from './VizFrame';

const STEP = 0.75;
const FIELDS: [string, string][] = [['merchant', 'Kopi Corner'], ['category', 'Meals'], ['total', 'RM 186.40']];

export default function ClaimVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    tl.fromTo('.scan', { y: 0, opacity: 1 }, { y: 134, duration: 0.9, ease: 'power1.inOut' }, 0);
    tl.to('.scan', { opacity: 0, duration: 0.2 }, 0.9);
    FIELDS.forEach((_, i) => reveal(tl, `.f${i}`, 0.9 + i * STEP));
    tl.from('.stamp', { opacity: 0, scale: 1.7, duration: 0.35, ease: 'back.out(2)' }, 0.9 + 3 * STEP);
  };
  return (
    <VizFrame active={active} build={build}>
      <div className="absolute left-[18px] top-4 w-[94px] h-[136px] bg-graphite border border-[#2e2e33] rounded-[4px] px-[10px] py-3 overflow-hidden">
        {[false, true, false, false, true].map((s, i) => (
          <i key={i} className="block h-[5px] bg-[#2e2e33] rounded-[3px] mb-2" style={s ? { width: '55%' } : undefined} />
        ))}
        <b className="absolute bottom-[11px] left-[10px] text-lightest-slate font-semibold">RM 186.40</b>
        <div className="scan absolute inset-x-0 top-0 h-[2px] bg-green-accent opacity-0 shadow-[0_0_12px_#00d992]" />
      </div>
      <ul className="absolute left-[126px] top-[18px] m-0 p-0 list-none w-[168px]">
        {FIELDS.map(([k, v], i) => (
          <li key={k} className={`f${i} flex justify-between bg-[#0f0f12] border border-[#232327] rounded-[5px] px-2 py-[6px] mb-[6px] text-slate-text`}>
            {k} <span className="text-lightest-slate">{v}</span>
          </li>
        ))}
      </ul>
      <div className="stamp absolute right-5 bottom-[14px] border-2 border-green-accent text-green-accent font-bold tracking-[0.1em] px-2 py-[3px] rounded-[4px]" style={{ transform: 'rotate(-8deg)' }}>
        APPROVED
      </div>
    </VizFrame>
  );
}
