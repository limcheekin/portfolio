// Interim views for the metrics and result steps; Task 11 replaces them with MetricsStep and Result.
import { THRESHOLDS } from '../../../lib/hire/checklist';
import { signed } from '../Rail';
import { HINT, PANEL, verdictBorder, verdictText } from '../styles';
import type { StepProps } from './common';

export function MetricsInterim() {
  return <p className={HINT}>The live metrics (UCR, PPR, DIY, IRR, RLR) and the FIRE criteria come next. Until then, the review re-scores the checklist.</p>;
}

const NAMES = { H: 'Human & Habits', I: 'Impact & Intent', E: 'Exposure & Execution' } as const;

export function ResultInterim({ assessment: a }: StepProps) {
  const s = a.scores;
  const open = (['h', 'i', 'e'] as const).filter((k) => !s.complete[k]).map((k) => NAMES[k.toUpperCase() as 'H' | 'I' | 'E']);
  return (
    <div className="space-y-6" data-testid="hire-result">
      <div className={`${PANEL} ${verdictBorder(a.verdict)}`}>
        <p className={`font-mono text-2xl font-semibold uppercase tracking-[0.06em] ${verdictText(a.verdict)}`} data-testid="hire-result-verdict">
          {a.verdict ?? 'Pending'}
        </p>
        <p className="mt-2 text-lightest-slate">
          <span className="text-3xl font-semibold tabular-nums">{signed(s.total)}</span>
          <span className="font-mono text-sm text-slate-text"> / {THRESHOLDS.ceiling}</span>
          <span className="ml-3 font-mono text-xs text-slate-text">H {signed(s.h)} · I {signed(s.i)} · E {signed(s.e)}</span>
        </p>
        {a.meaning && <p className="mt-3 text-light-slate">{a.meaning}</p>}
        {a.stop && <p className="mt-3 text-light-slate">{a.stop.message}</p>}
        {a.notAssessed.length > 0 && <p className={`mt-2 ${HINT}`}>Not assessed: {a.notAssessed.join(', ')}.</p>}
        {a.verdict === null && (
          <p className={`mt-3 ${HINT}`}>
            The score so far is the sum of the answered items. Answer the rest of {open.join(', ')} for a verdict.
          </p>
        )}
      </div>
      <p className={HINT}>Full result coming next: the reasons, red flags, path to HIRE, the report link and the PDF.</p>
    </div>
  );
}
