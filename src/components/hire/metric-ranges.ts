// What the live-metrics inputs accept, and how the meters lay out each rate. live.ts holds the bands, the ranges and
// the FIRE rules; this file only words them for the UI, so it never stores a value the validator would refuse or a
// limit looser than Critical.
import { METRIC_KEYS, METRIC_SHORT } from '../../lib/hire/checklist';
import { fmtNum } from '../../lib/hire/helpers';
import { BAND_EDGES, CRITICAL, limitAllowed, RATE_RANGE, type Band, type LimitKey } from '../../lib/hire/live';
import type { MetricKey } from '../../lib/hire/types';

/** A rate (this period or the previous one): percentages 0–100, PPR 1.0 turns or more. */
export function valueError(k: MetricKey, n: number): string | null {
  const { min, max } = RATE_RANGE[k];
  if (k === 'ppr') return n >= min ? null : 'PPR counts turns: enter 1.0 or more.';
  return n >= min && n <= max ? null : `${METRIC_SHORT[k]} is a percentage: enter 0 to 100.`;
}

const LIMIT_RULE: Record<LimitKey, string> = {
  ucr: `above 0% and at most ${CRITICAL.ucr}%`,
  ppr: `from 1.0 to ${CRITICAL.ppr.toFixed(1)} turns`,
  diy: `above 0% and at most ${CRITICAL.diy}%`,
  irr: `at least ${CRITICAL.irr}% and below 100%`,
};

/** A tighter FIRE limit, never looser than Critical (the spec's ranges). RLR takes none. */
export function limitError(k: LimitKey, n: number): string | null {
  return limitAllowed(k, n) ? null : `${k === 'irr' ? 'An' : 'A'} ${METRIC_SHORT[k]} limit must be ${LIMIT_RULE[k]} (never looser than Critical).`;
}

export const sampleError = (n: number): string | null => (Number.isInteger(n) && n >= 1 ? null : 'Enter a whole number of 1 or more.');

// Each meter's ends: PPR starts at its 1-turn floor; PPR and RLR stop at 5 (higher values pin to the end).
const METER_ENDS: Record<MetricKey, [number, number]> = { ucr: [0, 100], ppr: [1, 5], diy: [0, 100], irr: [0, 100], rlr: [0, 5] };

/** Meter scale and band zones, left to right, from the band edges in live.ts. IRR runs the other way: high is good. */
export const SCALE = Object.fromEntries(
  METRIC_KEYS.map((k) => {
    const { good, critical } = BAND_EDGES[k];
    const [min, max] = METER_ENDS[k];
    const zones: Array<{ to: number; band: Band }> =
      k === 'irr'
        ? [{ to: critical, band: 'Critical' }, { to: good, band: 'Warning' }, { to: max, band: 'Good' }]
        : [{ to: good, band: 'Good' }, { to: critical, band: 'Warning' }, { to: max, band: 'Critical' }];
    return [k, { min, max, zones }];
  }),
) as Record<MetricKey, { min: number; max: number; zones: Array<{ to: number; band: Band }> }>;

export const unitOf = (k: MetricKey) => (k === 'ppr' ? 'turns' : '%');
export const fmtRate = (k: MetricKey, n: number) => (k === 'ppr' ? `${fmtNum(n)} turns` : `${fmtNum(n)}%`);
