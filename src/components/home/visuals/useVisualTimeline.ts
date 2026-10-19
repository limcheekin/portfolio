import { useRef, type RefObject } from 'react';
import { gsap, useGSAP } from '../../../lib/gsap';
import { useMatchMedia } from '../../../lib/use-match-media';
import { MQ } from '../../../lib/motion';

const LOOP_GAP = 2; // seconds between the end of a play and the restart

/**
 * One paused, looping illustration timeline per Work card (`repeat: -1`, 2s `repeatDelay`).
 *
 * - Reduced motion: a non-repeating copy always rests on its finished frame (`progress(1)`).
 * - `active` true: restart from 0 and loop.
 * - `active` false: `pause().progress(1)`, so the card shows its finished frame (the end of the
 *   current iteration).
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
      const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: LOOP_GAP });
      buildRef.current(tl);

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
