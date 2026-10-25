import type { Verdict } from '../../lib/hire/types';
import { BUTTON_BASE, BUTTON_SIZES } from '../../lib/button-styles';

/** Shared classes for the HIRE check island (inputs follow ContactForm's field style). */
export const FIELD =
  'w-full min-w-0 rounded border border-edge bg-card px-3 py-2.5 text-sm text-lightest-slate placeholder-slate-text transition-colors duration-250 focus:border-green-accent focus:outline-none aria-[invalid=true]:border-danger';
export const LABEL = 'mb-1.5 block font-mono text-xs text-light-slate';
export const HINT = 'text-sm leading-relaxed text-slate-text';
export const ERROR = 'mt-1.5 font-mono text-xs text-danger';
export const PANEL = 'rounded-xl border border-edge bg-card p-5 sm:p-6';
/** A recessed surface inside a panel: options, suggestions, notes. */
export const WELL = 'rounded-lg border border-edge bg-well';
export const NOTE = `${WELL} px-4 py-3 text-sm leading-relaxed text-light-slate`;
/** One answer option (radio or checkbox) as a whole clickable row, and its input. */
export const OPTION =
  `flex min-h-11 cursor-pointer items-start gap-3 ${WELL} px-3 py-2.5 text-sm text-light-slate transition-colors duration-250 hover:border-edge-strong has-[:checked]:border-green-accent has-[:checked]:bg-green-tint has-[:checked]:text-lightest-slate`;
export const OPTION_INPUT = 'mt-0.5 size-4 shrink-0 accent-green-accent';
export const STEP_TITLE = 'text-2xl font-semibold tracking-[-0.02em] text-lightest-slate';

export const BTN_PRIMARY = `${BUTTON_BASE} ${BUTTON_SIZES.sm} min-h-11 border-green-accent bg-green-accent font-semibold text-navy hover:bg-green-accent/85`;
export const BTN_SECONDARY = `${BUTTON_BASE} ${BUTTON_SIZES.sm} min-h-11 border-edge-strong bg-transparent text-lightest-slate hover:border-green-accent hover:text-green-accent`;
/** A small inline text button with a 44px tap area. */
export const BTN_TEXT =
  'inline-flex min-h-11 items-center font-mono text-xs text-green-accent underline decoration-green-accent/40 underline-offset-4 transition-colors duration-250 hover:decoration-green-accent';

/** A one-click fill (KPI suggestions): a chip-sized button with a 44px tap height. */
export const CHIP_BUTTON =
  'inline-flex min-h-11 items-center rounded-[5px] border border-edge px-3 font-mono text-xs text-light-slate transition-colors duration-250 hover:border-green-accent hover:text-green-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge disabled:hover:text-light-slate';

interface VerdictStyle { text: string; border: string; tint: string; gauge: string }
const STOPPED: VerdictStyle = { text: 'text-danger', border: 'border-danger/50', tint: 'bg-danger/10', gauge: 'stroke-danger fill-danger' };
const VERDICT_STYLE: Record<Verdict, VerdictStyle> = {
  HIRE: { text: 'text-green-accent', border: 'border-green-accent/50', tint: 'bg-green-tint', gauge: 'stroke-green-accent fill-green-accent' },
  TRAIN: { text: 'text-amber', border: 'border-amber/50', tint: 'bg-amber/10', gauge: 'stroke-amber fill-amber' },
  'DO NOT BUILD': STOPPED,
  FIRE: STOPPED,
};
const PENDING: VerdictStyle = { text: 'text-slate-text', border: 'border-edge', tint: '', gauge: 'stroke-lightest-slate fill-lightest-slate' };

/** Verdict colours: green HIRE, amber TRAIN, coral DO NOT BUILD / FIRE, slate while pending (ink, border, pill tint, gauge needle). */
export const verdictStyle = (v: Verdict | null): VerdictStyle => (v ? VERDICT_STYLE[v] : PENDING);

/** Signed points as the checklist prints them, with a true minus sign. */
export const points = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

/** A total with a true minus sign; positive totals print bare. */
export const signed = (n: number) => (n < 0 ? points(n) : String(n));
