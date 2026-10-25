import { E_BOUNDARIES, E_GUARDRAILS, H_ITEMS, I_ITEMS, WORST_CASE_OPTIONS } from './checklist.ts';
import { firstStop } from './score.ts';
import type { HireAnswers, MetricInput, MetricKey } from './types.ts';

export type Validation = { ok: true; answers: HireAnswers } | { ok: false; issues: string[] };

export const TEXT_CAPS: Record<string, number> = {
  name: 80,
  businessProblem: 500,
  jobTitle: 80,
  responsibilities: 500,
  boundaries: 500,
  kpiName: 80,
  kpiTarget: 40,
  tableCell: 300,
  naReason: 160,
  rationale: 1000,
  nextSteps: 500,
  signOffName: 80,
};
export const MAX_KPIS = 6;
const MAX_ISSUES = 20;

const allowed = (items: Array<{ key: string; options: Array<{ value: number | string }> }>) =>
  Object.fromEntries(items.map((x) => [x.key, x.options.map((o) => o.value as number)])) as Record<string, number[]>;
const H_ALLOWED = allowed(H_ITEMS);
const E_ALLOWED = allowed([...E_GUARDRAILS, ...E_BOUNDARIES]);
const WORST = WORST_CASE_OPTIONS.map((o) => o.value);
const I_KEYS = ['frequency', 'timeSavings', 'roi', 'strategicValue'] as const;
const I_ALLOWED = allowed(I_ITEMS);
const METRIC_KEYS: MetricKey[] = ['ucr', 'ppr', 'diy', 'irr', 'rlr'];
const SIGN_OFF = ['productManager', 'engineering', 'dataAnalytics', 'securityCompliance', 'endUsers'];
const TRAITS = ['ambiguity', 'multiStepReasoning', 'intermediateStates', 'retrying', 'adapting'] as const;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isDate = (s: unknown): s is string => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const listOf = (xs: unknown[]) => xs.join(', ').replace(/, ([^,]*)$/, ' or $1');

export function validateAnswers(input: unknown, opts: { requireComplete?: boolean } = {}): Validation {
  const issues: string[] = [];
  const bad = (m: string) => { if (issues.length < MAX_ISSUES) issues.push(m); };
  try {
    const out = run(input, bad);
    if (issues.length === 0 && opts.requireComplete) completeness(out, bad);
    return issues.length ? { ok: false, issues } : { ok: true, answers: out };
  } catch {
    return { ok: false, issues: ['input: could not be read'] };
  }
}

function keys(o: Obj, path: string, known: readonly string[], bad: (m: string) => void) {
  for (const k of Object.keys(o)) if (!known.includes(k)) bad(`${path ? path + '.' : ''}${k}: unknown field`);
}
function obj(x: unknown, path: string, bad: (m: string) => void): Obj | null {
  if (x === undefined) return {};
  if (isObj(x)) return x;
  bad(`${path}: must be an object`);
  return null;
}
function text(x: unknown, path: string, cap: number, bad: (m: string) => void): string | undefined {
  if (x === undefined) return undefined;
  if (typeof x !== 'string') { bad(`${path}: must be text`); return undefined; }
  if (x.length > cap) bad(`${path}: at most ${cap} characters (got ${x.length})`);
  return x;
}
function bool(x: unknown, path: string, bad: (m: string) => void): boolean | null {
  if (x === undefined || x === null) return null;
  if (typeof x === 'boolean') return x;
  bad(`${path}: must be true, false or null`);
  return null;
}
function score(x: unknown, path: string, vals: number[], bad: (m: string) => void): number | null {
  if (x === undefined || x === null) return null;
  if (typeof x === 'number' && vals.includes(x)) return x;
  bad(`${path}: must be ${listOf(vals)}`);
  return null;
}
function num(x: unknown, path: string, bad: (m: string) => void, min = 0, max = Infinity): number | undefined {
  if (typeof x !== 'number' || !Number.isFinite(x)) { bad(`${path}: must be a finite number`); return undefined; }
  if (x < min || x > max) bad(`${path}: must be ${max === Infinity ? `at least ${min}` : `between ${min} and ${max}`}`);
  return x;
}

