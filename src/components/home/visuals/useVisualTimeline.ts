import { useRef, type RefObject } from 'react';
import { gsap, useGSAP } from '../../../lib/gsap';
import { useMatchMedia } from '../../../lib/use-match-media';
import { MQ } from '../../../lib/motion';

// One play may last at most this long (WCAG 2.2.2: motion over 5s that runs beside content needs a pause).
const MAX_PLAY = 5;

/**
 * One paused illustration timeline per Work card. It plays once, never loops.
 *
 * - Reduced motion: rests on its finished frame (`progress(1)`).
 * - `active` true: plays once from 0 and rests on the finished frame.
 * - `active` false: `pause().progress(1)`, so the card shows its finished frame.
 *
 * `build` receives the empty timeline and adds the tweens; its final state is the "finished frame".
 */
export function useVisualTimeline(
  scope: RefObject<HTMLElement | null>,
  active: boolean,
  build: (tl: gsap.core.Timeline) => void,
): void {
  const activeRef = useRef(active);
  const buildRef = useRef(build);
  buildRef.current = build;
  // Set by the motion branch below; null under reduced motion (or before mount).
  const applyRef = useRef<((on: boolean) => void) | null>(null);

  useMatchMedia(scope, (mm) => {
    mm.add(MQ.motion, () => {
      const tl = gsap.timeline({ paused: true });
      buildRef.current(tl);
      if (import.meta.env.DEV && tl.duration() > MAX_PLAY) {
        console.warn(`Work illustration plays for ${tl.duration().toFixed(1)}s; keep it at ${MAX_PLAY}s or less.`);
      }

      const apply = (on: boolean) => {
        if (on) tl.restart();
        else tl.pause().progress(1);
      };
      applyRef.current = apply;
      apply(activeRef.current);

      return () => {
        applyRef.current = null;
      };
    });

    mm.add(MQ.reduce, () => {
      const tl = gsap.timeline({ paused: true });
      buildRef.current(tl);
      tl.progress(1);
    });
  });

  useGSAP(
    () => {
      activeRef.current = active;
      applyRef.current?.(active);
    },
    { scope, dependencies: [active] },
  );
}
