import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { FLOW, I_ITEMS, type ChecklistItem } from '../../lib/hire/checklist';
import type { Assessment, HireAnswers } from '../../lib/hire/types';
import { currentScreen, focusKey, focusScreens, STOP_SCREEN, type FocusScreen } from './focus';
import { KeyHints } from './Question';
import { gaugeLabel } from './Rail';
import Result, { type ReportLink } from './Result';
import ScoreGauge, { FLOOR } from './ScoreGauge';
import StopNotice from './StopNotice';
import { StepHeader, StepNav, useMoveFocus } from './StepShell';
import { PANEL, verdictStyle } from './styles';
import { useStepTransition } from './useStepTransition';
import { ItemQuestion, ScoreHidden, type StepProps } from './steps/common';
import StartStep from './steps/StartStep';
import { IntentCheck, JobExercise } from './steps/JobStep';
import { CompareTable, InformationalQuestion, RuleBasedQuestion, Traits } from './steps/RightToolStep';
import WorstCaseStep from './steps/WorstCaseStep';
import MetricsStep from './steps/MetricsStep';
import { H_GROUPS } from './steps/ReadinessStep';
import { Roi, TimeSavings } from './steps/ImpactStep';
import { E_GROUPS } from './steps/GuardrailsStep';

const GROUP_HEAD = 'font-mono text-xs uppercase tracking-[0.12em] text-green-accent';

/** The screens that ask one scored item on its own, by screen id, with the group (and E's note) it sits in. */
const ITEM_SCREENS: Record<string, { section: 'h' | 'i' | 'e'; item: ChecklistItem; group?: { title: string; intro?: ReactNode } }> = {};
for (const g of H_GROUPS) for (const item of g.items) ITEM_SCREENS[`h.${item.key}`] = { section: 'h', item, group: { title: g.title } };
for (const g of E_GROUPS) for (const item of g.items) ITEM_SCREENS[`e.${item.key}`] = { section: 'e', item, group: g };
// Time savings and ROI carry their figures, so they have screens of their own below.
for (const item of I_ITEMS) if (item.key === 'frequency' || item.key === 'strategicValue') ITEM_SCREENS[`i.${item.key}`] = { section: 'i', item };

/** The body of one screen, built from the same step parts Guided mode uses. */
function ScreenBody({ id, props }: { id: string; props: StepProps }) {
  const { answers, dispatch } = props;
  const scored = ITEM_SCREENS[id];
  if (scored) {
    const { section, item, group } = scored;
    return (
      <div className="space-y-6">
        {group && (
          <div>
            <p className={GROUP_HEAD}>{group.title}</p>
            {group.intro && <div className="mt-2 text-sm leading-relaxed text-slate-text">{group.intro}</div>}
          </div>
        )}
        <ItemQuestion section={section} item={item} answers={answers} dispatch={dispatch} />
      </div>
    );
  }
  switch (id) {
    case 'start': return <StartStep {...props} />;
    case 'job.intent': return <IntentCheck {...props} />;
    case 'job.role': return <JobExercise {...props} />;
    case 'tool.ruleBased':
    case 'tool.informational':
      return (
        <div className="space-y-6">
          <p className={GROUP_HEAD}>Task classification</p>
          {id === 'tool.ruleBased' ? <RuleBasedQuestion {...props} /> : <InformationalQuestion {...props} />}
        </div>
      );
    case 'tool.traits': return <Traits {...props} />;
    case 'tool.table': return <CompareTable {...props} />;
    case 'worst': return <WorstCaseStep {...props} />;
    // Two yes/no questions share this screen, so number keys pick nothing here (and no key hints show).
    case 'metrics': return <KeyHints.Provider value={false}><MetricsStep {...props} /></KeyHints.Provider>;
    case 'i.timeSavings': return <TimeSavings {...props} />;
    case 'i.roi': return <Roi {...props} />;
    default: return null;
  }
}

/** The end of Focus mode: the gauge comes in here, its needle sweeping once from the floor to the total. */
function Reveal({ assessment }: { assessment: Assessment }) {
  return (
    <div className={`${PANEL} ${verdictStyle(assessment.verdict).border}`} data-testid="hire-reveal">
      <ScoreGauge
        total={assessment.scores.total}
        verdict={assessment.verdict}
        label={gaugeLabel(assessment)}
        from={FLOOR}
        duration={1.2}
        className="mx-auto block w-full max-w-[16rem]"
      />
    </div>
  );
}

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

/**
 * Focus mode: one question per screen, keyboard-driven. Digits 1–9 pick the screen's nth option, Enter
 * continues once the screen is answered, Backspace goes back; all three are off while a typing field has focus.
 * The score stays out of sight (no gauge, no running verdict, no live region) until the result's reveal.
 */
