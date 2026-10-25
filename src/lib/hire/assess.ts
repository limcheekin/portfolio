import type { Assessment, HireAnswers, Verdict } from './types.ts';
import { ALTERNATIVES, CHECKLIST_SOURCE, METRIC_SHORT } from './checklist.ts';
import { band, firstStop, naItems, redFlags, sectionScores, traitsNote } from './score.ts';
import { readLive } from './live.ts';
import { buildReasons, pathToHire, READINGS } from './reasons.ts';

const MEANING: Record<Verdict, string> = {
  HIRE: 'An AI agent is the right solution.',
  TRAIN: 'Promising: improve the weaknesses before full deployment.',
  'DO NOT BUILD': "Don't build this agent: evaluate the alternatives.",
  FIRE: 'Discontinue or downgrade this agent: evaluate the alternatives.',
};

const BLANK_REVIEW: NonNullable<HireAnswers['review']> = {
  launchDate: null,
  metrics: { ucr: { value: null }, ppr: { value: null }, diy: { value: null }, irr: { value: null }, rlr: { value: null } },
  maintenanceExceedsValue: null,
  betterSolution: null,
};

export function assess(a: HireAnswers): Assessment {
  const live = a.isLive;
  const mode = live ? 'live' : 'pre-build';
  const scores = sectionScores(a);
  const rawStop = firstStop(a);
  const stop = rawStop && live ? { ...rawStop, message: rawStop.message.replace('DO NOT BUILD', 'FIRE') } : rawStop;
  const flags = redFlags(a);
  const reading = live ? readLive(a.review ?? BLANK_REVIEW, a.assessmentDate) : null;
  const na = naItems(a);
  const note = traitsNote(a);

  const incomplete = (['h', 'i', 'e'] as const).filter((k) => !scores.complete[k]);
  // A met FIRE criterion decides a live review at once, like a Part 1 stop: the open sections can't undo it.
  const fired = live && reading!.fire.length > 0;
  let verdict: Verdict | null;
  if (stop) verdict = live ? 'FIRE' : 'DO NOT BUILD';
  else if (fired) verdict = 'FIRE';
  else if (incomplete.length) verdict = null;
  else if (live) verdict = scores.total <= 30 ? 'FIRE' : band(scores.total);
  else verdict = band(scores.total);

  const decision = verdict === null ? null : verdict === 'DO NOT BUILD' ? 'FIRE' : verdict;

  const notAssessed: Assessment['notAssessed'] = [];
  if (stop || fired) for (const k of ['h', 'i', 'e'] as const) if (!scores.complete[k]) notAssessed.push(k.toUpperCase() as 'H' | 'I' | 'E');
  if (reading && reading.unmeasured.length === 5) notAssessed.push('metrics');

  const notes: string[] = [];
  if (note) notes.push(note);
  if (reading) {
    notes.push(...reading.notes);
    if (reading.unmeasured.length) notes.push(`FIRE check incomplete: ${reading.unmeasured.map((k) => METRIC_SHORT[k]).join(', ')} not measured`);
  }

  const showPath = !stop && (verdict === 'TRAIN' || (!live && verdict === 'DO NOT BUILD'));
  const showAlt = verdict === 'FIRE' || verdict === 'DO NOT BUILD';

  const readings: string[] = [];
  if (flags.length) readings.push(READINGS.redFlags);
  if (na.length) readings.push(READINGS.notApplicable);
  if (note) readings.push(READINGS.traits);
  if (a.i.figures?.buildCost !== undefined) readings.push(READINGS.roiHorizon);
  if (!live && verdict === 'DO NOT BUILD') readings.push(READINGS.preBuildFire);
  if (live) {
    if (stop) readings.push(READINGS.liveStop);
    if (reading!.watch.length) readings.push(READINGS.watch);
    if (!stop && verdict === 'FIRE' && scores.total <= 30 && incomplete.length === 0) readings.push(READINGS.liveLowScore);
    const rv = a.review ?? BLANK_REVIEW;
    const mt = rv.metrics;
    if (reading!.bands.diy === 'Critical' || (mt.diy.value != null && reading!.fire.every((f) => f.key !== 'diy') && reading!.watch.some((w) => w.startsWith('DIY')))) readings.push(READINGS.diyMonths);
    if (mt.ppr.value != null && reading!.bands.ppr === 'Critical') readings.push(READINGS.pprTrend);
    if (mt.rlr.value != null && mt.rlr.value > 0 && mt.rlr.value <= 1) readings.push(READINGS.rlrBand);
    if (reading!.pairs.length) readings.push(READINGS.pairs);
    if (Object.values(mt).some((x) => x.sample != null)) readings.push(READINGS.sampleSize);
  }
  const path = showPath ? pathToHire(a, scores.total) : null;
  if (path && path.length) readings.push(READINGS.path);

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
    readings,
    framework: { source: CHECKLIST_SOURCE },
  };
}
