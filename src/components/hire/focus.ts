import { E_BOUNDARIES, E_GUARDRAILS, FLOW, H_ITEMS, I_ITEMS } from '../../lib/hire/checklist';
import { isNA } from '../../lib/hire/score';
import type { HireAnswers } from '../../lib/hire/types';

/**
 * Focus mode's screens: one scored question per screen, the free-text parts of a step grouped on their gate's
 * screen. Every screen belongs to one Guided step (`step`, a FLOW id), so switching modes maps both ways.
 */
export interface FocusScreen {
  id: string;
  step: string;
  /** Answered enough for Enter to continue (a blank N/A reason, or a Yes job gate without a KPI, is not). */
  done: (a: HireAnswers) => boolean;
}

const always = () => true;
const scored = (v: unknown) => typeof v === 'number' || (isNA(v) && v.na.trim() !== '');
const item = (section: 'h' | 'i' | 'e', key: string): FocusScreen => ({
  id: `${section}.${key}`,
  step: section === 'h' ? 'human' : section === 'i' ? 'impact' : 'exposure',
  done: (a) => scored((a[section] as Record<string, unknown>)[key]),
});

const BY_STEP: Record<string, FocusScreen[]> = {
  start: [{ id: 'start', step: 'start', done: always }],
  job: [
    { id: 'job.intent', step: 'job', done: (a) => a.part1.canStateBusinessProblem !== null },
    {
      id: 'job.role',
      step: 'job',
      done: (a) =>
        a.part1.canDefineJobAndKpis === false ||
        (a.part1.canDefineJobAndKpis === true && (a.part1.kpis ?? []).some((k) => k.name.trim() !== '')),
    },
  ],
  tool: [
    { id: 'tool.ruleBased', step: 'tool', done: (a) => a.r.ruleBased !== null },
    { id: 'tool.informational', step: 'tool', done: (a) => a.r.informational !== null },
    { id: 'tool.traits', step: 'tool', done: always },
    { id: 'tool.table', step: 'tool', done: always },
  ],
  worst: [{ id: 'worst', step: 'worst', done: (a) => a.e.worstCase !== null }],
  metrics: [{ id: 'metrics', step: 'metrics', done: always }],
  human: H_ITEMS.map((x) => item('h', x.key)),
  // Frequency, time savings (with its figures), ROI (with its figures), strategic value: the checklist's order.
  impact: I_ITEMS.map((x) => item('i', x.key)),
  // The worst case was asked in Part 1; Focus doesn't ask it twice. Guided's E step shows it again, prefilled.
  exposure: [...E_GUARDRAILS, ...E_BOUNDARIES].map((x) => item('e', x.key)),
  result: [{ id: 'result', step: 'result', done: always }],
};

/** The screens in flow order, with the live-metrics screen only for a live agent. */
export function focusScreens(a: HireAnswers): FocusScreen[] {
  return FLOW.filter((s) => !s.liveOnly || a.isLive).flatMap((s) => BY_STEP[s.id] ?? []);
}

/**
 * The screen to show: the remembered one when it still exists and belongs to the current step, else the step's
 * first screen (a Guided step change, a jump, or a link that opened on another step), else the first screen.
 */
export function currentScreen(screens: FocusScreen[], screenId: string, stepId: string): number {
  const at = screens.findIndex((s) => s.id === screenId && s.step === stepId);
  if (at >= 0) return at;
  const first = screens.findIndex((s) => s.step === stepId);
  return first >= 0 ? first : 0;
}

/** A Part 1 stop belongs on the screen where its answer is given. */
export const STOP_SCREEN = {
  problem: 'job.intent',
  job: 'job.role',
  ruleBased: 'tool.ruleBased',
  informational: 'tool.informational',
  catastrophic: 'worst',
} as const;

interface ElementLike {
  tagName: string;
  isContentEditable?: boolean;
  getAttribute(name: string): string | null;
}

// Inputs that take no typing: their own keys are Space and the arrows, so digits and Enter stay free.
const NO_TYPING = new Set(['radio', 'checkbox', 'button', 'submit', 'reset']);

/** A field the user types into: a text, number or date input, a textarea, a select or editable content. */
export function isTypingField(el: ElementLike | null | undefined): boolean {
  if (!el) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return !NO_TYPING.has((el.getAttribute('type') ?? 'text').toLowerCase());
  return el.isContentEditable === true;
}

/** Elements whose Enter already does something (activates them), so Focus mode leaves Enter to them. */
function activatesOnEnter(el: ElementLike | null | undefined): boolean {
  if (!el) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return true;
  if (tag === 'INPUT') return ['button', 'submit', 'reset'].includes((el.getAttribute('type') ?? '').toLowerCase());
  return el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link';
}

export type FocusKey = { kind: 'pick'; n: number } | { kind: 'next' } | { kind: 'back' };

/**
 * What a keydown means in Focus mode, or null to leave it alone: digits 1–9 pick that option, Enter continues,
 * Backspace goes back. Nothing while a typing field has focus, with a modifier held, during IME composition,
 * or on a key repeat of Enter or Backspace (holding a key must not run through screens).
 */
export function focusKey(
  e: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean; repeat: boolean; isComposing?: boolean; defaultPrevented?: boolean },
  active: ElementLike | null | undefined,
): FocusKey | null {
  if (e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return null;
  if (isTypingField(active)) return null;
  if (/^[1-9]$/.test(e.key)) return { kind: 'pick', n: Number(e.key) - 1 };
  if (e.repeat) return null;
  if (e.key === 'Enter') return activatesOnEnter(active) ? null : { kind: 'next' };
  if (e.key === 'Backspace') return { kind: 'back' };
  return null;
}
