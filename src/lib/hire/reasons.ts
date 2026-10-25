import type { HireAnswers, PathStep } from './types.ts';
import { E_BOUNDARIES, E_GUARDRAILS, H_ITEMS, I_ITEMS, THRESHOLDS, WORST_CASE_OPTIONS } from './checklist.ts';
import type { ChecklistItem } from './checklist.ts';
import { eItemScore, isNA, SECTION_RANGE } from './score.ts';
import type { RedFlag, SectionScores } from './score.ts';
import type { LiveReading } from './live.ts';

// "This tool's reading" sentences: the framework is silent or ambiguous, so the tool says what it assumed.
export const READINGS = {
  redFlags: "Red flag triggers are this tool's reading: the checklist lists the flags but not what raises them.",
  notApplicable: "Not applicable scoring is this tool's reading: an item marked Not applicable scores its best value and needs a stated reason.",
  traits: "Fewer than 3 reasoning traits only adds a note and scoring goes on; that is this tool's reading, the checklist is silent.",
  roiHorizon: "The ROI suggestion uses a Year-1 horizon: this tool's reading, the checklist names no horizon.",
  preBuildFire: "A pre-build DO NOT BUILD is recorded as FIRE in the Decision field, because the checklist's Decision offers only HIRE, TRAIN or FIRE.",
  liveLowScore: "For a live agent a re-scored total of 30 or less gives FIRE: this tool's reading, since the verdict slot offers only HIRE, TRAIN or FIRE.",
  diyMonths: "DIY above its limit counts as FIRE only after 3 months live: this tool's reading of 'months after launch'.",
  pprTrend: "PPR above its limit counts as FIRE only when IRR is known to be falling; without a previous IRR the trend is unknown and PPR only warns.",
  rlrBand: "RLR between 0% and 1% shows Warning on its meter (the metrics guide's band) but any red line is FIRE (the checklist's zero tolerance).",
  pairs: "Metric pair readings use this tool's thresholds.",
  sampleSize: "Sample size is display-only: it never changes the verdict.",
  liveStop: "A live agent that fails a Part 1 stop gets FIRE with the alternatives: this tool's reading, since every pre-build DO NOT BUILD outcome maps to FIRE once the agent exists.",
  watch: "Warning rates and Critical rates that do not fire are watch items: they never change the verdict.",
  path: "The path to HIRE ranks controllable levers (guardrails and boundaries, readiness, time savings and ROI) ahead of intrinsic properties of the problem; each step is a proposed change, so re-score once it is built and verified.",
} as const;

// Readings the interactive tool adds where it suggests or fills answers; they never enter a result.
export const UI_READINGS = {
  exampleTraits: "The fraud case study does not list which R traits it checked: the example's three (ambiguity, multi-step reasoning, remembering intermediate states) are this tool's reading of its R section.",
  timeBands: "The time-saved suggestion reads the checklist's bands as continuous: 10% or less suggests 1, above 10% up to 20% suggests 2, above 20% up to 50% suggests 3, above 50% suggests 4.",
} as const;
export type ReadingKey = keyof typeof READINGS | keyof typeof UI_READINGS;

const KEYED: Array<{ item: ChecklistItem; section: 'H' | 'I' | 'E' }> = [
  ...E_GUARDRAILS.map((item) => ({ item, section: 'E' as const })),
  ...E_BOUNDARIES.map((item) => ({ item, section: 'E' as const })),
  ...H_ITEMS.map((item) => ({ item, section: 'H' as const })),
  ...I_ITEMS.map((item) => ({ item, section: 'I' as const })),
];
const ACTIONABLE_I = new Set(['timeSavings', 'roi']);
const INTRINSIC = new Set(['worstCase', 'frequency', 'strategicValue']);

interface Lever { key: string; label: string; gain: number; actionable: boolean; order: number }

function current(a: HireAnswers, section: 'H' | 'I' | 'E', key: string): number | null {
  if (section === 'H') return (a.h as Record<string, number | null>)[key];
  if (section === 'I') return (a.i as unknown as Record<string, number | null>)[key];
  const v = (a.e as Record<string, unknown>)[key];
  return eItemScore(key as keyof HireAnswers['e'], v as never);
}

