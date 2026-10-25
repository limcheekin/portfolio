import { useId } from 'react';
import { METRIC_DEFS } from '../../../lib/hire/checklist';
import { monthsBetween } from '../../../lib/hire/live';
import type { HireAnswers, MetricKey } from '../../../lib/hire/types';
import { blankReview } from '../useHireState';
import MetricMeter from '../MetricMeter';
import { fmtRate, KEYS, limitError, sampleError, SHORT, unitOf, valueError } from '../metric-ranges';
import NumberField from '../NumberField';
import { ChoiceGroup } from '../Question';
import Reading from '../Reading';
import { BTN_TEXT, FIELD, HINT, LABEL, PANEL } from '../styles';
import { Group, Suggestion, YES_NO, type StepProps } from './common';

type Review = NonNullable<HireAnswers['review']>;

const NOTE = 'rounded-lg border border-edge bg-well px-4 py-3 text-sm leading-relaxed text-light-slate';

/** One rate: this period (blank = not measured), the previous period, its sample size and an optional tighter limit. */
function Rate({ k, review, dispatch }: { k: MetricKey; review: Review; dispatch: StepProps['dispatch'] }) {
  const id = useId();
  const def = METRIC_DEFS[k];
  const m = review.metrics[k];
  const base = `review.metrics.${k}`;
  const put = (field: 'previous' | 'sample' | 'limit') => (v: number | undefined) => dispatch({ type: 'set', path: `${base}.${field}`, value: v });
  const unit = unitOf(k);
  const measured = m.value !== null && m.value !== undefined;
  const sampleNoun = def.denominator.split(' (')[0];

  return (
    <fieldset className={`${PANEL} min-w-0 space-y-5`} data-testid={`metric-${k}`} aria-describedby={`${id}-denom`}>
      <legend className="sr-only">{def.name}</legend>
      <div>
        <h4 className="text-base font-semibold text-lightest-slate" aria-hidden="true">{def.name}</h4>
        <p className={`mt-1 ${HINT}`}>{def.question}.</p>
        <p id={`${id}-denom`} className="mt-1 font-mono text-xs text-slate-text">
          Rate of: <span className="text-light-slate">{def.denominator}</span>
        </p>
      </div>

      <MetricMeter k={k} value={m.value} limit={k === 'rlr' ? null : m.limit} />

      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField
          label="This period"
          value={m.value}
          onChange={(v) => dispatch({ type: 'set', path: `${base}.value`, value: v ?? null })}
          suffix={unit}
          check={(n) => valueError(k, n)}
          hint={measured ? undefined : 'Blank means not measured (never 0).'}
          testId={`metric-${k}-value`}
        />
        <NumberField label="Previous period" value={m.previous} onChange={put('previous')} suffix={unit} check={(n) => valueError(k, n)} testId={`metric-${k}-previous`} />
        <NumberField label={`Sample size (${sampleNoun})`} value={m.sample} onChange={put('sample')} check={sampleError} testId={`metric-${k}-sample`} />
      </div>

      {measured && (
        <button type="button" className={`${BTN_TEXT} -my-2`} onClick={() => dispatch({ type: 'set', path: `${base}.value`, value: null })}>
          Mark {SHORT[k]} as not measured
        </button>
      )}

      {k === 'ucr' && m.value === 0 && (
        <p className={NOTE} data-testid="hint-ucr-zero">
          A UCR of 0% is not a clean bill of health on its own. A correction is an LLM label, so a rules-only pipeline
          reports 0.0% because nothing labels corrections. Check that corrections are recorded before you rely on it.
        </p>
      )}
      {k === 'rlr' && m.value != null && m.value > 0 && m.value <= 1 && (
        <p className={NOTE} data-testid="hint-rlr-band">
          RLR is in the metrics guide's Warning band, but the checklist treats any red line as FIRE.{' '}
          <Reading k="rlrBand" />
        </p>
      )}

      {k === 'rlr' ? (
        <p className={HINT}>RLR takes no custom limit: any red line above 0% is FIRE, the one threshold not to relax.</p>
      ) : (
        <NumberField
          className="sm:max-w-[16rem]"
          label="Tighter FIRE limit (optional)"
          value={m.limit}
          onChange={put('limit')}
          suffix={unit}
          check={(n) => limitError(k, n)}
          hint={`Default: the Critical band (${k === 'irr' ? 'below ' : 'above '}${fmtRate(k, { ucr: 30, ppr: 2, diy: 15, irr: 40 }[k])}).`}
          testId={`metric-${k}-limit`}
        />
      )}
      {k === 'ppr' && <p className={`${HINT} flex flex-wrap items-center gap-2`}>PPR above its limit is FIRE only while IRR is falling, so give IRR's previous period too. <Reading k="pprTrend" /></p>}
    </fieldset>
  );
}

/** Live review: the five rates, the launch date and the checklist's two remaining FIRE criteria. */
export default function MetricsStep({ answers, dispatch, assessment }: StepProps) {
  const id = useId();
  const review = answers.review ?? blankReview();
  const live = assessment.live;
  const months = review.launchDate ? monthsBetween(review.launchDate, answers.assessmentDate) : null;
  const f = answers.i.figures;
  const costly = f?.annualMaintenanceCost !== undefined && f?.expectedAnnualSavings !== undefined && f.annualMaintenanceCost > f.expectedAnnualSavings;
  const cur = f?.currency ? `${f.currency} ` : '';
  const money = (n: number) => `${cur}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-12">
      <Group title="Dates">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={`${id}-launch`} className={LABEL}>Launch date</label>
            <input
              id={`${id}-launch`}
              type="date"
              className={FIELD}
              value={review.launchDate ?? ''}
              max={answers.assessmentDate}
              onChange={(e) => dispatch({ type: 'set', path: 'review.launchDate', value: e.target.value || null })}
              aria-describedby={`${id}-launch-hint`}
              data-testid="metric-launch"
            />
          </div>
          <div className="min-w-0">
            <p className={LABEL}>Assessment date</p>
            <p className="py-2.5 font-mono text-sm text-lightest-slate" data-testid="metric-assessment-date">{answers.assessmentDate}</p>
          </div>
        </div>
        <p id={`${id}-launch-hint`} className={`${HINT} flex flex-wrap items-center gap-2`}>
          {months === null
            ? 'Without a launch date, a DIY rate above its limit cannot count as FIRE.'
            : months < 0
              ? 'The launch date is after the assessment date: check it.'
              : `Live for ${months} month${months === 1 ? '' : 's'}. DIY above its limit counts as FIRE from 3 months.`}
          <Reading k="diyMonths" />
        </p>
      </Group>

      <Group
        title="The five rates"
        intro={
          <span className="flex flex-wrap items-center gap-2">
            Each rate starts as not measured. Fill in what you track; a blank rate never counts as 0. Sample sizes are
            shown in the report and never change the verdict. <Reading k="sampleSize" />
          </span>
        }
      >
        {KEYS.map((k) => <Rate key={k} k={k} review={review} dispatch={dispatch} />)}
      </Group>

      <Group title="Cost and alternatives">
        {costly && (
          <Suggestion
            testId="hire-maintenance-suggestion"
            applied={review.maintenanceExceedsValue === true}
            onUse={() => dispatch({ type: 'set', path: 'review.maintenanceExceedsValue', value: true })}
          >
            Your ROI figures put maintenance ({money(f!.annualMaintenanceCost!)}/year) above the expected savings
            ({money(f!.expectedAnnualSavings!)}/year). Suggests <strong className="text-lightest-slate">Yes</strong>.
          </Suggestion>
        )}
        <ChoiceGroup
          testId="metric-maintenance"
          legend="Maintenance costs exceed value delivered?"
          choices={YES_NO('Yes', 'No')}
          columns
          value={review.maintenanceExceedsValue}
          onChange={(v) => dispatch({ type: 'set', path: 'review.maintenanceExceedsValue', value: v })}
        />
        <ChoiceGroup
          testId="metric-better"
          legend="A better solution is available?"
          choices={YES_NO('Yes', 'No')}
          columns
          value={review.betterSolution}
          onChange={(v) => dispatch({ type: 'set', path: 'review.betterSolution', value: v })}
        />
      </Group>

      {live && (
        <div className={`${PANEL} ${live.fire.length ? 'border-danger/50' : ''}`} data-testid="metric-fire-summary" aria-live="polite">
          {live.fire.length ? (
            <>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-danger">FIRE criteria met</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-lightest-slate">
                {live.fire.map((x) => <li key={x.key}>{x.text}</li>)}
              </ul>
              <p className={`mt-2 ${HINT}`}>Any one of these makes the verdict FIRE once the checklist is answered.</p>
            </>
          ) : (
            <p className={HINT}>No FIRE criterion is met by what you have entered so far.</p>
          )}
          {live.unmeasured.length > 0 && (
            <p className="mt-2 font-mono text-xs text-slate-text">Not measured: {live.unmeasured.map((k) => SHORT[k]).join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}
