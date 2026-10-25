import { useReducer } from 'react';
import type { HireAnswers } from '../../lib/hire/types.ts';
import { isNA } from '../../lib/hire/score.ts';

export type Action =
  | { type: 'set'; path: string; value: unknown } // dotted path into HireAnswers; `undefined` removes the field
  | { type: 'load'; answers: HireAnswers }
  | { type: 'reset' }
  | { type: 'startReview' }; // isLive=true, assessmentDate=today, review defaults

export type Dispatch = (a: Action) => void;

/** Today's local date as YYYY-MM-DD (the user's calendar day, not UTC). */
export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function blankHireAnswers(): HireAnswers {
  return {
    v: 1,
    name: '',
    isLive: false,
    assessmentDate: todayISO(),
    part1: { canStateBusinessProblem: null, canDefineJobAndKpis: null },
    r: {
      ruleBased: null,
      informational: null,
      traits: { ambiguity: false, multiStepReasoning: false, intermediateStates: false, retrying: false, adapting: false },
    },
    h: { trust: null, culturalFit: null, userControl: null, changeManagement: null, dataQuality: null, systemIntegration: null, interaction: null },
    i: { frequency: null, timeSavings: null, roi: null, strategicValue: null },
    e: { worstCase: null, hitl: null, security: null, rollback: null, audit: null, tenant: null, access: null, fallback: null },
  };
}

export function blankReview(launchDate: string | null = null): NonNullable<HireAnswers['review']> {
  return {
    launchDate,
    metrics: { ucr: { value: null }, ppr: { value: null }, diy: { value: null }, irr: { value: null }, rlr: { value: null } },
    maintenanceExceedsValue: null,
    betterSolution: null,
  };
}

type Node = Record<string, unknown> | unknown[];

/** Immutable write at `keys`; missing containers are created (an array when the next key is an index). */
function setIn(node: unknown, keys: string[], value: unknown): unknown {
  const [k, ...rest] = keys;
  const base: Node = Array.isArray(node) ? [...node] : typeof node === 'object' && node !== null ? { ...(node as Record<string, unknown>) } : /^\d+$/.test(k) ? [] : {};
  const rec = base as Record<string, unknown>;
  if (rest.length === 0) {
    if (value === undefined && !Array.isArray(base)) delete rec[k];
    else rec[k] = value;
  } else {
    rec[k] = setIn(rec[k], rest, value);
  }
  return base;
}

/**
 * A live assessment always has a whole review. A link (or MCP call) may say `isLive: true` and leave `review` out, which
 * the validator allows; a field write into that gap would otherwise build a partial review that `assess` can't read.
 */
function withReview(s: HireAnswers): HireAnswers {
  return s.isLive && !s.review ? { ...s, review: blankReview() } : s;
}

export function hireReducer(s: HireAnswers, a: Action): HireAnswers {
  switch (a.type) {
    case 'set': {
      const keys = a.path.split('.');
      // A write into a missing review starts from a blank one, live or not, so it is never partial.
      const base = keys[0] === 'review' && keys.length > 1 && !s.review ? { ...s, review: blankReview() } : s;
      // Writing a number over an N/A object replaces it, so its reason goes with it.
      return withReview(setIn(base, keys, a.value) as HireAnswers);
    }
    case 'load':
      return withReview(a.answers);
    case 'reset':
      return blankHireAnswers();
    case 'startReview': {
      // A review re-scores what is known now: the old link's date and metrics must not feed it.
      const doc = s.doc ? { ...s.doc } : undefined;
      if (doc) delete doc.reviewDate; // its default follows the new assessment date
      const next: HireAnswers = { ...s, isLive: true, assessmentDate: todayISO(), review: blankReview(s.review?.launchDate ?? null) };
      if (doc) next.doc = doc;
      return next;
    }
  }
}

/**
 * The answers as scored and linked: an N/A whose reason is still blank counts as unanswered, so it never
 * scores its best value and never writes a link the validator would refuse.
 */
export function scoringAnswers(a: HireAnswers): HireAnswers {
  let e: HireAnswers['e'] | null = null;
  for (const [k, v] of Object.entries(a.e)) {
    if (isNA(v) && v.na.trim() === '') {
      e ??= { ...a.e };
      (e as Record<string, unknown>)[k] = null;
    }
  }
  return e ? { ...a, e } : a;
}

export function useHireState() {
  return useReducer(hireReducer, undefined, blankHireAnswers);
}
