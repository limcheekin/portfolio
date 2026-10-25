import type { Verdict } from '../../lib/hire/types';
import { BUTTON_BASE, BUTTON_SIZES } from '../../lib/button-styles';

/** Shared classes for the HIRE check island (inputs follow ContactForm's field style). */
export const FIELD =
  'w-full min-w-0 rounded border border-edge bg-card px-3 py-2.5 text-sm text-lightest-slate placeholder-slate-text transition-colors duration-250 focus:border-green-accent focus:outline-none aria-[invalid=true]:border-danger';
export const LABEL = 'mb-1.5 block font-mono text-xs text-light-slate';
export const HINT = 'text-sm leading-relaxed text-slate-text';
export const ERROR = 'mt-1.5 font-mono text-xs text-danger';
export const PANEL = 'rounded-xl border border-edge bg-card p-5 sm:p-6';
export const STEP_TITLE = 'text-2xl font-semibold tracking-[-0.02em] text-lightest-slate';

export const BTN_PRIMARY = `${BUTTON_BASE} ${BUTTON_SIZES.sm} min-h-11 border-green-accent bg-green-accent font-semibold text-navy hover:bg-green-accent/85`;
export const BTN_SECONDARY = `${BUTTON_BASE} ${BUTTON_SIZES.sm} min-h-11 border-edge-strong bg-transparent text-lightest-slate hover:border-green-accent hover:text-green-accent`;
/** A small inline text button with a 44px tap area. */
export const BTN_TEXT =
  'inline-flex min-h-11 items-center font-mono text-xs text-green-accent underline decoration-green-accent/40 underline-offset-4 transition-colors duration-250 hover:decoration-green-accent';

/** A one-click fill (KPI suggestions): a chip-sized button with a 44px tap height. */
export const CHIP_BUTTON =
  'inline-flex min-h-11 items-center rounded-[5px] border border-edge px-3 font-mono text-xs text-light-slate transition-colors duration-250 hover:border-green-accent hover:text-green-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-light-slate';

/** Verdict ink: green HIRE, amber TRAIN, coral DO NOT BUILD / FIRE, slate while pending. */
export function verdictText(v: Verdict | null): string {
  if (v === 'HIRE') return 'text-green-accent';
  if (v === 'TRAIN') return 'text-amber';
  if (v === 'DO NOT BUILD' || v === 'FIRE') return 'text-danger';
  return 'text-slate-text';
}
export function verdictBorder(v: Verdict | null): string {
  if (v === 'HIRE') return 'border-green-accent/50';
  if (v === 'TRAIN') return 'border-amber/50';
  if (v === 'DO NOT BUILD' || v === 'FIRE') return 'border-danger/50';
  return 'border-edge';
}

/** Signed points as the checklist prints them, with a true minus sign. */
export const points = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
