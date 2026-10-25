import type { Assessment, HireAnswers, MetricKey, Verdict } from './types.ts';
import { ALTERNATIVES, CHECKLIST_SOURCE, METRIC_SHORT, THRESHOLDS } from './checklist.ts';
import { band, firstStop, naItems, redFlags, sectionScores, stopVerdict, traitsNote } from './score.ts';
import { blankReview, diyHeldBack, readLive } from './live.ts';
import { buildReasons, pathToHire, READINGS } from './reasons.ts';

const MEANING: Record<Verdict, string> = {
  HIRE: 'An AI agent is the right solution.',
  TRAIN: 'Promising: improve the weaknesses before full deployment.',
  'DO NOT BUILD': "Don't build this agent: evaluate the alternatives.",
  FIRE: 'Discontinue or downgrade this agent: evaluate the alternatives.',
};

/** The Documentation field offers only HIRE, TRAIN or FIRE, so a pre-build DO NOT BUILD is recorded as FIRE. */
const DECISION: Record<Verdict, NonNullable<Assessment['decision']>> = { HIRE: 'HIRE', TRAIN: 'TRAIN', 'DO NOT BUILD': 'FIRE', FIRE: 'FIRE' };


/** The note a live review carries while any metric is unmeasured; the result shows it under the verdict. */
export const fireCheckIncomplete = (unmeasured: MetricKey[]): string =>
  `FIRE check incomplete: ${unmeasured.map((k) => METRIC_SHORT[k]).join(', ')} not measured`;

export function assess(a: HireAnswers): Assessment {
  const live = a.isLive;
  const mode = live ? 'live' : 'pre-build';
  const scores = sectionScores(a);
  const stop = firstStop(a);
  const flags = redFlags(a);
  // A link or MCP call may mark the agent live and leave the review out: it reads as nothing measured yet.
  const review = live ? (a.review ?? blankReview()) : null;
  const reading = review ? readLive(review, a.assessmentDate) : null;
  const na = naItems(a);
  const note = traitsNote(a);

  const incomplete = (['h', 'i', 'e'] as const).filter((k) => !scores.complete[k]);
  // A met FIRE criterion decides a live review at once, like a Part 1 stop: the open sections can't undo it.
  const fired = live && reading!.fire.length > 0;
  let verdict: Verdict | null;
  if (stop) verdict = stopVerdict(a);
  else if (fired) verdict = 'FIRE';
  else if (incomplete.length) verdict = null;
  else if (live) verdict = scores.total <= THRESHOLDS.doNotBuildMax ? 'FIRE' : band(scores.total);
  else verdict = band(scores.total);

  const decision = verdict === null ? null : DECISION[verdict];

  const notAssessed: Assessment['notAssessed'] = [];
  if (stop || fired) for (const k of ['h', 'i', 'e'] as const) if (!scores.complete[k]) notAssessed.push(k.toUpperCase() as 'H' | 'I' | 'E');
  if (reading && reading.unmeasured.length === 5) notAssessed.push('metrics');

  const notes: string[] = [];
  if (note) notes.push(note);
  if (reading) {
    notes.push(...reading.notes);
    if (reading.unmeasured.length) notes.push(fireCheckIncomplete(reading.unmeasured));
  }

  const showPath = !stop && (verdict === 'TRAIN' || (!live && verdict === 'DO NOT BUILD'));
  const showAlt = verdict === 'FIRE' || verdict === 'DO NOT BUILD';

  const readingKeys: Array<keyof typeof READINGS> = [];
  if (flags.length) readingKeys.push('redFlags');
  if (na.length) readingKeys.push('notApplicable');
  if (note) readingKeys.push('traits');
  if (a.i.figures?.buildCost !== undefined) readingKeys.push('roiHorizon');
  if (!live && verdict === 'DO NOT BUILD') readingKeys.push('preBuildFire');
  if (live) {
    if (stop) readingKeys.push('liveStop');
    if (reading!.watch.length) readingKeys.push('watch');
    if (!stop && verdict === 'FIRE' && scores.total <= THRESHOLDS.doNotBuildMax && incomplete.length === 0) readingKeys.push('liveLowScore');
    const mt = review!.metrics;
    if (diyHeldBack(review!, a.assessmentDate)) readingKeys.push('diyMonths');
    if (mt.ppr.value != null && reading!.bands.ppr === 'Critical') readingKeys.push('pprTrend');
    if (mt.rlr.value != null && mt.rlr.value > 0 && mt.rlr.value <= 1) readingKeys.push('rlrBand');
    if (reading!.pairs.length) readingKeys.push('pairs');
    if (Object.values(mt).some((x) => x.sample != null)) readingKeys.push('sampleSize');
  }
  const path = showPath ? pathToHire(a, scores.total) : null;
  if (path && path.length) readingKeys.push('path');

  return {
    mode,
    verdict,
    decision,
    meaning: verdict === null ? null : MEANING[verdict],
    stop,
    notAssessed,
    scores,
    redFlags: flags,
    notes,
    reasons: buildReasons(a, scores, flags, reading, stop),
    pathToHire: path,
    alternatives: showAlt ? ALTERNATIVES : null,
    live: reading,
    naItems: na,
    readingKeys,
    readings: readingKeys.map((k) => READINGS[k]),
    framework: { source: CHECKLIST_SOURCE },
  };
}