export default function FocusMode({ answers, dispatch, assessment, report, screenId, stepId, onMove, toolRoot }: {
  answers: HireAnswers;
  dispatch: StepProps['dispatch'];
  assessment: Assessment;
  report: ReportLink;
  screenId: string;
  stepId: string;
  onMove: (screenId: string, stepId: string) => void;
  toolRoot: RefObject<HTMLElement | null>;
}) {
  const screens = focusScreens(answers);
  const index = currentScreen(screens, screenId, stepId);
  const screen = screens[index];
  const step = FLOW.find((s) => s.id === screen.step)!;
  const prev: FocusScreen | undefined = screens[index - 1];
  const next: FocusScreen | undefined = screens[index + 1];
  const done = screen.done(answers);
  const [status, setStatus] = useState('');

  const section = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useStepTransition(section, screen.id);
  // After a move the user made, the heading takes focus, so the keys keep working and a reader hears it.
  const markMove = useMoveFocus(screen.id, heading, toolRoot);

  const move = (s: FocusScreen) => {
    markMove();
    setStatus('');
    onMove(s.id, s.step);
  };
  const go = (stepTo: string) => {
    const s = screens.find((x) => x.step === stepTo);
    if (s) move(s);
  };

  // The key handler reads the latest render through this ref, so the listener is added once.
  const latest = useRef({ screen, prev, next, done, answers, move });
  latest.current = { screen, prev, next, done, answers, move };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tool = toolRoot.current;
      const root = body.current;
      if (!tool || !root) return;
      const active = document.activeElement as HTMLElement | null;
      // Only while the user is in the tool: focus inside it, or nowhere in particular with the tool on screen.
      const idle = !active || active === document.body;
      if (!(active && tool.contains(active)) && !(idle && onScreen(root))) return;
      const k = focusKey(e, active);
      if (!k) return;
      const cur = latest.current;

      if (k.kind === 'pick') {
        const radios = [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)')];
        const groups = new Set(radios.map((r) => r.name));
        let target: HTMLInputElement | undefined;
        if (groups.size === 1) target = radios[k.n];
        else if (groups.size === 0) target = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not(:disabled)')[k.n];
        if (!target) return;
        e.preventDefault();
        target.click();
        const label = target.closest('label')?.querySelector(':scope > span')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        setStatus(target.type === 'checkbox' ? `${target.checked ? 'Checked' : 'Unchecked'}: ${label}` : `Chosen: ${label}`);
        // Not applicable needs a reason: put the cursor in its field, which then takes the typing.
        if (target.value === 'na') {
          requestAnimationFrame(() => target.closest('fieldset')?.querySelector<HTMLInputElement>('input[type="text"]')?.focus());
        }
        return;
      }
      if (k.kind === 'next') {
        if (!cur.next) return;
        e.preventDefault();
        if (cur.done) cur.move(cur.next);
        else setStatus('Answer this one first, or use Skip.');
        return;
      }
      if (k.kind === 'back' && cur.prev) {
        e.preventDefault();
        cur.move(cur.prev);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [toolRoot]);

  const props: StepProps = { answers, dispatch, assessment, go };
  const stop = assessment.stop;
  const stopHere = stop !== null && STOP_SCREEN[stop.gate] === screen.id;

  return (
    <KeyHints.Provider value>
      <section ref={section} aria-labelledby="hire-step-title" className="min-w-0 max-w-2xl" data-step={step.id} data-screen={screen.id}>
        <StepHeader kicker={`Question ${index + 1} of ${screens.length}`} step={step} headingRef={heading} />

        <div ref={body}>
          {screen.id === 'result' ? (
            <div className="space-y-8">
              <Reveal assessment={assessment} />
              <Result {...props} report={report} />
            </div>
          ) : (
            <ScoreHidden.Provider value>
              <ScreenBody id={screen.id} props={props} />
            </ScoreHidden.Provider>
          )}
        </div>

        {stopHere && (
          <div className="mt-10">
            <StopNotice assessment={assessment} showVerdict={false} onResult={() => go('result')} onContinue={next && next.id !== 'result' ? () => move(next) : undefined} />
          </div>
        )}

        <p role="status" className="mt-6 min-h-5 font-mono text-xs text-light-slate" data-testid="hire-focus-status">{status}</p>

        <StepNav
          className="mt-6"
          onBack={prev && (() => move(prev))}
          next={next && {
            label: next.id === 'result' ? (done ? 'See the result' : 'Skip to the result') : done ? 'Continue' : 'Skip',
            primary: done,
            onClick: () => move(next),
          }}
        />
      </section>
    </KeyHints.Provider>
  );
}
