import { useRef, type RefObject } from 'react';
import { gsap } from '../../lib/gsap';
import { MQ } from '../../lib/motion';
import { useMatchMedia } from '../../lib/use-match-media';

/**
 * Brings a new step (Guided) or screen (Focus) in: opacity and an 8 px rise, in the motion branch only. Under
 * reduced motion the content just appears. An element's first render doesn't animate (the page loading, or a
 * mode switch mounting the other mode), and the inline styles are cleared at the end so nothing is left on it.
 */
export function useStepTransition<T extends HTMLElement>(ref: RefObject<T | null>, key: string): void {
  const seen = useRef<T | null>(null);
  useMatchMedia(
    ref,
    (mm, el) => {
      if (seen.current !== el) {
        seen.current = el;
        return;
      }
      mm.add(MQ.motion, () => {
        gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'opacity,transform' });
      });
    },
    { dependencies: [key], revertOnUpdate: true },
  );
}
