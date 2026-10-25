import { THRESHOLDS } from '../../../lib/hire/checklist';
import type { Assessment, Verdict as V } from '../../../lib/hire/types';
import { signed } from '../Rail';
import { HINT, PANEL, verdictBorder, verdictText } from '../styles';

const NAMES = { h: 'Human & Habits', i: 'Impact & Intent', e: 'Exposure & Execution' } as const;
// Each section's floor and ceiling, from the checklist's option values (E includes the worst case).
const RANGE = { h: [7, 21], i: [-2, 17], e: [-60, 39] } as const;

const PILL_TINT: Record<V, string> = {
  HIRE: 'bg-green-tint',
  TRAIN: 'bg-amber/10',
  'DO NOT BUILD': 'bg-danger/10',
  FIRE: 'bg-danger/10',
};

export const INCOMPLETE_PREFIX = 'FIRE check incomplete:';

/** A section's score on a bar from its floor to its ceiling, with a zero line when the floor is negative. */
function SectionBar({ k, value, complete }: { k: 'h' | 'i' | 'e'; value: number; complete: boolean }) {
  const [lo, hi] = RANGE[k];
  const at = (n: number) => ((Math.min(hi, Math.max(lo, n)) - lo) / (hi - lo)) * 100;
  const zero = lo < 0 ? at(0) : 0;
  const left = Math.min(zero, at(value));
  const width = Math.abs(at(value) - zero);
  return (
    <div className="min-w-0" data-testid={`result-bar-${k}`}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-light-slate">
          <span className="mr-2 font-mono text-xs text-green-accent">{k.toUpperCase()}</span>
          {NAMES[k]}
        </span>
        <span className="font-mono text-xs tabular-nums text-lightest-slate">
          {signed(value)}<span className="text-slate-text"> / {hi}</span>
          {!complete && <span className="ml-2 text-slate-text">incomplete</span>}
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-well" aria-hidden="true">
        <span
          className={`absolute inset-y-0 ${!complete ? 'bg-slate-text/60' : value < 0 ? 'bg-light-slate/50' : 'bg-green-accent/70'}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {lo < 0 && <span className="absolute inset-y-0 w-px bg-light-slate/60" style={{ left: `${zero}%` }} />}
      </div>
    </div>
  );
}

/** The verdict pill, total, one-line meaning, any stop, the FIRE-check gap and the H, I, E bars. */
export default function Verdict({ assessment: a, isLive }: { assessment: Assessment; isLive: boolean }) {
  const s = a.scores;
  const v = a.verdict;
  const incomplete = a.notes.find((n) => n.startsWith(INCOMPLETE_PREFIX));
  const open = (['h', 'i', 'e'] as const).filter((k) => !s.complete[k]).map((k) => NAMES[k]);
  return (
    <div className={`${PANEL} ${verdictBorder(v)}`}>
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-slate-text">{isLive ? 'Should we keep it?' : 'Should we build it?'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p
          className={`inline-flex rounded-full border px-4 py-1.5 font-mono text-xl font-semibold uppercase tracking-[0.06em] ${verdictText(v)} ${verdictBorder(v)} ${v ? PILL_TINT[v] : ''}`}
          data-testid="hire-result-verdict"
        >
          {v ?? 'Pending'}
        </p>
        <p className="text-lightest-slate">
          <span className="text-3xl font-semibold tabular-nums" data-testid="hire-result-total">{signed(s.total)}</span>
          <span className="font-mono text-sm text-slate-text"> / {THRESHOLDS.ceiling}</span>
        </p>
      </div>
      {incomplete && (
        <p className="mt-3 font-mono text-xs text-light-slate" data-testid="hire-fire-incomplete">
          {v ? `${v} · ` : ''}{incomplete}
        </p>
      )}
      {a.meaning && <p className="mt-3 text-light-slate" data-testid="hire-result-meaning">{a.meaning}</p>}
      {a.stop && <p className="mt-2 text-light-slate">{a.stop.message}</p>}
      {a.notAssessed.length > 0 && <p className={`mt-2 ${HINT}`}>Not assessed: {a.notAssessed.join(', ')}.</p>}
      {v === null && (
        <p className={`mt-3 ${HINT}`}>
          The score so far is the sum of the answered items. Answer the rest of {open.join(', ')} for a verdict.
        </p>
      )}
      <div className="mt-6 grid gap-4 border-t border-edge pt-5">
        {(['h', 'i', 'e'] as const).map((k) => <SectionBar key={k} k={k} value={s[k]} complete={s.complete[k]} />)}
      </div>
    </div>
  );
}