function levers(a: HireAnswers): Lever[] {
  const out: Lever[] = [];
  let order = 0;
  const wc = a.e.worstCase;
  const wcPoints = wc == null ? null : (WORST_CASE_OPTIONS.find((o) => o.value === wc)?.points ?? null);
  const minor = WORST_CASE_OPTIONS.find((o) => o.value === 'minor')!;
  if (wcPoints !== null && wcPoints < minor.points!) {
    out.push({ key: 'worstCase', label: `reduce the worst case to ${minor.label.toLowerCase()}`, gain: minor.points! - wcPoints, actionable: false, order: order++ });
  }
  for (const { item, section } of KEYED) {
    order++;
    if (section === 'E' && isNA((a.e as Record<string, unknown>)[item.key])) continue;
    const now = current(a, section, item.key);
    if (now === null) continue;
    const best = item.options.reduce((b, o) => (Number(o.value) > Number(b.value) ? o : b));
    const gain = Number(best.value) - now;
    if (gain <= 0) continue;
    const actionable = section === 'E' || section === 'H' || (section === 'I' && ACTIONABLE_I.has(item.key));
    if (!actionable && !INTRINSIC.has(item.key)) continue;
    const label = item.key === 'access' ? 'make it suggest-only' : `raise ${item.label.toLowerCase()} to ${String(best.label).toLowerCase()}`;
    out.push({ key: item.key, label, gain, actionable, order });
  }
  return out;
}

export function pathToHire(a: HireAnswers, total: number): PathStep[] {
  const all = levers(a);
  const sorted = [
    ...all.filter((l) => l.actionable).sort((x, y) => y.gain - x.gain || x.order - y.order),
    ...all.filter((l) => !l.actionable).sort((x, y) => y.gain - x.gain || x.order - y.order),
  ];
  const steps: PathStep[] = [];
  let t = total;
  for (const l of sorted) {
    if (t > THRESHOLDS.trainMax) break;
    t += l.gain;
    steps.push({ key: l.key, label: l.label, gain: l.gain, totalAfter: t, actionable: l.actionable, proposed: true });
  }
  return steps;
}

export function buildReasons(
  a: HireAnswers,
  scores: SectionScores,
  flags: RedFlag[],
  live: LiveReading | null,
  stop?: { message: string } | null,
): string[] {
  const out: string[] = [];
  if (stop) out.push(`Stopped at a gate: ${stop.message}`);
  else {
    const gates = [a.part1.canStateBusinessProblem, a.part1.canDefineJobAndKpis, a.r.ruleBased === null ? null : !a.r.ruleBased, a.r.informational === null ? null : !a.r.informational];
    if (gates.every((g) => g === true) && a.e.worstCase !== null) out.push('All gates passed: the problem and job are defined, an agent is the right kind of tool and the worst case is not catastrophic.');
  }
  const rel = (k: 'H' | 'I' | 'E') => {
    const s = k.toLowerCase() as 'h' | 'i' | 'e';
    const [lo, hi] = SECTION_RANGE[s];
    return (scores[s] - lo) / (hi - lo);
  };
  const done = (['H', 'I', 'E'] as const).filter((k) => scores.complete[k.toLowerCase() as 'h' | 'i' | 'e']);
  if (done.length >= 2) {
    const s = [...done].sort((x, y) => rel(y) - rel(x));
    const name = { H: 'Human & Habits', I: 'Impact & Intent', E: 'Exposure & Execution' };
    out.push(`Strongest section: ${name[s[0]]}. Weakest section: ${name[s[s.length - 1]]} (each measured against its own range).`);
  }
  if (flags.length) out.push(`${flags.length} red flag${flags.length === 1 ? '' : 's'} raised: ${flags.map((f) => f.text).join('; ')}.`);
  if (live?.fire.length) out.push(`FIRE criteria met: ${live.fire.map((f) => f.text).join('; ')}.`);
  const na = KEYED.filter(({ item, section }) => section === 'E' && isNA((a.e as Record<string, unknown>)[item.key])).length;
  if (na) out.push(`${na} guardrail or boundary item${na === 1 ? ' is' : 's are'} marked Not applicable.`);
  return out;
}
