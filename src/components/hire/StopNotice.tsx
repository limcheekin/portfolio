import type { Assessment } from '../../lib/hire/types';
import { BTN_PRIMARY, BTN_SECONDARY, PANEL } from './styles';

/**
 * A Part 1 stop, shown on the screen where its answer was given. Focus mode keeps the score for the end, so it
 * passes `showVerdict={false}` and the notice heads the stop with "Stop" instead of the verdict.
 */
export default function StopNotice({ assessment, onResult, onContinue, showVerdict = true }: {
  assessment: Assessment;
  onResult: () => void;
  onContinue?: () => void;
  showVerdict?: boolean;
}) {
  return (
    <div className={`${PANEL} border-danger/50`} data-testid="hire-stop">
      <p className="font-mono text-lg font-semibold uppercase tracking-[0.06em] text-danger">{showVerdict ? assessment.verdict : 'Stop'}</p>
      <p className="mt-2 text-lightest-slate">{assessment.stop!.message}</p>
      {showVerdict && <p className="mt-1 text-sm text-slate-text">{assessment.meaning}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={BTN_PRIMARY} onClick={onResult} data-testid="hire-stop-result">See the result</button>
        {onContinue && (
          <button type="button" className={BTN_SECONDARY} onClick={onContinue} data-testid="hire-stop-finish">Finish the rest for the record</button>
        )}
      </div>
    </div>
  );
}
