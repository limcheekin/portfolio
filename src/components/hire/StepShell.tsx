import { useEffect, useRef, type RefObject } from 'react';
import type { FlowStep } from '../../lib/hire/checklist';
import { INTRO, PART } from './step-copy';
import { BTN_PRIMARY, BTN_SECONDARY, STEP_TITLE } from './styles';

/**
 * After a move the user made: focus the new step's (or screen's) heading, so a reader hears it and Focus mode's keys
 * keep working, and bring the tool's top into view. Returns the function that marks the next change of `key` as
 * the user's move; any other change (a link loading, a mode switch) leaves focus where it is.
 */
export function useMoveFocus(key: string, heading: RefObject<HTMLElement | null>, root: RefObject<HTMLElement | null>): () => void {
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    heading.current?.focus({ preventScroll: true });
    const el = root.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [key, heading, root]);
  return () => {
    moved.current = true;
  };
}

/** A step's kicker line ("Step 2 of 8 · Part 1 …"), its lettered title (the focus target after a move) and intro. */
export function StepHeader({ kicker, step, headingRef }: { kicker: string; step: FlowStep; headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <>
      <p className="mb-2 font-mono text-xs text-green-accent">
        {kicker}
        {PART[step.part] && <span className="text-slate-text">{` · ${PART[step.part]}`}</span>}
      </p>
      <h3 id="hire-step-title" ref={headingRef} tabIndex={-1} className={`${STEP_TITLE} focus:outline-none`}>
        {step.letter !== '·' && <span className="mr-2 font-mono text-green-accent">{step.letter}</span>}
        {step.title}
      </h3>
      <p className="mb-10 mt-2 text-sm leading-relaxed text-slate-text">{INTRO[step.id]}</p>
    </>
  );
}

/** Back and Next under a step. Each mode words Next and says whether it is the primary action. */
export function StepNav({ className, onBack, next }: {
  className: string;
  onBack?: () => void;
  next?: { label: string; primary: boolean; onClick: () => void };
}) {
  return (
    <div className={`${className} flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-6`}>
      {onBack ? (
        <button type="button" className={BTN_SECONDARY} onClick={onBack} data-testid="hire-back">
          <span aria-hidden="true">←&nbsp;</span>Back
        </button>
      ) : <span />}
      {next && (
        <button type="button" className={next.primary ? BTN_PRIMARY : BTN_SECONDARY} onClick={next.onClick} data-testid="hire-next">
          {next.label}
          <span aria-hidden="true">&nbsp;→</span>
        </button>
      )}
    </div>
  );
}
