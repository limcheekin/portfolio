export const MQ = {
  reduce: '(prefers-reduced-motion: reduce)',
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 768px)',
  mobile: '(max-width: 767px)',
  tall: '(min-height: 560px)',
  finePointer: '(pointer: fine)',
} as const;
