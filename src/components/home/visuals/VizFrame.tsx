import type { ReactNode, Ref } from 'react';

/**
 * Plain positioning root for a card illustration. WorkTrack's `[data-visual]` wrapper owns the
 * chrome (170px height, border, dotted background, mono font, dimming).
 */
export default function VizFrame({ frameRef, children }: { frameRef: Ref<HTMLDivElement>; children: ReactNode }) {
  return (
    <div ref={frameRef} aria-hidden="true" className="relative h-full w-full overflow-hidden">
      {children}
    </div>
  );
}
