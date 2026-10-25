/** A number rounded to at most two decimals, without trailing zeros ("2", "1.25"). */
export const fmtNum = (n: number): string => String(Math.round(n * 100) / 100);

/** Money as the tool shows it: whole units with thousands separators, after the optional currency label. */
export const fmtMoney = (n: number, currency?: string): string =>
  `${currency ? `${currency} ` : ''}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export interface TimeSaved {
  savedPerProcess: number;
  savedPct: number;
  suggestion: 1 | 2 | 3 | 4;
}

/** Half-open bands: <=10% -> 1, (10,20] -> 2, (20,50] -> 3, >50% -> 4. Null when current is empty or <= 0. */
export function timeSaved(current?: number, expected?: number): TimeSaved | null {
  if (current === undefined || expected === undefined || !Number.isFinite(current) || !Number.isFinite(expected) || current <= 0) return null;
  const saved = current - expected;
  // Compare saved/current against thresholds by cross-multiplying, so 11/100 etc. never hit float edges.
  const suggestion = saved * 10 <= current ? 1 : saved * 5 <= current ? 2 : saved * 2 <= current ? 3 : 4;
  return { savedPerProcess: saved, savedPct: (saved / current) * 100, suggestion };
}

export interface Roi {
  netAnnualSavings: number;
  monthlyNetSavings: number;
  breakEvenMonths: number | 'Never';
  year1RoiPct: number;
  suggestion: -5 | 0 | 5;
}

/** Year-1 ROI. Null when buildCost is empty or <= 0, or expected savings are missing. */
export function roi(buildCost?: number, annualMaintenanceCost?: number, expectedAnnualSavings?: number): Roi | null {
  if (buildCost === undefined || !Number.isFinite(buildCost) || buildCost <= 0) return null;
  if (expectedAnnualSavings === undefined || !Number.isFinite(expectedAnnualSavings)) return null;
  const net = expectedAnnualSavings - (annualMaintenanceCost ?? 0);
  const monthly = net / 12;
  const year1RoiPct = ((net - buildCost) / buildCost) * 100;
  return {
    netAnnualSavings: net,
    monthlyNetSavings: monthly,
    breakEvenMonths: monthly > 0 ? buildCost / monthly : 'Never',
    year1RoiPct,
    suggestion: year1RoiPct < 0 ? -5 : year1RoiPct > 0 ? 5 : 0,
  };
}
