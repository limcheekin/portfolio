import { useId, useState } from 'react';
import { FRAUD_CASE } from '../../../lib/hire/example';
import { decodeAnswers } from '../../../lib/hire/link';
import { TEXT_CAPS } from '../../../lib/hire/validate';
import { ChoiceGroup } from '../Question';
import Reading from '../Reading';
import { BTN_SECONDARY, BTN_TEXT, ERROR, FIELD, HINT, LABEL } from '../styles';
import { set, YES_NO, type StepProps } from './common';

/** The `#a=` code from a pasted report link, or the paste itself when it is only the code. */
function linkCode(paste: string): string {
  const s = paste.trim();
  const at = s.indexOf('#a=');
  return at >= 0 ? s.slice(at + 3) : s;
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

export default function StartStep({ answers, dispatch, go }: StepProps) {
  const id = useId();
  const [paste, setPaste] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  const loadExample = () => {
    dispatch({ type: 'load', answers: FRAUD_CASE });
    setStatus({ kind: 'ok', text: 'Loaded the fraud support agent case study as a pre-build assessment.' });
  };

  const loadLink = async () => {
    if (!paste.trim()) return;
    setBusy(true);
    const res = await decodeAnswers(linkCode(paste));
    setBusy(false);
    if (!res.ok) {
      setStatus({ kind: 'error', text: "This link can't be read. Nothing was loaded; check that you pasted the whole link." });
      return;
    }
    dispatch({ type: 'load', answers: res.answers });
    // A review re-scores today: the old link's date must not feed the 3-month rule.
    dispatch({ type: 'startReview' });
    setPaste('');
    setStatus({ kind: 'ok', text: "Loaded your original answers as a live review dated today. Check each step against what you know now." });
  };

  return (
    <div className="space-y-10">
      <div>
        <label htmlFor={`${id}-name`} className={LABEL}>Agent name</label>
        <input
          id={`${id}-name`}
          type="text"
          className={FIELD}
          maxLength={TEXT_CAPS.name}
          value={answers.name}
          onChange={(e) => set(dispatch, 'name')(e.target.value)}
          placeholder="e.g. Invoice triage agent"
          autoComplete="off"
          data-testid="hire-name"
        />
      </div>

      <ChoiceGroup
        testId="hire-live"
        legend="Is this agent already live?"
        hint="A live agent gets a review: the same checklist re-scored with what you know now, plus its live metrics and the FIRE criteria."
        choices={YES_NO('Yes, it is live: review it', 'No, we are deciding whether to build it')}
        columns
        value={answers.isLive}
        onChange={(live) => {
          if (live === answers.isLive) return;
          if (live) dispatch({ type: 'startReview' });
          else {
            set(dispatch, 'isLive')(false);
            set(dispatch, 'review')(undefined);
          }
        }}
      />

      {answers.isLive && (
        <div>
          <label htmlFor={`${id}-link`} className={LABEL}>Paste your original report link (optional)</label>
          <p id={`${id}-link-hint`} className={`mb-2 ${HINT}`}>Your earlier answers fill in; the review is dated today and its metrics start empty.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={`${id}-link`}
              type="url"
              inputMode="url"
              className={FIELD}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              aria-describedby={`${id}-link-hint`}
              placeholder="https://kin.rag.wtf/hire/#a=…"
              autoComplete="off"
              data-testid="hire-paste-link"
            />
            <button type="button" className={`${BTN_SECONDARY} shrink-0`} onClick={loadLink} disabled={busy || !paste.trim()} data-testid="hire-load-link">
              Load answers
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" className={BTN_SECONDARY} onClick={loadExample} data-testid="hire-load-example">Load example</button>
        <p className={`${HINT} flex flex-wrap items-center gap-2`}>
          The fraud support agent from the framework's case study, scored before it was built.
          <Reading k="exampleTraits" />
        </p>
      </div>

      <p role="status" className={status?.kind === 'error' ? ERROR.replace('mt-1.5 ', '') : 'font-mono text-xs text-green-accent'} data-testid="hire-start-status">
        {status?.text}
        {status?.kind === 'ok' && go && (
          <>
            {' '}
            <button type="button" className={`${BTN_TEXT} -my-3`} onClick={() => go('result')}>See the result</button>
          </>
        )}
      </p>

      <div className="border-t border-edge pt-6">
        <button
          type="button"
          className={BTN_TEXT}
          onClick={() => {
            dispatch({ type: 'reset' });
            setStatus(null);
          }}
          data-testid="hire-reset"
        >
          Start a new assessment
        </button>
      </div>
    </div>
  );
}
