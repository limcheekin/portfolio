/** Shared button classes for Button.astro and React islands that render button-styled links. */
export const BUTTON_BASE =
  'font-mono inline-flex items-center justify-center rounded border transition-[color,background-color,border-color,opacity] duration-250 ease-custom-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy';

export const BUTTON_SIZES = {
  sm: 'px-5 py-2.5 text-xs',
  md: 'px-7 py-3.5 text-sm',
  lg: 'px-8 py-4 text-base',
} as const;
