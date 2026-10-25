import { metricBand, type Band } from '../../lib/hire/live';
import type { MetricKey } from '../../lib/hire/types';
import { fmtRate, limitError, SCALE, SHORT } from './metric-ranges';

// Band inks. Amber is reserved for the TRAIN verdict and coral for errors and FIRE, so Warning stays neutral and
// Critical (the band the checklist fires on) takes coral; the band is always written out, never colour alone.
const ZONE: Record<Band, string> = { Good: 'bg-green-accent/25', Warning: 'bg-light-slate/25', Critical: 'bg-danger/25' };
const MARK: Record<Band, string> = { Good: 'bg-green-accent', Warning: 'bg-lightest-slate', Critical: 'bg-danger' };
const INK: Record<Band, string> = { Good: 'text-green-accent', Warning: 'text-lightest-slate', Critical: 'text-danger' };

/**
 * One live rate on its scale, with the metrics guide's Good / Warning / Critical zones and, when set, the user's
 * tighter FIRE limit. Static: nothing here animates.
 */
export default function MetricMeter({ k, value, limit, className = '' }: {
  k: MetricKey;
  value: number | null | undefined;
  limit?: number | null;
  className?: string;
}) {
  const { min, max, zones } = SCALE[k];
  const pct = (n: number) => ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * 100;
  const measured = value !== null && value !== undefined;
  const band = measured ? metricBand(k, value) : null;
  const ownLimit = k !== 'rlr' && limit != null && limitError(k, limit) === null ? limit : null;
  let from = min;
  const label = measured
    ? `${SHORT[k]} ${fmtRate(k, value)}: ${band}${ownLimit !== null ? `; your limit ${fmtRate(k, ownLimit)}` : ''}`
    : `${SHORT[k]}: not measured`;

  return (
    <div className={`min-w-0 ${className}`} data-testid={`meter-${k}`} data-band={band ?? 'not measured'}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-xs">
        <span className="text-light-slate">{SHORT[k]}</span>
        {measured ? (
          <span>
            <span className="tabular-nums text-lightest-slate">{fmtRate(k, value)}</span>
            <span className="text-slate-text"> · </span>
            <span className={INK[band!]} data-testid={`meter-${k}-band`}>{band}</span>
          </span>
        ) : (
          <span className="text-slate-text" data-testid={`meter-${k}-band`}>Not measured</span>
        )}
      </div>
      <div role="img" aria-label={label} className="relative mt-2 h-2 rounded-full bg-well">
        <div className={`absolute inset-0 flex overflow-hidden rounded-full ${measured ? '' : 'opacity-40'}`} aria-hidden="true">
          {zones.map((z) => {
            const w = ((z.to - from) / (max - min)) * 100;
            from = z.to;
            return <span key={z.band} className={`h-full ${ZONE[z.band]}`} style={{ width: `${w}%` }} />;
          })}
        </div>
        {ownLimit !== null && (
          <span
            aria-hidden="true"
            className="absolute -top-1 h-4 w-0 -translate-x-1/2 border-l border-dashed border-light-slate"
            style={{ left: `${pct(ownLimit)}%` }}
          />
        )}
        {measured && (
          <span
            aria-hidden="true"
            className={`absolute -top-1.5 h-5 w-1 -translate-x-1/2 rounded-full ring-2 ring-card ${MARK[band!]}`}
            style={{ left: `${pct(value)}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-text" aria-hidden="true">
        <span>{k === 'ppr' ? '1.0' : '0'}</span>
        {ownLimit !== null && <span>limit {fmtRate(k, ownLimit)}</span>}
        <span>{k === 'ppr' || k === 'rlr' ? `${max}+` : max}</span>
      </div>
    </div>
  );
}
