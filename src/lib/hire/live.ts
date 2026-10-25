import type { HireAnswers, MetricKey } from './types.ts';
import { METRIC_DEFS, METRIC_KEYS, METRIC_SHORT } from './checklist.ts';
import { fmtNum as fmt } from './helpers.ts';

export type Band = 'Good' | 'Warning' | 'Critical';
const SMALL_SAMPLE = 30; // display-only flag threshold (this tool's reading)

/** The metrics guide's band edges: Good up to `good`, Warning up to `critical`. IRR runs the other way: high is good. */
export const BAND_EDGES: Record<MetricKey, { good: number; critical: number }> = {
  ucr: { good: 15, critical: 30 },
  ppr: { good: 1.2, critical: 2.0 },
  diy: { good: 5, critical: 15 },
  irr: { good: 60, critical: 40 },
  rlr: { good: 0, critical: 1 },
};

/** What a rate (this period or the previous one) may be: a percentage from 0 to 100; PPR counts turns, 1 or more. */
export const RATE_RANGE: Record<MetricKey, { min: number; max: number }> = Object.fromEntries(
  METRIC_KEYS.map((k) => [k, k === 'ppr' ? { min: 1, max: Infinity } : { min: 0, max: 100 }]),
) as Record<MetricKey, { min: number; max: number }>;

export function metricBand(key: MetricKey, v: number): Band {
  const { good, critical } = BAND_EDGES[key];
  switch (key) {
    case 'ucr':
    case 'diy': return v < good ? 'Good' : v <= critical ? 'Warning' : 'Critical';
    case 'ppr': return v <= good ? 'Good' : v <= critical ? 'Warning' : 'Critical';
    case 'irr': return v > good ? 'Good' : v >= critical ? 'Warning' : 'Critical';
    case 'rlr': return v === good ? 'Good' : v <= critical ? 'Warning' : 'Critical';
  }
}

/** A review with nothing measured or answered yet: what a live assessment starts from. */
export function blankReview(launchDate: string | null = null): NonNullable<HireAnswers['review']> {
  return {
    launchDate,
    metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, { value: null }])) as Record<MetricKey, { value: null }>,
    maintenanceExceedsValue: null,
    betterSolution: null,
  };
}

function parts(iso: string): [number, number, number] {
  const [y, mo, d] = iso.split('-').map(Number);
  return [y, mo, d];
}

export function monthsBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = parts(fromISO);
  const [y2, m2, d2] = parts(toISO);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

export interface FireHit { key: MetricKey | 'maintenance' | 'betterSolution'; text: string }
export interface LiveReading {
  bands: Partial<Record<MetricKey, Band>>;
  fire: FireHit[];
  watch: string[];
  pairs: string[];
  unmeasured: MetricKey[];
  notes: string[];
}

export type LimitKey = Exclude<MetricKey, 'rlr'>;

/** Each rate's default FIRE threshold: its Critical band edge. RLR has none: any red line fires. */
export const CRITICAL: Record<LimitKey, number> = {
  ucr: BAND_EDGES.ucr.critical, ppr: BAND_EDGES.ppr.critical, diy: BAND_EDGES.diy.critical, irr: BAND_EDGES.irr.critical,
};

/** Whether `n` may be a custom FIRE limit: inside the rate's range and never looser than Critical (the spec's ranges). */
export function limitAllowed(key: LimitKey, n: number): boolean {
  const c = CRITICAL[key];
  switch (key) {
    case 'ucr':
    case 'diy': return n > 0 && n <= c;
    case 'ppr': return n >= 1 && n <= c;
    case 'irr': return n >= c && n < 100;
  }
}

/** The allowed custom limits in words (validator issues and the UI's field errors). */
export const LIMIT_RULE: Record<LimitKey, string> = {
  ucr: `above 0% and at most ${CRITICAL.ucr}%`,
  ppr: `from 1.0 to ${CRITICAL.ppr.toFixed(1)} turns`,
  diy: `above 0% and at most ${CRITICAL.diy}%`,
  irr: `at least ${CRITICAL.irr}% and below 100%`,
};

/** The limit that applies: a custom one when it is allowed, else Critical. */
function threshold(key: LimitKey, limit: number | null | undefined): number {
  return limit != null && Number.isFinite(limit) && limitAllowed(key, limit) ? limit : CRITICAL[key];
}

/** DIY against its limit, and how long the agent has been live: DIY counts as FIRE only above the limit after 3 months. */
export function diyRule(review: NonNullable<HireAnswers['review']>, assessmentDate: string): { over: boolean; limit: number; months: number | null } | null {
  const diy = review.metrics.diy.value;
  if (diy === null || diy === undefined) return null;
  const limit = threshold('diy', review.metrics.diy.limit);
  return { over: diy > limit, limit, months: review.launchDate ? monthsBetween(review.launchDate, assessmentDate) : null };
}

/** Whether the months-live rule kept a DIY rate above its limit from counting as FIRE. */
export function diyHeldBack(review: NonNullable<HireAnswers['review']>, assessmentDate: string): boolean {
  const d = diyRule(review, assessmentDate);
  return !!d && d.over && (d.months === null || d.months < 3);
}

