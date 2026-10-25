import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { assess } from '../../lib/hire/assess';
import { FLOW, type FlowStep } from '../../lib/hire/checklist';
import { decodeAnswers, encodeAnswers, REPORT_BASE } from '../../lib/hire/link';
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
import MetricsStep from './steps/MetricsStep';
import Result, { type ReportLink } from './Result';
import StopNotice from './StopNotice';
import { StepHeader, StepNav, useMoveFocus } from './StepShell';
import { BTN_TEXT, PANEL, WELL } from './styles';
import { useStepTransition } from './useStepTransition';

// Focus mode loads when first chosen: the server renders Guided, and most visits never switch.
const FocusMode = lazy(() => import('./FocusMode'));

const STEPS: Record<string, ComponentType<StepProps>> = {
  start: StartStep,
  job: JobStep,
  tool: RightToolStep,
  worst: WorstCaseStep,
  metrics: MetricsStep,
  human: ReadinessStep,
  impact: ImpactStep,
  exposure: GuardrailsStep,
};

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

// Fresh = nothing answered yet, whatever the date. The blank is serialised once.
const BLANK_JSON = JSON.stringify({ ...blankHireAnswers(), assessmentDate: '' });
const isFresh = (a: HireAnswers) => JSON.stringify({ ...a, assessmentDate: '' }) === BLANK_JSON;

type Mode = 'guided' | 'focus';
const MODES: Array<{ id: Mode; label: string }> = [{ id: 'guided', label: 'Guided' }, { id: 'focus', label: 'Focus' }];
const MODE_KEY = 'hire-mode'; // this viewer's last mode: a convenience only, never part of the #a= link

const MODE_NOTE: Record<Mode, string> = {
  guided: 'A few questions per screen, with the score and verdict as you go.',
  focus: 'One question per screen; the score waits for the end. Keys: 1–9 pick, Enter continues, Backspace goes back (all off while you type in a field).',
};

/**
 * The HIRE check: one set of answers in two modes. Guided shows a step per screen with the live score in a rail;
 * Focus (`FocusMode`) shows one question per screen and keeps the score for a reveal at the end.
 */
