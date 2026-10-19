import type { RefObject } from 'react';
import { gsap, useGSAP } from './gsap';

type ContextSafe = <F extends Function>(fn: F) => F;

/**
 * The animating-island pattern: `useGSAP` scoped to `scope`, with one `gsap.matchMedia` on its element that
 * is reverted on cleanup (and before each re-run when `revertOnUpdate`). `setup` adds the media-query
 * branches (`MQ`); it runs only once the element has mounted.
 */
export function useMatchMedia<T extends Element>(
  scope: RefObject<T | null>,
  setup: (mm: gsap.MatchMedia, el: T, contextSafe: ContextSafe) => void,
  config: { dependencies?: unknown[]; revertOnUpdate?: boolean } = {},
): void {
  useGSAP(
    (_ctx, contextSafe) => {
      const el = scope.current;
      if (!el || !contextSafe) return;
      const mm = gsap.matchMedia(el);
      setup(mm, el, contextSafe);
      return () => mm.revert();
    },
    { ...config, scope },
  );
}
