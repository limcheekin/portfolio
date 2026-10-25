import type { ReactNode } from 'react';
import { ITEM_LABEL, THRESHOLDS } from '../../../lib/hire/checklist';
import { fireCheckIncomplete } from '../../../lib/hire/assess';
import { READINGS, type ReadingKey } from '../../../lib/hire/reasons';
import type { Assessment } from '../../../lib/hire/types';
import Reading from '../Reading';
import { points, WELL } from '../styles';


const LIST = 'm-0 list-disc space-y-2 pl-5 text-sm leading-relaxed text-light-slate marker:text-slate-text';

export function Block({ title, reading, testId, children }: { title: string; reading?: ReadingKey; testId?: string; children: ReactNode }) {
  return (
    <section className="min-w-0" data-testid={testId}>
      <h4 className="mb-3 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-green-accent">
        {title}
        {reading && <span className="normal-case tracking-normal"><Reading k={reading} /></span>}
      </h4>
      {children}
    </section>
  );
}

/** Why the verdict is what it is: reasons, red flags, notes, N/A items, the path to HIRE, the alternatives, the readings. */
export default function Findings({ assessment: a }: { assessment: Assessment }) {
  // The FIRE-check gap shows under the verdict instead.
  const incomplete = a.live?.unmeasured.length ? fireCheckIncomplete(a.live.unmeasured) : null;
  const notes = a.notes.filter((n) => n !== incomplete);
  const ceil = THRESHOLDS.ceiling;
  return (
    <div className="space-y-10">
      {a.reasons.length > 0 && (
        <Block title="Reasons" testId="result-reasons">
          <ul className={LIST}>{a.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </Block>
      )}

      {a.redFlags.length > 0 && (
        <Block title="Red flags" reading="redFlags" testId="result-red-flags">
          <ul className={LIST}>
            {a.redFlags.map((f) => (
              <li key={f.key}>
                <span className="mr-2 font-mono text-xs text-slate-text">{f.section}</span>
                <span className="text-lightest-slate">{f.text}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {notes.length > 0 && (
        <Block title="Notes" testId="result-notes">
          <ul className={LIST}>{notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </Block>
      )}

      {a.naItems.length > 0 && (
        <Block title="Marked not applicable" reading="notApplicable" testId="result-na">
          <ul className={LIST}>
            {a.naItems.map((x) => (
              <li key={x.key}>
                <span className="text-lightest-slate">{ITEM_LABEL[x.key] ?? x.key}</span>
                <span className="font-mono text-xs text-slate-text"> {points(x.score)}</span>: {x.reason}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {a.pathToHire && a.pathToHire.length > 0 && (
        <Block title="What it takes to reach HIRE" reading="path" testId="result-path">
          <ol className="m-0 list-none space-y-2 p-0">
            {a.pathToHire.map((p, n) => (
              <li key={p.key} className={`flex flex-col gap-1 ${WELL} px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}>
                <span className="text-sm text-lightest-slate">
                  <span className="mr-2 font-mono text-xs text-slate-text">{n + 1}.</span>
                  {p.label.charAt(0).toUpperCase() + p.label.slice(1)}, {points(p.gain)}
                  <span className="font-mono text-xs text-slate-text"> → {p.totalAfter}/{ceil}</span>
                  {!p.actionable && <span className="ml-2 font-mono text-xs text-slate-text">(a property of the problem)</span>}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-slate-text">proposed: re-score once built</span>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {a.alternatives && (
        <Block title="Alternative solutions" testId="result-alternatives">
          <ul className={LIST}>
            {a.alternatives.map((x) => (
              <li key={x.name}>
                <strong className="font-semibold text-lightest-slate">{x.name}</strong>: {x.description}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {a.readingKeys.length > 0 && (
        <Block title="This tool's readings in this result" testId="result-readings">
          <ul className={LIST}>
            {a.readingKeys.map((k) => (
              <li key={k}>
                {READINGS[k]} <Reading k={k} />
              </li>
            ))}
          </ul>
        </Block>
      )}
    </div>
  );
}
