import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { FLOW, I_ITEMS } from '../../lib/hire/checklist';
import type { Assessment, HireAnswers } from '../../lib/hire/types';
import { currentScreen, focusKey, focusScreens, STOP_SCREEN, type FocusScreen } from './focus';
import { KeyHints } from './Question';
import { gaugeLabel } from './Rail';
import Result from './Result';
import ScoreGauge, { FLOOR } from './ScoreGauge';
import StopNotice from './StopNotice';
import { INTRO, PART } from './step-copy';
import { BTN_PRIMARY, BTN_SECONDARY, PANEL, STEP_TITLE, verdictStyle } from './styles';
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

/** The group a scored item sits in, with the checklist's note for E's groups. */
function itemGroup(section: string, key: string): { title: string; intro?: ReactNode } | null {
  const groups = section === 'h' ? H_GROUPS : section === 'e' ? E_GROUPS : [];
  const g = groups.find((x) => x.items.some((it) => it.key === key));
  return g ? { title: g.title, intro: 'intro' in g ? (g.intro as ReactNode) : undefined } : null;
}

/** The body of one screen, built from the same step parts Guided mode uses. */
function ScreenBody({ id, props }: { id: string; props: StepProps }) {
  const { answers, dispatch } = props;
  const [section, key] = id.split('.');
  if (section === 'h' || section === 'e' || (section === 'i' && (key === 'frequency' || key === 'strategicValue'))) {
    const list = section === 'i' ? I_ITEMS : [...H_GROUPS, ...E_GROUPS].flatMap((g) => g.items);
    const item = list.find((x) => x.key === key)!;
    const group = itemGroup(section, key);
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
export default function FocusMode({ answers, dispatch, assessment, screenId, stepId, onMove, toolRoot }: {
  answers: HireAnswers;
  dispatch: StepProps['dispatch'];
  assessment: Assessment;
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
  const navigated = useRef(false);
  useStepTransition(section, screen.id);

  const move = (s: FocusScreen) => {
    navigated.current = true;
    setStatus('');
    onMove(s.id, s.step);
  };
  const go = (stepTo: string) => {
    const s = screens.find((x) => x.step === stepTo);
    if (s) move(s);
  };

  // After a move the user made: focus the screen's heading, so the keys keep working and a reader hears it.
  useEffect(() => {
    if (!navigated.current) return;
    navigated.current = false;
    heading.current?.focus({ preventScroll: true });
    const el = toolRoot.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [screen.id, toolRoot]);

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
        <p className="mb-2 font-mono text-xs text-green-accent">
          {`Question ${index + 1} of ${screens.length}`}
          {PART[step.part] && <span className="text-slate-text">{` · ${PART[step.part]}`}</span>}
        </p>
        <h3 id="hire-step-title" ref={heading} tabIndex={-1} className={`${STEP_TITLE} focus:outline-none`}>
          {step.letter !== '·' && <span className="mr-2 font-mono text-green-accent">{step.letter}</span>}
          {step.title}
        </h3>
        <p className="mb-10 mt-2 text-sm leading-relaxed text-slate-text">{INTRO[step.id]}</p>

        <div ref={body}>
          {screen.id === 'result' ? (
            <div className="space-y-8">
              <Reveal assessment={assessment} />
              <Result {...props} />
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-6">
          {prev ? (
            <button type="button" className={BTN_SECONDARY} onClick={() => move(prev)} data-testid="hire-back">
              <span aria-hidden="true">←&nbsp;</span>Back
            </button>
          ) : <span />}
          {next && (
            <button type="button" className={done ? BTN_PRIMARY : BTN_SECONDARY} onClick={() => move(next)} data-testid="hire-next">
              {next.id === 'result' ? (done ? 'See the result' : 'Skip to the result') : done ? 'Continue' : 'Skip'}
              <span aria-hidden="true">&nbsp;→</span>
            </button>
          )}
        </div>
      </section>
    </KeyHints.Provider>
  );
}
