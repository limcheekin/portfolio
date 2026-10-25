// What the live-metrics inputs accept, and how the meters lay out each rate. live.ts holds the bands and the FIRE
// rules; this file only keeps the UI from storing a value the validator would refuse or a limit looser than Critical.
import type { MetricKey } from '../../lib/hire/types';

export const SHORT: Record<MetricKey, string> = { ucr: 'UCR', ppr: 'PPR', diy: 'DIY', irr: 'IRR', rlr: 'RLR' };
export const KEYS: MetricKey[] = ['ucr', 'ppr', 'diy', 'irr', 'rlr'];

/** A rate (this period or the previous one): percentages 0–100, PPR 1.0 turns or more. */
export function valueError(k: MetricKey, n: number): string | null {
  if (k === 'ppr') return n >= 1 ? null : 'PPR counts turns: enter 1.0 or more.';
  return n >= 0 && n <= 100 ? null : `${SHORT[k]} is a percentage: enter 0 to 100.`;
}

/** A tighter FIRE limit, never looser than Critical (the spec's ranges). RLR takes none. */
export function limitError(k: Exclude<MetricKey, 'rlr'>, n: number): string | null {
  switch (k) {
    case 'ucr': return n > 0 && n <= 30 ? null : 'A UCR limit must be above 0% and at most 30% (never looser than Critical).';
    case 'ppr': return n >= 1 && n <= 2 ? null : 'A PPR limit must be from 1.0 to 2.0 turns (never looser than Critical).';
    case 'diy': return n > 0 && n <= 15 ? null : 'A DIY limit must be above 0% and at most 15% (never looser than Critical).';
    case 'irr': return n >= 40 && n < 100 ? null : 'An IRR limit must be at least 40% and below 100% (never looser than Critical).';
  }
}

export const sampleError = (n: number): string | null => (Number.isInteger(n) && n >= 1 ? null : 'Enter a whole number of 1 or more.');

/** Meter scale and band edges, left to right, from ai-agent-metrics.md. IRR runs the other way: high is good. */
export const SCALE: Record<MetricKey, { min: number; max: number; zones: Array<{ to: number; band: 'Good' | 'Warning' | 'Critical' }> }> = {
  ucr: { min: 0, max: 100, zones: [{ to: 15, band: 'Good' }, { to: 30, band: 'Warning' }, { to: 100, band: 'Critical' }] },
  ppr: { min: 1, max: 5, zones: [{ to: 1.2, band: 'Good' }, { to: 2, band: 'Warning' }, { to: 5, band: 'Critical' }] },
  diy: { min: 0, max: 100, zones: [{ to: 5, band: 'Good' }, { to: 15, band: 'Warning' }, { to: 100, band: 'Critical' }] },
  irr: { min: 0, max: 100, zones: [{ to: 40, band: 'Critical' }, { to: 60, band: 'Warning' }, { to: 100, band: 'Good' }] },
  rlr: { min: 0, max: 5, zones: [{ to: 0, band: 'Good' }, { to: 1, band: 'Warning' }, { to: 5, band: 'Critical' }] },
};

export const unitOf = (k: MetricKey) => (k === 'ppr' ? 'turns' : '%');
export const fmtRate = (k: MetricKey, n: number) => {
  const s = String(Math.round(n * 100) / 100);
  return k === 'ppr' ? `${s} turns` : `${s}%`;
};