function run(input: unknown, bad: (m: string) => void): HireAnswers {
  if (!isObj(input)) { bad('input: must be an object'); return {} as HireAnswers; }
  keys(input, '', ['v', 'name', 'isLive', 'assessmentDate', 'part1', 'r', 'h', 'i', 'e', 'review', 'doc'], bad);
  if (input.v !== undefined && input.v !== 1) bad('v: must be 1');
  const name = text(input.name, 'name', TEXT_CAPS.name, bad) ?? '';
  if (input.isLive !== undefined && typeof input.isLive !== 'boolean') bad('isLive: must be true or false');
  const isLive = input.isLive === true;
  let assessmentDate = new Date().toISOString().slice(0, 10);
  if (input.assessmentDate !== undefined) {
    if (isDate(input.assessmentDate)) assessmentDate = input.assessmentDate;
    else bad('assessmentDate: must be a real date as YYYY-MM-DD');
  }

  // Part 1
  const p1 = obj(input.part1, 'part1', bad) ?? {};
  keys(p1, 'part1', ['canStateBusinessProblem', 'businessProblem', 'canDefineJobAndKpis', 'job', 'kpis'], bad);
  const part1: HireAnswers['part1'] = {
    canStateBusinessProblem: bool(p1.canStateBusinessProblem, 'part1.canStateBusinessProblem', bad),
    canDefineJobAndKpis: bool(p1.canDefineJobAndKpis, 'part1.canDefineJobAndKpis', bad),
  };
  const bp = text(p1.businessProblem, 'part1.businessProblem', TEXT_CAPS.businessProblem, bad);
  if (bp !== undefined) part1.businessProblem = bp;
  if (p1.job !== undefined) {
    const j = obj(p1.job, 'part1.job', bad) ?? {};
    keys(j, 'part1.job', ['title', 'responsibilities', 'boundaries'], bad);
    const job: NonNullable<HireAnswers['part1']['job']> = {};
    const t = text(j.title, 'part1.job.title', TEXT_CAPS.jobTitle, bad);
    const rs = text(j.responsibilities, 'part1.job.responsibilities', TEXT_CAPS.responsibilities, bad);
    const bd = text(j.boundaries, 'part1.job.boundaries', TEXT_CAPS.boundaries, bad);
    if (t !== undefined) job.title = t;
    if (rs !== undefined) job.responsibilities = rs;
    if (bd !== undefined) job.boundaries = bd;
    part1.job = job;
  }
  if (p1.kpis !== undefined) {
    if (!Array.isArray(p1.kpis)) bad('part1.kpis: must be a list');
    else {
      if (p1.kpis.length > MAX_KPIS) bad(`part1.kpis: at most ${MAX_KPIS} rows`);
      part1.kpis = p1.kpis.slice(0, MAX_KPIS).map((row, n) => {
        const p = `part1.kpis[${n}]`;
        if (!isObj(row)) { bad(`${p}: must be an object`); return { name: '', target: '' }; }
        keys(row, p, ['name', 'target'], bad);
        return {
          name: text(row.name ?? '', `${p}.name`, TEXT_CAPS.kpiName, bad) ?? '',
          target: text(row.target ?? '', `${p}.target`, TEXT_CAPS.kpiTarget, bad) ?? '',
        };
      });
    }
  }

  // R
  const rr = obj(input.r, 'r', bad) ?? {};
  keys(rr, 'r', ['ruleBased', 'informational', 'traits', 'table'], bad);
  const tr = obj(rr.traits, 'r.traits', bad) ?? {};
  keys(tr, 'r.traits', TRAITS, bad);
  const traits = {} as HireAnswers['r']['traits'];
  for (const k of TRAITS) {
    if (tr[k] !== undefined && typeof tr[k] !== 'boolean') bad(`r.traits.${k}: must be true or false`);
    traits[k] = tr[k] === true;
  }
  const r: HireAnswers['r'] = {
    ruleBased: bool(rr.ruleBased, 'r.ruleBased', bad),
    informational: bool(rr.informational, 'r.informational', bad),
    traits,
  };
  if (rr.table !== undefined) {
    const tb = obj(rr.table, 'r.table', bad) ?? {};
    keys(tb, 'r.table', ['rule', 'chatbot', 'agent'], bad);
    const table: NonNullable<HireAnswers['r']['table']> = {};
    for (const k of ['rule', 'chatbot', 'agent'] as const) {
      if (tb[k] === undefined) continue;
      const row = obj(tb[k], `r.table.${k}`, bad) ?? {};
      keys(row, `r.table.${k}`, ['does', 'why'], bad);
      const cell: { does?: string; why?: string } = {};
      const d = text(row.does, `r.table.${k}.does`, TEXT_CAPS.tableCell, bad);
      const w = text(row.why, `r.table.${k}.why`, TEXT_CAPS.tableCell, bad);
      if (d !== undefined) cell.does = d;
      if (w !== undefined) cell.why = w;
      table[k] = cell;
    }
    r.table = table;
  }

  // H
  const hh = obj(input.h, 'h', bad) ?? {};
  keys(hh, 'h', Object.keys(H_ALLOWED), bad);
  const h = Object.fromEntries(Object.keys(H_ALLOWED).map((k) => [k, score(hh[k], `h.${k}`, H_ALLOWED[k], bad)])) as HireAnswers['h'];

  // I
  const ii = obj(input.i, 'i', bad) ?? {};
  keys(ii, 'i', [...I_KEYS, 'figures'], bad);
  const i = Object.fromEntries(I_KEYS.map((k) => [k, score(ii[k], `i.${k}`, I_ALLOWED[k], bad)])) as unknown as HireAnswers['i'];
  if (ii.figures !== undefined) {
    const f = obj(ii.figures, 'i.figures', bad) ?? {};
    keys(f, 'i.figures', ['unit', 'current', 'expected', 'buildCost', 'annualMaintenanceCost', 'expectedAnnualSavings', 'currency'], bad);
    const figures: NonNullable<HireAnswers['i']['figures']> = {};
    if (f.unit !== undefined) {
      if (f.unit === 'minutes' || f.unit === 'hours') figures.unit = f.unit;
      else bad('i.figures.unit: must be minutes or hours');
    }
    for (const k of ['current', 'expected', 'buildCost', 'annualMaintenanceCost', 'expectedAnnualSavings'] as const) {
      if (f[k] === undefined) continue;
      const n = num(f[k], `i.figures.${k}`, bad);
      if (n !== undefined) figures[k] = n;
    }
    if (f.currency !== undefined) {
      if (typeof f.currency === 'string' && f.currency.length <= 8) figures.currency = f.currency;
      else bad('i.figures.currency: must be text of at most 8 characters');
    }
    i.figures = figures;
  }

  // E
  const ee = obj(input.e, 'e', bad) ?? {};
  keys(ee, 'e', ['worstCase', ...Object.keys(E_ALLOWED)], bad);
  const e = { worstCase: null } as unknown as HireAnswers['e'];
  if (ee.worstCase === undefined || ee.worstCase === null) e.worstCase = null;
  else if (typeof ee.worstCase === 'string' && WORST.includes(ee.worstCase)) e.worstCase = ee.worstCase as HireAnswers['e']['worstCase'];
  else bad(`e.worstCase: must be ${listOf(WORST)}`);
  for (const k of Object.keys(E_ALLOWED)) {
    const v = ee[k];
    const p = `e.${k}`;
    if (isObj(v) && 'na' in v) {
      keys(v, p, ['na'], bad);
      const reason = typeof v.na === 'string' ? v.na : '';
      if (typeof v.na !== 'string') bad(`${p}.na: must be text`);
      else if (reason.trim() === '') bad(`${p}.na: a reason is required`);
      else if (reason.length > TEXT_CAPS.naReason) bad(`${p}.na: at most ${TEXT_CAPS.naReason} characters (got ${reason.length})`);
      (e as unknown as Obj)[k] = { na: reason };
    } else {
      (e as unknown as Obj)[k] = score(v, p, E_ALLOWED[k], bad);
    }
  }

  const out: HireAnswers = { v: 1, name, isLive, assessmentDate, part1, r, h, i, e };

  // Review
  if (input.review !== undefined) {
    const rv = obj(input.review, 'review', bad) ?? {};
    keys(rv, 'review', ['launchDate', 'metrics', 'maintenanceExceedsValue', 'betterSolution'], bad);
    let launchDate: string | null = null;
    if (rv.launchDate !== undefined && rv.launchDate !== null) {
      if (isDate(rv.launchDate)) launchDate = rv.launchDate;
      else bad('review.launchDate: must be a real date as YYYY-MM-DD or null');
    }
    const ms = obj(rv.metrics, 'review.metrics', bad) ?? {};
    keys(ms, 'review.metrics', METRIC_KEYS, bad);
    const metrics = {} as Record<MetricKey, MetricInput>;
    for (const k of METRIC_KEYS) {
      const p = `review.metrics.${k}`;
      const mi = obj(ms[k], p, bad) ?? {};
      keys(mi, p, ['value', 'previous', 'sample', 'limit'], bad);
      const lo = k === 'ppr' ? 1 : 0;
      const hi = k === 'ppr' ? Infinity : 100;
      const rate = (x: unknown, path: string): number | null | undefined => {
        if (x === null) return null;
        return num(x, path, bad, lo, hi);
      };
      const m: MetricInput = { value: null };
      if (mi.value !== undefined) m.value = rate(mi.value, `${p}.value`) ?? null;
      if (mi.previous !== undefined) { const x = rate(mi.previous, `${p}.previous`); if (x !== undefined) m.previous = x; }
      if (mi.sample !== undefined) {
        if (mi.sample === null) m.sample = null;
        else { const x = num(mi.sample, `${p}.sample`, bad); if (x !== undefined) m.sample = x; }
      }
      if (mi.limit !== undefined) {
        if (k === 'rlr') bad(`${p}.limit: not allowed on RLR`);
        else if (mi.limit === null) m.limit = null;
        else { const x = rate(mi.limit, `${p}.limit`); if (x !== undefined) m.limit = x; }
      }
      metrics[k] = m;
    }
    out.review = {
      launchDate,
      metrics,
      maintenanceExceedsValue: bool(rv.maintenanceExceedsValue, 'review.maintenanceExceedsValue', bad),
      betterSolution: bool(rv.betterSolution, 'review.betterSolution', bad),
    };
  }

  // Doc
  if (input.doc !== undefined) {
    const d = obj(input.doc, 'doc', bad) ?? {};
    keys(d, 'doc', ['rationale', 'nextSteps', 'reviewDate', 'signOff'], bad);
    const doc: NonNullable<HireAnswers['doc']> = {};
    const ra = text(d.rationale, 'doc.rationale', TEXT_CAPS.rationale, bad);
    const ns = text(d.nextSteps, 'doc.nextSteps', TEXT_CAPS.nextSteps, bad);
    if (ra !== undefined) doc.rationale = ra;
    if (ns !== undefined) doc.nextSteps = ns;
    if (d.reviewDate !== undefined) {
      if (isDate(d.reviewDate)) doc.reviewDate = d.reviewDate;
      else bad('doc.reviewDate: must be a real date as YYYY-MM-DD');
    }
    if (d.signOff !== undefined) {
      const so = obj(d.signOff, 'doc.signOff', bad) ?? {};
      keys(so, 'doc.signOff', SIGN_OFF, bad);
      const signOff: NonNullable<NonNullable<HireAnswers['doc']>['signOff']> = {};
      for (const k of SIGN_OFF) {
        const t = text(so[k], `doc.signOff.${k}`, TEXT_CAPS.signOffName, bad);
        if (t !== undefined) (signOff as Record<string, string>)[k] = t;
      }
      doc.signOff = signOff;
    }
    out.doc = doc;
  }
  return out;
}

// "Complete enough" to assess: a stop needs only the answers up to its gate; otherwise every scored item.
function completeness(a: HireAnswers, bad: (m: string) => void) {
  if (firstStop(a)) return;
  const need = (v: unknown, path: string) => { if (v === null || v === undefined) bad(`${path}: required`); };
  need(a.part1.canStateBusinessProblem, 'part1.canStateBusinessProblem');
  need(a.part1.canDefineJobAndKpis, 'part1.canDefineJobAndKpis');
  need(a.r.ruleBased, 'r.ruleBased');
  need(a.r.informational, 'r.informational');
  for (const [k, v] of Object.entries(a.h)) need(v, `h.${k}`);
  for (const k of I_KEYS) need(a.i[k], `i.${k}`);
  for (const [k, v] of Object.entries(a.e)) need(v, `e.${k}`);
}
