import type { ReactNode, Ref } from 'react';

const DOTS = {
  background: 'radial-gradient(circle at 1px 1px, #1b1b1f 1px, transparent 0) 0 0/14px 14px, #09090b',
} as const;

/** Shared 170px dotted panel every card illustration sits in. Decorative, so hidden from AT. */
export default function VizFrame({ frameRef, children }: { frameRef: Ref<HTMLDivElement>; children: ReactNode }) {
  return (
    <div
      ref={frameRef}
      aria-hidden="true"
      className="relative h-[170px] rounded-[10px] overflow-hidden border border-[#1d1d21] font-mono text-[10.5px]"
      style={DOTS}
    >
      {children}
    </div>
  );
}
