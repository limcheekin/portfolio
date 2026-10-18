import { useRef, type RefObject } from 'react';
import { gsap, useGSAP } from '../../../lib/gsap';
import { MQ } from '../../../lib/motion';

const LOOP_GAP = 2; // seconds between the end of a play and the restart

/**
 * One paused, non-repeating illustration timeline per Work card.
 *
 * - Reduced motion: the timeline always rests on its finished frame (`progress(1)`).
 * - `active` true: restart from 0 and loop (on complete, a 2s `delayedCall` restarts it; one
 *   paused delayedCall per matchMedia branch is reused).
 * - `active` false: cancel the pending restart and `pause().progress(1)`, so the card shows its
 *   finished frame.
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

  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;
      const mm = gsap.matchMedia(el);

      mm.add(MQ.motion, () => {
        const tl = gsap.timeline({ paused: true });
        buildRef.current(tl);

        // One paused delayedCall per branch, restarted after each play (no per-loop allocation).
        const again = gsap.delayedCall(LOOP_GAP, () => tl.restart()).pause();
        tl.eventCallback('onComplete', () => {
          if (activeRef.current) again.restart(true); // true: honour the 2s delay
        });

        const apply = (on: boolean) => {
          again.pause();
          if (on) tl.restart();
          else tl.pause().progress(1, true); // suppress onComplete so no restart is scheduled
        };
        applyRef.current = apply;
        apply(activeRef.current);

        return () => {
          again.kill();
          applyRef.current = null;
        };
      });

      mm.add(MQ.reduce, () => {
        const tl = gsap.timeline({ paused: true });
        buildRef.current(tl);
        tl.progress(1, true);
      });

      return () => mm.revert();
    },
    { scope },
  );

  useGSAP(
    () => {
      activeRef.current = active;
      applyRef.current?.(active);
    },
    { dependencies: [active] },
  );
}
