import { useId } from 'react';
import { I_GATES, KPI_SUGGESTIONS } from '../../../lib/hire/checklist';
import { MAX_KPIS, TEXT_CAPS } from '../../../lib/hire/validate';
import { ChoiceGroup } from '../Question';
import { BTN_TEXT, CHIP_BUTTON, ERROR, FIELD, HINT, LABEL } from '../styles';
import { Group, set, YES_NO, type StepProps } from './common';

type Kpi = { name: string; target: string };
const BLANK_ROWS = 3;
const blank = (): Kpi => ({ name: '', target: '' });

/** I · Intent check: the Need vs. Hype gate and, when the need is clear, the business problem. */
export function IntentCheck({ answers, dispatch }: StepProps) {
  const id = useId();
  const p1 = answers.part1;
  return (
    <Group title="Intent check">
      <ChoiceGroup
        testId="q-canStateBusinessProblem"
        legend={<><strong className="font-semibold">{I_GATES.intent.label}</strong>: {I_GATES.intent.question}</>}
        hint={I_GATES.intent.stop}
        choices={YES_NO('A clear business need: we can state the problem', "We can't state the business problem")}
        value={p1.canStateBusinessProblem}
        onChange={set(dispatch, 'part1.canStateBusinessProblem')}
      />
      {p1.canStateBusinessProblem === true && (
        <div>
          <label htmlFor={`${id}-problem`} className={LABEL}>The business problem (optional)</label>
          <textarea
            id={`${id}-problem`}
            rows={3}
            className={`${FIELD} resize-y`}
            maxLength={TEXT_CAPS.businessProblem}
            value={p1.businessProblem ?? ''}
            onChange={(e) => set(dispatch, 'part1.businessProblem')(e.target.value)}
          />
        </div>
      )}
    </Group>
  );
}

/** I · Job description exercise: the Role Definition and Performance Review gate, the job and its KPIs. */
export function JobExercise({ answers, dispatch }: StepProps) {
  const id = useId();
  const p1 = answers.part1;
  const rows: Kpi[] = p1.kpis ?? Array.from({ length: BLANK_ROWS }, blank);
  const setRows: (next: Kpi[]) => void = set(dispatch, 'part1.kpis');
  const named = rows.some((r) => r.name.trim() !== '');
  const used = new Set(rows.map((r) => r.name.trim()));

  const suggest = (s: (typeof KPI_SUGGESTIONS)[number]) => {
    const at = rows.findIndex((r) => r.name.trim() === '' && r.target.trim() === '');
    if (at >= 0) setRows(rows.map((r, n) => (n === at ? { name: s.name, target: s.target } : r)));
    else if (rows.length < MAX_KPIS) setRows([...rows, { name: s.name, target: s.target }]);
  };

  return (
    <Group title="Job description exercise">
      <ChoiceGroup
        testId="q-canDefineJobAndKpis"
        legend={
          <>
            <strong className="font-semibold">{I_GATES.role.label}</strong>: {I_GATES.role.question}{' '}
            <strong className="font-semibold">{I_GATES.review.label}</strong>: {I_GATES.review.question}
          </>
        }
        hint={I_GATES.jobStop}
        choices={YES_NO('Yes: we can write the job description and its KPIs', "We can't define the job and its metrics of success")}
        value={p1.canDefineJobAndKpis}
        onChange={set(dispatch, 'part1.canDefineJobAndKpis')}
      />

      {p1.canDefineJobAndKpis === true && (
        <>
          <div className="grid gap-5">
            <div>
              <label htmlFor={`${id}-title`} className={LABEL}>Title</label>
              <input
                id={`${id}-title`}
                type="text"
                className={FIELD}
                maxLength={TEXT_CAPS.jobTitle}
                value={p1.job?.title ?? ''}
                onChange={(e) => set(dispatch, 'part1.job.title')(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${id}-resp`} className={LABEL}>Key Responsibilities</label>
              <textarea
                id={`${id}-resp`}
                rows={3}
                className={`${FIELD} resize-y`}
                maxLength={TEXT_CAPS.responsibilities}
                value={p1.job?.responsibilities ?? ''}
                onChange={(e) => set(dispatch, 'part1.job.responsibilities')(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={`${id}-bound`} className={LABEL}>Boundaries (what it CANNOT do)</label>
              <textarea
                id={`${id}-bound`}
                rows={3}
                className={`${FIELD} resize-y`}
                maxLength={TEXT_CAPS.boundaries}
                value={p1.job?.boundaries ?? ''}
                onChange={(e) => set(dispatch, 'part1.job.boundaries')(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="min-w-0" aria-describedby={`${id}-kpi-hint`} data-testid="hire-kpis">
            <legend className="mb-2 text-base text-lightest-slate">KPIs and their targets</legend>
            <p id={`${id}-kpi-hint`} className={`mb-3 ${HINT}`}>
              At least one, up to {MAX_KPIS}. One click fills a row with a metric and the metrics guide's Good band:
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {KPI_SUGGESTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={CHIP_BUTTON}
                  onClick={() => suggest(s)}
                  disabled={used.has(s.name) || (rows.every((r) => r.name.trim() || r.target.trim()) && rows.length >= MAX_KPIS)}
                  data-testid={`kpi-suggest-${s.key}`}
                >
                  {s.target}
                </button>
              ))}
            </div>
            <ol className="m-0 list-none space-y-3 p-0">
              {rows.map((r, n) => (
                <li key={n} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)_auto] sm:items-end">
                  <div>
                    <label htmlFor={`${id}-kpi-${n}`} className={LABEL}>KPI {n + 1}</label>
                    <input
                      id={`${id}-kpi-${n}`}
                      type="text"
                      className={FIELD}
                      maxLength={TEXT_CAPS.kpiName}
                      value={r.name}
                      onChange={(e) => setRows(rows.map((x, m) => (m === n ? { ...x, name: e.target.value } : x)))}
                    />
                  </div>
                  <div>
                    <label htmlFor={`${id}-target-${n}`} className={LABEL}>Target</label>
                    <input
                      id={`${id}-target-${n}`}
                      type="text"
                      className={FIELD}
                      maxLength={TEXT_CAPS.kpiTarget}
                      value={r.target}
                      onChange={(e) => setRows(rows.map((x, m) => (m === n ? { ...x, target: e.target.value } : x)))}
                    />
                  </div>
                  {rows.length > 1 ? (
                    <button type="button" className={`${BTN_TEXT} justify-self-start`} onClick={() => setRows(rows.filter((_, m) => m !== n))}>
                      Remove<span className="sr-only"> KPI {n + 1}</span>
                    </button>
                  ) : <span />}
                </li>
              ))}
            </ol>
            {rows.length < MAX_KPIS && (
              <button type="button" className={`${BTN_TEXT} mt-2`} onClick={() => setRows([...rows, blank()])}>Add a KPI</button>
            )}
            {!named && <p className={ERROR}>Name at least one KPI: the job needs a measure of success.</p>}
          </fieldset>
        </>
      )}
    </Group>
  );
}

/** Part 1, I · The job: the two STOP gates, the job description and the KPIs. */
export default function JobStep(props: StepProps) {
  return (
    <div className="space-y-12">
      <IntentCheck {...props} />
      <JobExercise {...props} />
    </div>
  );
}