export function readLive(review: NonNullable<HireAnswers['review']>, assessmentDate: string): LiveReading {
  const out: LiveReading = { bands: {}, fire: [], watch: [], pairs: [], unmeasured: [], notes: [] };
  const mt = review.metrics;
  const val = (k: MetricKey) => mt[k].value;
  const prev = (k: MetricKey) => mt[k].previous ?? null;

  for (const k of METRIC_KEYS) {
    const v = val(k);
    if (v === null || v === undefined) { out.unmeasured.push(k); continue; }
    out.bands[k] = metricBand(k, v);
    const s = mt[k].sample;
    if (s != null && s < SMALL_SAMPLE) {
      out.notes.push(`${METRIC_SHORT[k]} rests on a small sample (${s} ${METRIC_DEFS[k].denominator.split(' (')[0]}); read it with care`);
    }
  }

  const ucr = val('ucr'), ppr = val('ppr'), diy = val('diy'), irr = val('irr'), rlr = val('rlr');
  const prevIrr = prev('irr'), prevPpr = prev('ppr');
  const irrFalling = irr != null && prevIrr != null && irr < prevIrr;
  const fired = new Set<MetricKey>();

  if (ucr != null) {
    const t = threshold('ucr', mt.ucr.limit);
    if (ucr > t) { fired.add('ucr'); out.fire.push({ key: 'ucr', text: `UCR ${fmt(ucr)}% is above the ${fmt(t)}% limit` }); }
  }
  if (ppr != null) {
    const t = threshold('ppr', mt.ppr.limit);
    if (ppr > t) {
      if (irrFalling) { fired.add('ppr'); out.fire.push({ key: 'ppr', text: `PPR ${fmt(ppr)} is above ${fmt(t)} turns while IRR is falling` }); }
      else if (irr == null || prevIrr == null) out.notes.push('IRR trend unknown');
    }
  }
  const diyCheck = diyRule(review, assessmentDate);
  if (diy != null && diyCheck?.over) {
    const { limit: t, months } = diyCheck;
    if (months !== null && months >= 3) { fired.add('diy'); out.fire.push({ key: 'diy', text: `DIY ${fmt(diy)}% is above the ${fmt(t)}% limit after ${months} months live` }); }
    else if (months === null) out.notes.push('No launch date, so a DIY rate above its limit cannot count as FIRE');
  }
  if (rlr != null && rlr > 0) {
    fired.add('rlr');
    out.fire.push({ key: 'rlr', text: `RLR ${fmt(rlr)}% is above zero; any red-line breach is FIRE` });
    if (rlr <= 1) out.notes.push("RLR is in the guide's Warning band, but the checklist treats any red line as FIRE");
  }
  if (irr != null) {
    const t = threshold('irr', mt.irr.limit);
    if (irr < t) { fired.add('irr'); out.fire.push({ key: 'irr', text: `IRR ${fmt(irr)}% is below the ${fmt(t)}% limit` }); }
  }
  if (review.maintenanceExceedsValue === true) out.fire.push({ key: 'maintenance', text: 'Maintenance costs exceed the value delivered' });
  if (review.betterSolution === true) out.fire.push({ key: 'betterSolution', text: 'A better solution is available' });

  for (const k of METRIC_KEYS) {
    const b = out.bands[k];
    if (!b || b === 'Good' || fired.has(k)) continue;
    const v = val(k) as number;
    if (b === 'Warning') out.watch.push(`${METRIC_SHORT[k]} is in the Warning band (${fmt(v)}${METRIC_DEFS[k].unit === '%' ? '%' : ' turns'})`);
    else if (k === 'diy') out.watch.push(`DIY ${fmt(v)}% is Critical but ${review.launchDate ? 'under 3 months live' : 'the launch date is unknown'}, so a warning only`);
    else if (k === 'ppr') out.watch.push(`PPR ${fmt(v)} is Critical but IRR is not known to be falling, so a warning only`);
    else out.watch.push(`${METRIC_SHORT[k]} is Critical (${fmt(v)}%)`);
  }

  // Pair readings (this tool's thresholds)
  if (irr != null && diy != null && irr > 60 && diy >= 5) {
    out.pairs.push('Narrow agent: accurate on the requests it handles, but users abandon it on everything else.');
  }
  if (irr != null && ppr != null) {
    if (irr >= 40 && irr <= 60 && ppr > 1.2 && ppr <= 2.0 && !irrFalling) {
      out.pairs.push('Clarifying before acting: when resolution is not instant, the agent usually resolves after a clarifying question.');
    }
    if (prevPpr != null && prevIrr != null && ppr > prevPpr && irr >= prevIrr) {
      out.pairs.push('Healthy clarification: extra turns are buying resolution.');
    }
    if ((ppr > 1.2 || (prevPpr != null && ppr > prevPpr)) && irrFalling && !fired.has('ppr')) {
      out.pairs.push('Efficiency warning: turns are rising while instant resolution falls.');
    }
  }
  return out;
}
