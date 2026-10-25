import type { ReactNode } from 'react';
import type { Assessment, HireAnswers } from '../../../lib/hire/types';
import type { Dispatch } from '../useHireState';

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
