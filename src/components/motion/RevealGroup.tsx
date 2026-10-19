import { useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMatchMedia } from '../../lib/use-match-media';
import { MQ } from '../../lib/motion';

export default function RevealGroup({
  selector,
  stagger,
  children,
}: {
  selector: string;
  stagger?: number;
  children?: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useMatchMedia(root, (mm, el) => {
    // Reduced motion: nothing is set; content stays on its finished frame.
    mm.add(MQ.motion, () => {
      const els = gsap.utils.toArray<HTMLElement>(selector, el);
      if (!els.length) return;
      gsap.set(els, { opacity: 0, y: 12 });
      ScrollTrigger.batch(els, {
        start: 'top 90%',
        once: true,
        onEnter: (b) =>
          gsap.to(b, { opacity: 1, y: 0, stagger: stagger ?? 0.09, overwrite: true }),
      });
    });
  });

  return <div ref={root}>{children}</div>;
}
