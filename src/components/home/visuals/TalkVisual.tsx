import type { VisualProps } from '../types';
import VizFrame from './VizFrame';

const BARS = Array.from({ length: 30 }, (_, i) => +(0.3 + Math.abs(Math.sin(i * 1.7)) * 0.7).toFixed(2));
const PILLS = ['STT', 'LLM', 'TTS'];

export default function TalkVisual({ active }: VisualProps) {
  const build = (tl: gsap.core.Timeline) => {
    // 5 legs (.15 -> h -> .15 -> h -> .15 -> h) so the bars finish at their resting height.
    tl.fromTo('.bar', { scaleY: 0.15 }, { scaleY: (i: number) => BARS[i], duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: 4, stagger: 0.045 }, 0);
    // Pill highlight overlays: each lights for ~0.8s of a 2.4s cycle, two cycles, ending unlit.
    PILLS.forEach((_, i) => {
      tl.to(
        `.lit${i}`,
        { keyframes: [{ opacity: 1, duration: 0.1 }, { opacity: 1, duration: 0.7 }, { opacity: 0, duration: 0.2 }], repeat: 1, repeatDelay: 1.4 },
        i * 0.8,
      );
    });
  };
  return (
    <VizFrame active={active} build={build}>
      <div className="absolute left-4 right-4 top-[30px] h-[70px] flex items-center gap-1">
        {BARS.map((h, i) => (
          <i key={i} className="bar flex-1 h-full rounded-[3px] bg-gradient-to-b from-sky to-sky/25" style={{ transform: `scaleY(${h})` }} />
        ))}
      </div>
      <div className="absolute left-4 bottom-4 flex gap-[6px] items-center text-slate-text">
        {PILLS.flatMap((p, i) => [
          i > 0 && <span key={`a${i}`}>→</span>,
          <span key={p} className="relative border border-sky-dim rounded-[5px] px-2 py-1 text-light-slate">
            {p}
            <span className={`lit${i} absolute -inset-px rounded-[5px] border border-sky text-sky px-2 py-1 opacity-0`}>{p}</span>
          </span>,
        ])}
      </div>
      <div className="absolute right-4 bottom-[14px] text-sky text-base font-semibold">
        &lt;300 <small className="text-[10px] text-slate-text font-normal">ms</small>
      </div>
    </VizFrame>
  );
}
