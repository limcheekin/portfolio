import type { HireAnswers, NA } from './types.ts';
import { E_BOUNDARIES, E_GUARDRAILS, H_ITEMS, I_ITEMS, RED_FLAGS, THRESHOLDS, WORST_CASE_OPTIONS, type ChecklistItem } from './checklist.ts';

export type StopGate = 'problem' | 'job' | 'ruleBased' | 'informational' | 'catastrophic';
export interface Stop { gate: StopGate; message: string }
export interface SectionScores {
  h: number; i: number; e: number; total: number;
  complete: { h: boolean; i: boolean; e: boolean };
}
export interface RedFlag { section: 'H' | 'I' | 'R' | 'E'; key: keyof typeof RED_FLAGS; text: string }

type EKey = keyof HireAnswers['e'];
type EValue = HireAnswers['e'][EKey];

export const isNA = (v: unknown): v is NA =>
  typeof v === 'object' && v !== null && typeof (v as NA).na === 'string';

// The best value of each guardrail/boundary item, taken from the checklist options.
const E_BEST: Record<string, number> = {};
for (const item of [...E_GUARDRAILS, ...E_BOUNDARIES]) {
  E_BEST[item.key] = Math.max(...item.options.map((o) => Number(o.value)));
}
const E_ITEM_KEYS = [...E_GUARDRAILS, ...E_BOUNDARIES].map((x) => x.key);

const WORST_POINTS: Record<string, number | null> = Object.fromEntries(
  WORST_CASE_OPTIONS.map((o) => [o.value, o.points]),
);

// Each section's floor and ceiling, from the checklist's option values (E includes the scored worst cases).
const span = (items: ChecklistItem[], extra: number[] = [0]): readonly [number, number] => {
  const lows = items.map((it) => Math.min(...it.options.map((o) => Number(o.value))));
  const highs = items.map((it) => Math.max(...it.options.map((o) => Number(o.value))));
  const add = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
  return [add(lows) + Math.min(...extra), add(highs) + Math.max(...extra)];
};
const WORST_SCORED = WORST_CASE_OPTIONS.flatMap((o) => (o.points === null ? [] : [o.points]));
export const SECTION_RANGE = {
  h: span(H_ITEMS),
  i: span(I_ITEMS),
  e: span([...E_GUARDRAILS, ...E_BOUNDARIES], WORST_SCORED),
} as const;
/** The lowest possible total (every item at its worst, the worst case severe); the ceiling is THRESHOLDS.ceiling. */
export const SCORE_FLOOR = SECTION_RANGE.h[0] + SECTION_RANGE.i[0] + SECTION_RANGE.e[0];

export function eItemScore(key: EKey, v: EValue | undefined): number | null {
  if (key === 'worstCase') return v == null ? null : (WORST_POINTS[v as string] ?? 0);
  if (isNA(v)) return E_BEST[key];
  return typeof v === 'number' ? v : null;
}

const sum = (xs: Array<number | null | undefined>) => xs.reduce<number>((t, x) => t + (x ?? 0), 0);

export function sectionScores(a: HireAnswers): SectionScores {
  const hv = Object.values(a.h) as Array<number | null>;
  const iv = [a.i.frequency, a.i.timeSavings, a.i.roi, a.i.strategicValue] as Array<number | null>;
  const ev = (['worstCase', ...E_ITEM_KEYS] as EKey[]).map((k) => eItemScore(k, a.e[k]));
  const h = sum(hv), i = sum(iv), e = sum(ev);
  const done = (xs: Array<number | null>) => xs.every((x) => x !== null);
  return { h, i, e, total: h + i + e, complete: { h: done(hv), i: done(iv), e: done(ev) } };
}

/** A Part 1 stop's verdict: DO NOT BUILD before building, FIRE once the agent is live. */
export const stopVerdict = (a: HireAnswers): 'DO NOT BUILD' | 'FIRE' => (a.isLive ? 'FIRE' : 'DO NOT BUILD');

export function firstStop(a: HireAnswers): Stop | null {
  if (a.part1.canStateBusinessProblem === false) return { gate: 'problem', message: "STOP: the business problem can't be stated." };
  if (a.part1.canDefineJobAndKpis === false) return { gate: 'job', message: "STOP: the job description and KPIs can't be defined." };
  if (a.r.ruleBased === true) return { gate: 'ruleBased', message: "Don't build an agent: use automation" };
  if (a.r.informational === true) return { gate: 'informational', message: "Don't build an agent: use a chatbot" };
  if (a.e.worstCase === 'catastrophic') return { gate: 'catastrophic', message: `Catastrophic failure would cause irreversible harm: ${stopVerdict(a)}.` };
  return null;
}

export function band(total: number): 'DO NOT BUILD' | 'TRAIN' | 'HIRE' {
  if (total <= THRESHOLDS.doNotBuildMax) return 'DO NOT BUILD';
  if (total <= THRESHOLDS.trainMax) return 'TRAIN';
  return 'HIRE';
}

const blank = (s: string | undefined) => !s || s.trim() === '';

export function redFlags(a: HireAnswers): RedFlag[] {
  const out: RedFlag[] = [];
  const add = (section: RedFlag['section'], key: RedFlag['key'], cond: boolean) => {
    if (cond) out.push({ section, key, text: RED_FLAGS[key] });
  };
  const { h, i, r, e, part1 } = a;
  add('H', 'h1', h.trust === 1 || h.culturalFit === 1);
  add('H', 'h2', h.dataQuality === 1);
  add('H', 'h3', h.changeManagement === 1);
  add('I', 'i1', i.frequency !== null && i.frequency <= 2);
  add('I', 'i2', part1.canDefineJobAndKpis === false);
  add('I', 'i3', part1.canStateBusinessProblem === false);
  add('R', 'r1', r.ruleBased === true);
  add('R', 'r2', r.informational === true);
  add('R', 'r3', blank(r.table?.rule?.does) && blank(r.table?.rule?.why));
  const highStakes = e.worstCase === 'moderate' || e.worstCase === 'severe' || e.access === -10;
  add('E', 'e1', e.hitl === -5 || (e.hitl === 0 && highStakes));
  add('E', 'e2', e.security === -5);
  add('E', 'e3', e.rollback === -5);
  add('E', 'e4', e.worstCase === 'catastrophic');
  return out;
}

export function traitCount(a: HireAnswers): number {
  return Object.values(a.r.traits).filter(Boolean).length;
}

export function traitsNote(a: HireAnswers): string | null {
  if (a.r.ruleBased === false && a.r.informational === false && traitCount(a) < 3) {
    return `may not need an AI agent (${traitCount(a)} of 5 traits)`;
  }
  return null;
}

export function naItems(a: HireAnswers): Array<{ key: string; reason: string; score: number }> {
  const out: Array<{ key: string; reason: string; score: number }> = [];
  for (const key of E_ITEM_KEYS) {
    const v = a.e[key as EKey];
    if (isNA(v)) out.push({ key, reason: v.na, score: E_BEST[key] });
  }
  return out;
}
