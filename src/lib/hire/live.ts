import type { HireAnswers, MetricKey } from './types.ts';
import { METRIC_DEFS } from './checklist.ts';

export type Band = 'Good' | 'Warning' | 'Critical';
export const SMALL_SAMPLE = 30; // display-only flag threshold (this tool's reading)

const KEYS: MetricKey[] = ['ucr', 'ppr', 'diy', 'irr', 'rlr'];
const SHORT: Record<MetricKey, string> = { ucr: 'UCR', ppr: 'PPR', diy: 'DIY', irr: 'IRR', rlr: 'RLR' };

export function metricBand(key: MetricKey, v: number): Band {
  switch (key) {
    case 'ucr': return v < 15 ? 'Good' : v <= 30 ? 'Warning' : 'Critical';
    case 'ppr': return v <= 1.2 ? 'Good' : v <= 2.0 ? 'Warning' : 'Critical';
    case 'diy': return v < 5 ? 'Good' : v <= 15 ? 'Warning' : 'Critical';
    case 'irr': return v > 60 ? 'Good' : v >= 40 ? 'Warning' : 'Critical';
    case 'rlr': return v === 0 ? 'Good' : v <= 1 ? 'Warning' : 'Critical';
  }
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

// Default critical thresholds and the range a custom limit must sit in (exclusive of the default).
const CRITICAL: Record<'ucr' | 'ppr' | 'diy' | 'irr', number> = { ucr: 30, ppr: 2.0, diy: 15, irr: 40 };

/** The limit that applies: a custom one only when tighter than Critical and inside the spec's range. */
function threshold(key: 'ucr' | 'ppr' | 'diy' | 'irr', limit: number | null | undefined): number {
  const c = CRITICAL[key];
  if (limit == null || !Number.isFinite(limit)) return c;
  const ok =
    key === 'ucr' ? limit > 0 && limit < c :
    key === 'ppr' ? limit >= 1.0 && limit < c :
    key === 'diy' ? limit > 0 && limit < c :
    limit > c && limit < 100;
  return ok ? limit : c;
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

export function readLive(review: NonNullable<HireAnswers['review']>, assessmentDate: string): LiveReading {
  const out: LiveReading = { bands: {}, fire: [], watch: [], pairs: [], unmeasured: [], notes: [] };
  const mt = review.metrics;
  const val = (k: MetricKey) => mt[k].value;
  const prev = (k: MetricKey) => mt[k].previous ?? null;

  for (const k of KEYS) {
    const v = val(k);
    if (v === null || v === undefined) { out.unmeasured.push(k); continue; }
    out.bands[k] = metricBand(k, v);
    const s = mt[k].sample;
    if (s != null && s < SMALL_SAMPLE) {
      out.notes.push(`${SHORT[k]} rests on a small sample (${s} ${METRIC_DEFS[k].denominator.split(' (')[0]}); read it with care`);
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
  if (diy != null) {
    const t = threshold('diy', mt.diy.limit);
    if (diy > t) {
      const months = review.launchDate ? monthsBetween(review.launchDate, assessmentDate) : null;
      if (months !== null && months >= 3) { fired.add('diy'); out.fire.push({ key: 'diy', text: `DIY ${fmt(diy)}% is above the ${fmt(t)}% limit after ${months} months live` }); }
      else if (months === null) out.notes.push('No launch date, so a DIY rate above its limit cannot count as FIRE');
    }
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

  for (const k of KEYS) {
    const b = out.bands[k];
    if (!b || b === 'Good' || fired.has(k)) continue;
    const v = val(k) as number;
    if (b === 'Warning') out.watch.push(`${SHORT[k]} is in the Warning band (${fmt(v)}${METRIC_DEFS[k].unit === '%' ? '%' : ' turns'})`);
    else if (k === 'diy') out.watch.push(`DIY ${fmt(v)}% is Critical but under 3 months live, so a warning only`);
    else if (k === 'ppr') out.watch.push(`PPR ${fmt(v)} is Critical but IRR is not known to be falling, so a warning only`);
    else out.watch.push(`${SHORT[k]} is Critical (${fmt(v)}%)`);
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
