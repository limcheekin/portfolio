import { useRef, type ReactNode } from 'react';
import { useVisualTimeline } from './useVisualTimeline';

/**
 * Positioning root for a card illustration. It owns the illustration's timeline: `build` adds the
 * tweens (scoped to this frame) and `useVisualTimeline` plays it only while `active`. WorkTrack's
 * `[data-visual]` wrapper owns the chrome (170px height, border, dotted background, mono font, dimming).
 */
export default function VizFrame({
  active,
  build,
  children,
}: {
  active: boolean;
  build: (tl: gsap.core.Timeline) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useVisualTimeline(ref, active, build);
  return (
    <div ref={ref} aria-hidden="true" className="relative h-full w-full overflow-hidden">
      {children}
    </div>
  );
}
