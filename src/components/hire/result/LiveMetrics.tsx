import { METRIC_KEYS } from '../../../lib/hire/checklist';
import { monthsBetween } from '../../../lib/hire/live';
import type { Assessment, HireAnswers } from '../../../lib/hire/types';
import MetricMeter from '../MetricMeter';
import { HINT } from '../styles';
import { Block } from './Findings';

const LIST = 'm-0 list-disc space-y-2 pl-5 text-sm leading-relaxed text-light-slate marker:text-slate-text';

/** The live review: each rate on its meter, the FIRE criteria met, watch items and metric pairs. */
export default function LiveMetrics({ answers, assessment }: { answers: HireAnswers; assessment: Assessment }) {
  const live = assessment.live;
  const review = answers.review;
  if (!live || !review) return null;
  const months = review.launchDate ? monthsBetween(review.launchDate, answers.assessmentDate) : null;
  return (
    <div className="space-y-10" data-testid="result-live">
      <Block title="Live metrics">
        <p className={`mb-4 ${HINT}`}>
          {review.launchDate ? `Launched ${review.launchDate}` : 'No launch date'} · assessed {answers.assessmentDate}
          {months !== null && months >= 0 ? ` · ${months} month${months === 1 ? '' : 's'} live` : ''}
        </p>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {METRIC_KEYS.map((k) => (
            <MetricMeter key={k} k={k} value={review.metrics[k].value} limit={k === 'rlr' ? null : review.metrics[k].limit} />
          ))}
        </div>
      </Block>

      <Block title="FIRE criteria" testId="result-fire">
        {live.fire.length ? (
          <ul className={LIST}>{live.fire.map((f) => <li key={f.key} className="text-lightest-slate">{f.text}</li>)}</ul>
        ) : (
          <p className={HINT}>None met by the measured rates and answers.</p>
        )}
      </Block>

      {live.watch.length > 0 && (
        <Block title="Watch items" reading="watch" testId="result-watch">
          <ul className={LIST}>{live.watch.map((w) => <li key={w}>{w}</li>)}</ul>
        </Block>
      )}

      {live.pairs.length > 0 && (
        <Block title="Metric pairs" reading="pairs" testId="result-pairs">
          <ul className={LIST}>{live.pairs.map((p) => <li key={p}>{p}</li>)}</ul>
        </Block>
      )}
    </div>
  );
}
