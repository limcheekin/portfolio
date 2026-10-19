import { gsap, ScrollTrigger } from './gsap';
import type { ContextSafe } from './use-match-media';

interface RevealOptions {
  y: number;
  scale?: number;
  start: string;
  stagger: number;
  duration: number;
  ease: string;
  /** Runs as each batch starts to reveal. */
  onEnter?: (batch: Element[]) => void;
}

/**
 * The scroll reveal shared by RevealGroup and CareerTimeline: hides `els` with `gsap.set` (never CSS), then
 * fades and lifts each scroll batch into place, once. Call it inside a motion-only matchMedia branch; the
 * batch tween is created through `contextSafe`.
 */
export function batchReveal(els: HTMLElement[], options: RevealOptions, contextSafe: ContextSafe): void {
  const { y, scale, start, stagger, duration, ease, onEnter } = options;
  const scaled = scale !== undefined;
  gsap.set(els, { opacity: 0, y, ...(scaled ? { scale } : {}) });
  ScrollTrigger.batch(els, {
    start,
    once: true,
    onEnter: contextSafe((batch: Element[]) => {
      onEnter?.(batch);
      gsap.to(batch, { opacity: 1, y: 0, ...(scaled ? { scale: 1 } : {}), stagger, duration, ease, overwrite: true });
    }),
  });
}
