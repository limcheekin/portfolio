export const MQ = {
  reduce: '(prefers-reduced-motion: reduce)',
  motion: '(prefers-reduced-motion: no-preference)',
  // Work track pin breakpoint; Tailwind's `pin` / `nopin` screens in tailwind.config.mjs use the same query.
  pin: '(min-width: 768px) and (min-height: 560px)',
  finePointer: '(pointer: fine)',
} as const;
