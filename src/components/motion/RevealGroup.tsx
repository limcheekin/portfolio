import { useRef, type ReactNode } from 'react';
import { gsap } from '../../lib/gsap';
import { useMatchMedia } from '../../lib/use-match-media';
import { batchReveal } from '../../lib/reveal';
import { MQ } from '../../lib/motion';

/** Fades and lifts the children matching `selector` into place as they scroll in. */
export default function RevealGroup({ selector, children }: { selector: string; children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useMatchMedia(root, (mm, el, contextSafe) => {
    // Reduced motion: nothing is set; content stays on its finished frame.
    mm.add(MQ.motion, () => {
      const els = gsap.utils.toArray<HTMLElement>(selector, el);
      if (!els.length) return;
      batchReveal(els, { y: 12, start: 'top 90%', stagger: 0.09, duration: 0.5, ease: 'power1.out' }, contextSafe);
    });
  });

  return <div ref={root}>{children}</div>;
}
