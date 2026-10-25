import { useId } from 'react';
import { I_ITEMS } from '../../../lib/hire/checklist';
import { roi, timeSaved } from '../../../lib/hire/helpers';
import type { HireAnswers, NA } from '../../../lib/hire/types';
import NumberField from '../NumberField';
import Question from '../Question';
import Reading from '../Reading';
import { FIELD, HINT, LABEL } from '../styles';
import { Group, set, Suggestion, type StepProps } from './common';

type Figures = NonNullable<HireAnswers['i']['figures']>;
type FigureKey = 'current' | 'expected' | 'buildCost' | 'annualMaintenanceCost' | 'expectedAnnualSavings';

const item = (key: string) => I_ITEMS.find((x) => x.key === key)!;
const optionLabel = (key: string, v: number) => item(key).options.find((o) => o.value === v)?.label ?? String(v);
const fmt = (n: number, digits = 1) => n.toLocaleString('en-US', { maximumFractionDigits: digits });

/** Part 2, I · Impact & Intent: frequency, time savings and ROI (with their helpers), strategic value. */
export default function ImpactStep({ answers, dispatch }: StepProps) {
  const id = useId();
  const i = answers.i;
  const f: Figures = i.figures ?? {};
  const fig = (k: FigureKey) => (v: number | undefined) => dispatch({ type: 'set', path: `i.figures.${k}`, value: v });
  const unit = f.unit ?? 'minutes';
  const cur = f.currency ? `${f.currency} ` : '';
  const ts = timeSaved(f.current, f.expected);
  const ro = roi(f.buildCost, f.annualMaintenanceCost, f.expectedAnnualSavings);
  const score = (key: string) => set(dispatch, `i.${key}`) as (v: number | NA) => void;

  return (
    <div className="space-y-12">
      <Question item={item('frequency')} value={i.frequency} onChange={score('frequency')} />

      <Group title="Time savings">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
          <div className="min-w-0">
            <label htmlFor={`${id}-unit`} className={LABEL}>Unit</label>
            <select
              id={`${id}-unit`}
              className={FIELD}
              value={unit}
              onChange={(e) => dispatch({ type: 'set', path: 'i.figures.unit', value: e.target.value })}
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
          <NumberField label="Current time to resolve" value={f.current} onChange={fig('current')} suffix={unit} />
          <NumberField label="Expected time with agent" value={f.expected} onChange={fig('expected')} suffix={unit} />
        </div>
        {ts ? (
          <Suggestion testId="hire-time-suggestion" applied={i.timeSavings === ts.suggestion} onUse={() => dispatch({ type: 'set', path: 'i.timeSavings', value: ts.suggestion })}>
            Time saved per process: <strong className="text-lightest-slate">{fmt(ts.savedPerProcess, 2)} {unit}</strong> ({fmt(ts.savedPct)}%).
            {' '}Suggests <strong className="text-lightest-slate">{ts.suggestion}: {optionLabel('timeSavings', ts.suggestion)}</strong>.{' '}
            <Reading k="timeBands" />
          </Suggestion>
        ) : (
          <p className={HINT}>Fill in both times for a suggested score; you can always pick your own.</p>
        )}
        <Question item={item('timeSavings')} value={i.timeSavings} onChange={score('timeSavings')} />
      </Group>

      <Group title="ROI">
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <NumberField label="Engineering cost to build" value={f.buildCost} onChange={fig('buildCost')} />
          <NumberField label="Ongoing maintenance cost (/year)" value={f.annualMaintenanceCost} onChange={fig('annualMaintenanceCost')} suffix="/year" />
          <NumberField label="Expected annual savings" value={f.expectedAnnualSavings} onChange={fig('expectedAnnualSavings')} suffix="/year" />
          <div className="min-w-0">
            <label htmlFor={`${id}-cur`} className={LABEL}>Currency (a label, optional)</label>
            <input
              id={`${id}-cur`}
              type="text"
              className={FIELD}
              maxLength={8}
              value={f.currency ?? ''}
              placeholder="e.g. USD"
              onChange={(e) => dispatch({ type: 'set', path: 'i.figures.currency', value: e.target.value || undefined })}
            />
          </div>
        </div>
        {ro ? (
          <Suggestion testId="hire-roi-suggestion" applied={i.roi === ro.suggestion} onUse={() => dispatch({ type: 'set', path: 'i.roi', value: ro.suggestion })}>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Year-1 ROI: <strong className="text-lightest-slate">{fmt(ro.year1RoiPct)}%</strong></span>
              <span aria-hidden="true">·</span>
              <span>
                Break-even:{' '}
                <strong className="text-lightest-slate">{ro.breakEvenMonths === 'Never' ? 'Never' : `${fmt(ro.breakEvenMonths)} months`}</strong>
              </span>
              <Reading k="roiHorizon" />
            </span>
            <span className="mt-1 block">
              Net savings {cur}{fmt(ro.netAnnualSavings, 0)}/year. Suggests{' '}
              <strong className="text-lightest-slate">{ro.suggestion > 0 ? '+5' : ro.suggestion < 0 ? '−5' : '0'}: {optionLabel('roi', ro.suggestion)}</strong>.
            </span>
          </Suggestion>
        ) : (
          <p className={HINT}>Fill in the build cost and the expected annual savings for a suggested score.</p>
        )}
        <Question item={item('roi')} value={i.roi} onChange={score('roi')} signed />
      </Group>

      <Question item={item('strategicValue')} value={i.strategicValue} onChange={score('strategicValue')} />
    </div>
  );
}
