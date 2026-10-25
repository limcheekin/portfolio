import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { assess } from '../../lib/hire/assess';
import { FLOW, type FlowStep } from '../../lib/hire/checklist';
import { decodeAnswers, encodeAnswers } from '../../lib/hire/link';
import type { Assessment, HireAnswers } from '../../lib/hire/types';
import Rail, { ScoreBar } from './Rail';
import { blankHireAnswers, scoringAnswers, useHireState } from './useHireState';
import type { StepProps } from './steps/common';
import StartStep from './steps/StartStep';
import JobStep from './steps/JobStep';
import RightToolStep from './steps/RightToolStep';
import WorstCaseStep from './steps/WorstCaseStep';
import ReadinessStep from './steps/ReadinessStep';
import ImpactStep from './steps/ImpactStep';
import GuardrailsStep from './steps/GuardrailsStep';
import { MetricsInterim, ResultInterim } from './steps/Interim';
import { BTN_PRIMARY, BTN_SECONDARY, BTN_TEXT, PANEL, STEP_TITLE } from './styles';

const STEPS: Record<string, ComponentType<StepProps>> = {
  start: StartStep,
  job: JobStep,
  tool: RightToolStep,
  worst: WorstCaseStep,
  metrics: MetricsInterim,
  human: ReadinessStep,
  impact: ImpactStep,
  exposure: GuardrailsStep,
  result: ResultInterim,
};

const INTRO: Record<string, string> = {
  start: 'Name the agent and say whether it is already live. Your answers stay in this page and its link.',
  job: 'Go/no-go: if you cannot state the problem or define the job, stop here.',
  tool: 'Classify the task against the job you just wrote: rules, a chatbot or an agent.',
  worst: 'Go/no-go: a catastrophic worst case stops the assessment. The other cases carry into the E score.',
  metrics: 'What the agent has done since launch.',
  human: 'Will people trust and use it, and are the data and the plumbing ready? Each item scores 1 to 3.',
  impact: 'How often, how much time, what return, and what else it is worth.',
  exposure: 'What stops a mistake from doing damage.',
  result: 'The verdict, with the score from every answered item.',
};

const PART: Record<number, string> = { 1: 'Part 1 · Should this exist?', 2: 'Live review', 3: 'Part 2 · How ready is it?' };

/** Which step a stop belongs to, so its notice shows where the stopping answer was given. */
const STOP_STEP = { problem: 'job', job: 'job', ruleBased: 'tool', informational: 'tool', catastrophic: 'worst' } as const;

function doneSteps(a: HireAnswers, x: Assessment): Record<string, boolean> {
  return {
    job: a.part1.canStateBusinessProblem !== null && a.part1.canDefineJobAndKpis !== null,
    tool: a.r.ruleBased !== null && a.r.informational !== null,
    worst: a.e.worstCase !== null,
    human: x.scores.complete.h,
    impact: x.scores.complete.i,
    exposure: x.scores.complete.e,
  };
}

const visibleSteps = (a: HireAnswers): FlowStep[] => FLOW.filter((s) => !s.liveOnly || a.isLive);

/** A restored link opens on its result; an unfinished one on its first open step. */
function openingStep(a: HireAnswers): string {
  const x = assess(scoringAnswers(a));
  if (x.verdict !== null) return 'result';
  const done = doneSteps(a, x);
  return visibleSteps(a).find((s) => s.id in done && !done[s.id])?.id ?? 'start';
}

const isFresh = (a: HireAnswers) => JSON.stringify(a) === JSON.stringify({ ...blankHireAnswers(), assessmentDate: a.assessmentDate });

function StopNotice({ assessment, onResult, onContinue }: { assessment: Assessment; onResult: () => void; onContinue?: () => void }) {
  return (
    <div className={`${PANEL} border-danger/50`} data-testid="hire-stop">
      <p className="font-mono text-lg font-semibold uppercase tracking-[0.06em] text-danger">{assessment.verdict}</p>
      <p className="mt-2 text-lightest-slate">{assessment.stop!.message}</p>
      <p className="mt-1 text-sm text-slate-text">{assessment.meaning}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={BTN_PRIMARY} onClick={onResult} data-testid="hire-stop-result">See the result</button>
        {onContinue && (
          <button type="button" className={BTN_SECONDARY} onClick={onContinue} data-testid="hire-stop-finish">Finish the rest for the record</button>
        )}
      </div>
    </div>
  );
}

