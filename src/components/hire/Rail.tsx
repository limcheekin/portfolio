import { useId } from 'react';
import { THRESHOLDS, type FlowStep } from '../../lib/hire/checklist';
import { SECTION_RANGE } from '../../lib/hire/score';
import type { Assessment } from '../../lib/hire/types';
import ScoreGauge from './ScoreGauge';
import { points, verdictBorder, verdictText } from './styles';

const CEIL = THRESHOLDS.ceiling;
const PART_LABEL: Record<number, string> = { 1: 'Part 1 · Should this exist?', 2: 'Live review', 3: 'Part 2 · How ready is it?' };

/** "−12" with a true minus sign; positive totals print bare. */
export const signed = (n: number) => (n < 0 ? points(n) : String(n));

export function gaugeLabel(a: Assessment): string {
  return `Score ${signed(a.scores.total)} of ${CEIL}, ${a.verdict ?? 'pending'}`;
}

interface RailProps {
  steps: FlowStep[];
  current: string;
  done: Record<string, boolean>;
  assessment: Assessment;
  onGo: (id: string) => void;
}

function VerdictLine({ assessment, className = '' }: { assessment: Assessment; className?: string }) {
  const v = assessment.verdict;
  return (
    <p role="status" aria-live="polite" className={`font-mono text-sm font-semibold uppercase tracking-[0.08em] ${verdictText(v)} ${className}`} data-testid="hire-verdict">
      <span className="sr-only">Verdict: </span>
      {v ?? 'Pending'}
    </p>
  );
}

/** The side rail from `md` up: the score gauge, the running verdict and the steps by their H/I/R/E letter. */
export default function Rail({ steps, current, done, assessment, onGo }: RailProps) {
  const s = assessment.scores;
  const sections = [
    { k: 'H', v: s.h, max: SECTION_RANGE.h[1], ok: s.complete.h },
    { k: 'I', v: s.i, max: SECTION_RANGE.i[1], ok: s.complete.i },
    { k: 'E', v: s.e, max: SECTION_RANGE.e[1], ok: s.complete.e },
  ];
  let lastPart = 0;
  return (
    <aside className="sticky top-28 space-y-6 self-start" aria-label="Score and steps">
      <div className={`rounded-xl border bg-card p-4 ${verdictBorder(assessment.verdict)}`} data-testid="hire-rail-score">
        <ScoreGauge total={s.total} verdict={assessment.verdict} label={gaugeLabel(assessment)} className="mx-auto block w-full max-w-[13rem]" />
        <p className="mt-1 text-center text-lightest-slate" aria-hidden="true">
          <span className="text-3xl font-semibold tabular-nums" data-testid="hire-total">{signed(s.total)}</span>
          <span className="font-mono text-sm text-slate-text"> / {CEIL}</span>
        </p>
        <VerdictLine assessment={assessment} className="mt-1 text-center" />
        {assessment.verdict === null && <p className="mt-1 text-center font-mono text-[11px] text-slate-text">sum of the answered items</p>}
        <dl className="mt-4 grid grid-cols-3 gap-1 border-t border-edge pt-3 text-center font-mono text-xs">
          {sections.map((x) => (
            <div key={x.k}>
              <dt className="text-slate-text">{x.k}</dt>
              <dd className={`tabular-nums ${x.ok ? 'text-lightest-slate' : 'text-slate-text'}`}>
                {signed(x.v)}<span className="text-slate-text">/{x.max}</span>
                {!x.ok && <span className="sr-only"> (incomplete)</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <nav aria-label="Assessment steps">
        <ol className="m-0 list-none space-y-0.5 p-0">
          {steps.map((st) => {
            const head = st.part !== lastPart && PART_LABEL[st.part];
            lastPart = st.part;
            const here = st.id === current;
            return (
              <li key={st.id}>
                {head && <p className="mb-1 mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-text">{head}</p>}
                <button
                  type="button"
                  onClick={() => onGo(st.id)}
                  aria-current={here ? 'step' : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm transition-colors duration-250 ${here ? 'bg-light-graphite text-lightest-slate' : 'text-light-slate hover:bg-graphite hover:text-lightest-slate'}`}
                  data-testid={`rail-${st.id}`}
                >
                  <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-md border font-mono text-xs ${here ? 'border-green-accent text-green-accent' : 'border-edge text-slate-text'}`}>
                    {st.letter}
                  </span>
                  <span className="min-w-0 flex-1">{st.title}</span>
                  {done[st.id] && (
                    <>
                      <span aria-hidden="true" className="font-mono text-xs text-green-accent">✓</span>
                      <span className="sr-only">, answered</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}

/** Below `md` the rail collapses to this sticky score bar, with the steps in a native select. */
export function ScoreBar({ steps, current, assessment, onGo, className = '' }: Omit<RailProps, 'done'> & { className?: string }) {
  const id = useId();
  const v = assessment.verdict;
  return (
    <div className={`sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-3 rounded-t-xl border border-b-0 bg-graphite px-4 py-2 ${verdictBorder(v)} ${className}`} data-testid="hire-score-bar">
      <div className="min-w-0 leading-tight">
        <span className="text-xl font-semibold tabular-nums text-lightest-slate" role="img" aria-label={gaugeLabel(assessment)}>
          <span aria-hidden="true">{signed(assessment.scores.total)}</span>
          <span aria-hidden="true" className="font-mono text-xs text-slate-text">/{CEIL}</span>
        </span>
        <VerdictLine assessment={assessment} className="text-[11px]" />
      </div>
      <div className="min-w-0">
        <label htmlFor={`${id}-step`} className="sr-only">Step</label>
        <select
          id={`${id}-step`}
          value={current}
          onChange={(e) => onGo(e.target.value)}
          className="min-h-11 w-full max-w-[12rem] rounded border border-edge bg-card px-2 text-sm text-lightest-slate focus:border-green-accent focus:outline-none"
        >
          {steps.map((st, n) => (
            <option key={st.id} value={st.id}>{`${n + 1}. ${st.letter === '·' ? '' : `${st.letter} · `}${st.title}`}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
