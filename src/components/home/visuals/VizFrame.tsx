import { useEffect, useRef, type ReactNode } from 'react';
import { useVisualTimeline } from './useVisualTimeline';

/** Every illustration is drawn on this canvas: the frame's inner size on a full-width (360px) card. */
const CANVAS_WIDTH = 312;

/**
 * Positioning root for a card illustration. It owns the illustration's timeline: `build` adds the
 * tweens (scoped to the canvas) and `useVisualTimeline` plays it once each time `active` turns on.
 * The canvas is scaled down to fit narrower frames (phones), so nothing is clipped. WorkTrack's
 * `[data-visual]` wrapper owns the chrome (312:170 frame, border, dotted background, mono font, dimming).
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
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  useVisualTimeline(canvas, active, build);

  // Fit the canvas to the frame width; the frame keeps the canvas aspect ratio, so height follows.
  useEffect(() => {
    const frameEl = frame.current;
    const canvasEl = canvas.current;
    if (!frameEl || !canvasEl) return;
    const ro = new ResizeObserver(([entry]) => {
      canvasEl.style.scale = String(Math.min(1, entry.contentRect.width / CANVAS_WIDTH));
    });
    ro.observe(frameEl);
    return () => ro.disconnect();
  }, []);

  // A picture: its labels are part of the drawing (WCAG 1.4.3 "incidental" text, dimmed on inactive cards), so it
  // is hidden from assistive tech and inert, which also tells contrast checkers it is not text to read. Pointer
  // events pass through to the card link underneath.
  return (
    <div ref={frame} aria-hidden="true" inert className="relative h-full w-full overflow-hidden">
      <div ref={canvas} className="absolute left-0 top-0 h-[170px] w-[312px] origin-top-left">
        {children}
      </div>
    </div>
  );
}