// Guided is the only mode so far; Focus mode (Task 12) renders the same steps one question at a time.
export default function HireTool() {
  const [answers, dispatch] = useHireState();
  const scored = useMemo(() => scoringAnswers(answers), [answers]);
  const assessment = useMemo(() => assess(scored), [scored]);
  const steps = visibleSteps(answers);
  const [stepId, setStepId] = useState('start');
  const index = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const step = steps[index];
  const [link, setLink] = useState<'reading' | 'ready' | 'bad'>('reading');

  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigated = useRef(false);
  const writes = useRef(0);

  const go = (id: string) => {
    navigated.current = true;
    setStepId(id);
  };

  // Read #a= on load (and when the hash is changed by hand). A link that fails to decode loads nothing.
  useEffect(() => {
    let alive = true;
    const read = async () => {
      const m = /^#a=(.*)$/.exec(window.location.hash);
      if (!m) {
        setLink((l) => (l === 'reading' ? 'ready' : l));
        return;
      }
      const res = await decodeAnswers(m[1]);
      if (!alive) return;
      if (res.ok) {
        dispatch({ type: 'load', answers: res.answers });
        setStepId(openingStep(res.answers));
        setLink('ready');
      } else {
        dispatch({ type: 'reset' });
        setStepId('start');
        setLink('bad');
      }
    };
    read();
    window.addEventListener('hashchange', read);
    return () => {
      alive = false;
      window.removeEventListener('hashchange', read);
    };
  }, [dispatch]);

  // Keep the link in step with the answers, 300 ms after the last change. A fresh assessment has no link.
  useEffect(() => {
    if (link === 'reading') return;
    const n = ++writes.current;
    const t = window.setTimeout(async () => {
      const { pathname, search, hash } = window.location;
      if (isFresh(scored)) {
        if (hash) history.replaceState(history.state, '', pathname + search);
        return;
      }
      const code = await encodeAnswers(scored);
      if (n === writes.current) history.replaceState(history.state, '', `${pathname}${search}#a=${code}`);
    }, 300);
    return () => window.clearTimeout(t);
  }, [scored, link]);

  // After a step change the user made: focus the new step's heading and bring the tool's top into view.
  useEffect(() => {
    if (!navigated.current) return;
    navigated.current = false;
    heading.current?.focus({ preventScroll: true });
    const el = root.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [step.id]);

  const Body = STEPS[step.id];
  const next = steps[index + 1];
  const prev = steps[index - 1];
  const stop = assessment.stop;
  const stopHere = stop !== null && (STOP_STEP[stop.gate] === step.id || (stop.gate === 'catastrophic' && step.id === 'exposure'));
  const done = doneSteps(answers, assessment);
  const props: StepProps = { answers, dispatch, assessment, go };

  return (
    <div ref={root} className="scroll-mt-28" data-hire-tool data-ready={link !== 'reading' ? 'true' : 'false'}>
      {link === 'bad' && (
        <div role="alert" className={`${PANEL} mb-8 border-danger/50`} data-testid="hire-bad-link">
          <p className="font-semibold text-lightest-slate">This link can't be read</p>
          <p className="mt-1 text-sm text-slate-text">
            It may be cut short, edited, or made by a different version of this tool. Nothing from it was loaded: a fresh assessment starts below.
          </p>
          <button type="button" className={BTN_TEXT} onClick={() => setLink('ready')}>Dismiss</button>
        </div>
      )}

      <div className="md:grid md:grid-cols-[12.5rem_minmax(0,1fr)] md:gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <div className="hidden md:block">
          <Rail steps={steps} current={step.id} done={done} assessment={assessment} onGo={go} />
        </div>

        <section aria-labelledby="hire-step-title" className="min-w-0" data-step={step.id}>
          <p className="mb-2 font-mono text-xs text-green-accent">
            {`Step ${index + 1} of ${steps.length}`}
            {PART[step.part] && <span className="text-slate-text">{` · ${PART[step.part]}`}</span>}
          </p>
          <h3 id="hire-step-title" ref={heading} tabIndex={-1} className={`${STEP_TITLE} focus:outline-none`}>
            {step.letter !== '·' && <span className="mr-2 font-mono text-green-accent">{step.letter}</span>}
            {step.title}
          </h3>
          <p className="mb-10 mt-2 text-sm leading-relaxed text-slate-text">{INTRO[step.id]}</p>

          <Body {...props} />

          {stopHere && (
            <div className="mt-10">
              <StopNotice
                assessment={assessment}
                onResult={() => go('result')}
                onContinue={next && next.id !== 'result' ? () => go(next.id) : undefined}
              />
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-edge pt-6">
            {prev ? (
              <button type="button" className={BTN_SECONDARY} onClick={() => go(prev.id)} data-testid="hire-back">
                <span aria-hidden="true">←&nbsp;</span>Back
              </button>
            ) : <span />}
            {next && (
              <button type="button" className={BTN_PRIMARY} onClick={() => go(next.id)} data-testid="hire-next">
                {next.id === 'result' ? 'See the result' : `Continue: ${next.title}`}
                <span aria-hidden="true">&nbsp;→</span>
              </button>
            )}
          </div>
        </section>
      </div>

      <ScoreBar steps={steps} current={step.id} assessment={assessment} onGo={go} className="md:hidden" />
    </div>
  );
}
