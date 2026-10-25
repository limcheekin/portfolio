import { useId } from 'react';
import { SIGN_OFF_ROLES } from '../../../lib/hire/checklist';
import type { Assessment, HireAnswers } from '../../../lib/hire/types';
import { TEXT_CAPS } from '../../../lib/hire/validate';
import Reading from '../Reading';
import type { Dispatch } from '../useHireState';
import { BTN_TEXT, FIELD, HINT, LABEL, verdictText } from '../styles';
import { Block } from './Findings';

const pad = (n: number) => String(n).padStart(2, '0');

/** `iso` plus `n` calendar months; a day past the new month's end becomes its last day (Nov 30 + 3 → Feb 28). */
function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return `${first.getUTCFullYear()}-${pad(first.getUTCMonth() + 1)}-${pad(Math.min(d, last))}`;
}

/** The checklist says to revisit in 3–6 months; the default is 3 months after the assessment date. */
export const defaultReviewDate = (a: HireAnswers) => addMonths(a.assessmentDate, 3);

/** The rationale the reasons generate, within its cap. */
export function generatedRationale(x: Assessment): string {
  const s = x.reasons.join(' ');
  const cap = TEXT_CAPS.rationale;
  return s.length <= cap ? s : `${s.slice(0, cap - 1).trimEnd()}…`;
}

/** The answers as the report prints them: a rationale or review date the user hasn't set takes its default. */
export function withDocDefaults(a: HireAnswers, x: Assessment): HireAnswers {
  const doc = { ...(a.doc ?? {}) };
  if (doc.rationale === undefined) doc.rationale = generatedRationale(x);
  if (doc.reviewDate === undefined) doc.reviewDate = defaultReviewDate(a);
  return { ...a, doc };
}

/** A capped text field whose counter appears near the cap. */
function Capped({ label, value, cap, onChange, rows, testId, describedBy }: {
  label: string;
  value: string;
  cap: number;
  onChange: (v: string) => void;
  rows?: number;
  testId: string;
  describedBy?: string;
}) {
  const id = useId();
  const near = value.length >= cap * 0.8;
  const describe = [describedBy, near ? `${id}-count` : undefined].filter(Boolean).join(' ') || undefined;
  const common = { id, className: FIELD, maxLength: cap, value, 'aria-describedby': describe, 'data-testid': testId, autoComplete: 'off' };
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LABEL}>{label}</label>
      {rows ? (
        <textarea {...common} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type="text" onChange={(e) => onChange(e.target.value)} />
      )}
      {near && (
        <p id={`${id}-count`} className={`mt-1 text-right font-mono text-[11px] ${value.length >= cap ? 'text-danger' : 'text-slate-text'}`}>
          {value.length} / {cap}
        </p>
      )}
    </div>
  );
}

/** The checklist's Documentation block and Stakeholder Sign-Off, written into the answers (and so the link). */
export default function Documentation({ answers, assessment, dispatch }: { answers: HireAnswers; assessment: Assessment; dispatch: Dispatch }) {
  const id = useId();
  const doc = answers.doc ?? {};
  const set = (path: string, value: unknown) => dispatch({ type: 'set', path: `doc.${path}`, value });
  const generated = generatedRationale(assessment);
  const edited = doc.rationale !== undefined;
  const reviewDate = doc.reviewDate ?? defaultReviewDate(answers);
  const d = assessment.decision;

  return (
    <Block title="Documentation" testId="result-doc">
      <div className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className={LABEL}>Agent name</dt>
            <dd className="break-words text-lightest-slate">{answers.name || <span className="text-slate-text">Not named (set it on Start)</span>}</dd>
          </div>
          <div className="min-w-0">
            <dt className={LABEL}>Decision</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span className={`font-mono font-semibold uppercase tracking-[0.06em] ${verdictText(d)}`} data-testid="result-decision">{d ?? 'Pending'}</span>
              {assessment.verdict === 'DO NOT BUILD' && <Reading k="preBuildFire" />}
            </dd>
          </div>
        </dl>

        <div>
          <Capped
            label="Rationale"
            value={doc.rationale ?? generated}
            cap={TEXT_CAPS.rationale}
            rows={5}
            onChange={(v) => set('rationale', v)}
            testId="doc-rationale"
            describedBy={`${id}-rat`}
          />
          <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4">
            <p id={`${id}-rat`} className="text-xs text-slate-text">
              {edited ? 'Your text.' : 'Generated from the reasons above; edit it freely.'}
            </p>
            {edited && (
              <button type="button" className={BTN_TEXT} onClick={() => set('rationale', undefined)} data-testid="doc-rationale-reset">
                Reset to generated
              </button>
            )}
          </div>
        </div>

        <Capped label="Next steps" value={doc.nextSteps ?? ''} cap={TEXT_CAPS.nextSteps} rows={3} onChange={(v) => set('nextSteps', v || undefined)} testId="doc-next" />

        <div className="sm:max-w-[16rem]">
          <label htmlFor={`${id}-review`} className={LABEL}>Review date</label>
          <input
            id={`${id}-review`}
            type="date"
            className={FIELD}
            value={reviewDate}
            min={answers.assessmentDate}
            onChange={(e) => set('reviewDate', e.target.value || undefined)}
            aria-describedby={`${id}-review-hint`}
            data-testid="doc-review-date"
          />
          <p id={`${id}-review-hint`} className="mt-1 text-xs text-slate-text">
            {doc.reviewDate ? 'Your date.' : 'Default: 3 months after the assessment date.'} Revisit this decision in 3-6 months.
          </p>
        </div>

        <fieldset className="min-w-0">
          <legend className="mb-1 text-base text-lightest-slate">Stakeholder sign-off</legend>
          <p className={`mb-4 ${HINT}`}>Before proceeding, ensure alignment across teams. Names are optional.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SIGN_OFF_ROLES.map((r) => (
              <Capped
                key={r.key}
                label={r.label}
                value={doc.signOff?.[r.key] ?? ''}
                cap={TEXT_CAPS.signOffName}
                onChange={(v) => set(`signOff.${r.key}`, v || undefined)}
                testId={`doc-sign-${r.key}`}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Block>
  );
}
