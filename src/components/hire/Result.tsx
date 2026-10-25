import { useMemo } from 'react';
import PdfButton from './PdfButton';
import ShareLink from './ShareLink';
import Documentation, { withDocDefaults } from './result/Documentation';
import Findings from './result/Findings';
import LiveMetrics from './result/LiveMetrics';
import Verdict from './result/Verdict';
import { scoringAnswers } from './useHireState';
import { PANEL } from './styles';
import type { StepProps } from './steps/common';

/**
 * The result step: the verdict and its reasons, the live review when there is one, the report link and PDF, and
 * the checklist's documentation block. Presentational parts live in `./result/`.
 */
export default function Result({ answers, dispatch, assessment }: StepProps) {
  // The link and the report use the scored answers (a half-typed N/A counts as unanswered), as the page's own link does.
  const scored = useMemo(() => scoringAnswers(answers), [answers]);
  const report = useMemo(() => withDocDefaults(scored, assessment), [scored, assessment]);
  return (
    <div className="space-y-12" data-testid="hire-result">
      <Verdict assessment={assessment} isLive={answers.isLive} />

      <div className={`${PANEL} space-y-6`} data-testid="hire-report">
        <div>
          <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-green-accent">Report</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-text">
            The PDF is built in this browser from your answers: the verdict, why, every answer and the sign-off block.
          </p>
        </div>
        <PdfButton answers={report} assessment={assessment} />
        <ShareLink answers={scored} />
      </div>

      <LiveMetrics answers={scored} assessment={assessment} />
      <Findings assessment={assessment} />
      <Documentation answers={answers} assessment={assessment} dispatch={dispatch} />
    </div>
  );
}
