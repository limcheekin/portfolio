import type { ReactNode } from 'react';
import type { Assessment, HireAnswers } from '../../../lib/hire/types';
import type { Dispatch } from '../useHireState';
import { BTN_SECONDARY } from '../styles';

/**
 * What every step gets. Steps read and write answers only; layout, navigation and the score live in the
 * mode around them (Guided now, Focus later), so the same steps serve both.
 */
export interface StepProps {
  answers: HireAnswers;
  dispatch: Dispatch;
  assessment: Assessment;
  /** Move to another step by FLOW id (optional: a mode may not offer jumps). */
  go?: (id: string) => void;
}

export const set = (dispatch: Dispatch, path: string) => (value: unknown) => dispatch({ type: 'set', path, value });

export function Group({ title, intro, children }: { title?: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-8">
      {(title || intro) && (
        <div>
          {title && <h4 className="font-mono text-xs uppercase tracking-[0.12em] text-green-accent">{title}</h4>}
          {intro && <div className="mt-2 text-sm leading-relaxed text-slate-text">{intro}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export const YES_NO = (yes: ReactNode, no: ReactNode) => [
  { value: true, label: yes },
  { value: false, label: no },
];

/** A computed suggestion beside the question it fills; the user can take it or pick their own answer. */
export function Suggestion({ children, onUse, applied, testId }: { children: ReactNode; onUse: () => void; applied: boolean; testId: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-edge bg-well p-4 sm:flex-row sm:items-center sm:justify-between" data-testid={testId}>
      <div className="min-w-0 text-sm leading-relaxed text-light-slate">{children}</div>
      <button type="button" className={`${BTN_SECONDARY} shrink-0`} onClick={onUse} disabled={applied}>
        {applied ? 'Suggestion in use' : 'Use suggestion'}
      </button>
    </div>
  );
}