export default function HireTool() {
  const [answers, dispatch] = useHireState();
  const scored = useMemo(() => scoringAnswers(answers), [answers]);
  const assessment = useMemo(() => assess(scored), [scored]);
  const steps = visibleSteps(answers);
  // Where the user is: a Guided step (a FLOW id) and Focus mode's screen within it, which maps to and from the step.
  const [at, setAt] = useState({ step: 'start', screen: 'start' });
  const [mode, setMode] = useState<Mode>('guided');
  const index = Math.max(0, steps.findIndex((s) => s.id === at.step));
  const step = steps[index];
  const [link, setLink] = useState<'reading' | 'ready' | 'bad'>('reading');
  const [code, setCode] = useState(''); // the answers' #a= code, written 300 ms after the last change

  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const guided = useRef<HTMLElement>(null);
  const writes = useRef(0);
  const lastCode = useRef(''); // the #a= code last read or written, so our own link is never reloaded
  const report = useMemo<ReportLink>(() => ({ scored, url: code ? `${REPORT_BASE}#a=${code}` : '' }), [scored, code]);

  const toStep = (id: string) => setAt((p) => ({ ...p, step: id }));
  const markMove = useMoveFocus(step.id, heading, root);
  const go = (id: string) => {
    markMove();
    toStep(id);
  };

  // The viewer's last mode, read after hydration (the server renders Guided). Storage may be unavailable.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(MODE_KEY) === 'focus') setMode('focus');
    } catch { /* private window or blocked storage: stay Guided */ }
  }, []);
  const switchMode = (m: Mode) => {
    setMode(m);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch { /* not remembered; the switch still works */ }
  };

  useStepTransition(guided, mode === 'guided' ? step.id : '');

  // Read #a= on load, and again when the user changes the hash by hand (pastes another link, or goes Back to one).
  // A link that fails to decode loads nothing. Only the first read picks the step; a later one keeps the user's.
  useEffect(() => {
    let alive = true;
    const read = async (first: boolean) => {
      const m = /^#a=(.*)$/.exec(window.location.hash);
      if (!m) {
        // Other fragments (a footnote opened without JS, say) are not answers.
        if (first) setLink('ready');
        return;
      }
      if (!first && m[1] === lastCode.current) return; // our own link: nothing new to load
      const res = await decodeAnswers(m[1]);
      if (!alive) return;
      if (res.ok) {
        lastCode.current = m[1];
        dispatch({ type: 'load', answers: res.answers });
        if (first) toStep(openingStep(res.answers));
        setLink('ready');
      } else {
        dispatch({ type: 'reset' });
        if (first) toStep('start');
        setLink('bad');
      }
    };
    const onHash = () => read(false);
    read(true);
    window.addEventListener('hashchange', onHash);
    return () => {
      alive = false;
      window.removeEventListener('hashchange', onHash);
    };
  }, [dispatch]);

  // Encode the answers once, 300 ms after the last change: the result's report link shows the code and the page URL
  // carries it. A fresh assessment keeps its code for the report link but leaves the page URL without one.
  useEffect(() => {
    if (link === 'reading') return;
    const n = ++writes.current;
    const t = window.setTimeout(async () => {
      const next = await encodeAnswers(scored);
      if (n !== writes.current) return;
      setCode(next);
      const { pathname, search, hash } = window.location;
      if (isFresh(scored)) {
        lastCode.current = '';
        if (hash) history.replaceState(history.state, '', pathname + search);
        return;
      }
      lastCode.current = next;
      history.replaceState(history.state, '', `${pathname}${search}#a=${next}`);
    }, 300);
    return () => window.clearTimeout(t);
  }, [scored, link]);

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

      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div role="group" aria-label="Mode" className={`inline-flex shrink-0 self-start ${WELL} p-1`}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => switchMode(m.id)}
              className={`min-h-11 rounded-md px-4 text-sm transition-colors duration-250 ${mode === m.id ? 'bg-light-graphite font-semibold text-lightest-slate' : 'text-light-slate hover:text-lightest-slate'}`}
              data-testid={`hire-mode-${m.id}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-slate-text" data-testid="hire-mode-note">{MODE_NOTE[mode]}</p>
      </div>

      {mode === 'focus' ? (
        // The fallback holds the space while the Focus chunk loads (once per visit).
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <FocusMode
            answers={answers}
            dispatch={dispatch}
            assessment={assessment}
            report={report}
            screenId={at.screen}
            stepId={step.id}
            onMove={(screen, st) => setAt({ screen, step: st })}
            toolRoot={root}
          />
        </Suspense>
      ) : (
        <>
          <div className="md:grid md:grid-cols-[12.5rem_minmax(0,1fr)] md:gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
            <div className="hidden md:block">
              <Rail steps={steps} current={step.id} done={done} assessment={assessment} onGo={go} />
            </div>

            <section ref={guided} aria-labelledby="hire-step-title" className="min-w-0" data-step={step.id}>
              <StepHeader kicker={`Step ${index + 1} of ${steps.length}`} step={step} headingRef={heading} />

              {step.id === 'result' ? <Result {...props} report={report} /> : <Body {...props} />}

              {stopHere && (
                <div className="mt-10">
                  <StopNotice
                    assessment={assessment}
                    onResult={() => go('result')}
                    onContinue={next && next.id !== 'result' ? () => go(next.id) : undefined}
                  />
                </div>
              )}

              <StepNav
                className="mt-12"
                onBack={prev && (() => go(prev.id))}
                next={next && { label: next.id === 'result' ? 'See the result' : `Continue: ${next.title}`, primary: true, onClick: () => go(next.id) }}
              />
            </section>
          </div>

          <ScoreBar steps={steps} current={step.id} assessment={assessment} onGo={go} className="md:hidden" />
        </>
      )}
    </div>
  );
}
