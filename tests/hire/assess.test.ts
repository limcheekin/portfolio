import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assess } from '../../src/lib/hire/assess.ts';
import { pathToHire } from '../../src/lib/hire/reasons.ts';
import { sectionScores } from '../../src/lib/hire/score.ts';
import { allWorst, blankAnswers, fraud, liveFraud, lowScore, withNA } from './helpers.ts';

test('fraud case: TRAIN 42, path +20 suggest-only reaches 62', () => {
  const r = assess(fraud);
  assert.equal(r.verdict, 'TRAIN'); assert.equal(r.scores.total, 42); assert.equal(r.decision, 'TRAIN');
  assert.deepEqual(r.pathToHire!.map((s) => [s.key, s.gain, s.totalAfter]), [['access', 20, 62]]);
  assert.equal(r.alternatives, null);
});
test('pre-build <=30 is DO NOT BUILD, recorded as FIRE, with alternatives and a path', () => {
  const r = assess(lowScore); // total 22, no stop
  assert.equal(r.scores.total, 22);
  assert.equal(r.verdict, 'DO NOT BUILD'); assert.equal(r.decision, 'FIRE');
  assert.equal(r.alternatives!.length, 4); assert.ok(r.pathToHire);
});
test('a Part 1 stop: verdict now, no path, rest not assessed', () => {
  const r = assess({ ...blankAnswers(), part1: { ...blankAnswers().part1, canStateBusinessProblem: false } });
  assert.equal(r.verdict, 'DO NOT BUILD'); assert.equal(r.pathToHire, null);
  assert.deepEqual(r.notAssessed, ['H', 'I', 'E']);
});
test('live: stop, <=30, R downgrade and any FIRE criterion give FIRE', () => {
  assert.equal(assess(liveFraud({ rlr: 0.3 })).verdict, 'FIRE');
  assert.equal(assess({ ...liveFraud({}), r: { ...fraud.r, ruleBased: true } }).verdict, 'FIRE');
  assert.equal(assess(liveFraud({ irr: 70, ucr: 5, ppr: 1.1, diy: 3, rlr: 0 })).verdict, 'TRAIN'); // 42, nothing fires
});
test('actionable levers alone always pass 50', () => {
  const steps = pathToHire(allWorst(), sectionScores(allWorst()).total);
  assert.ok(steps.every((s) => s.actionable)); assert.ok(steps.at(-1)!.totalAfter > 50);
});
test('pending while incomplete', () => assert.equal(assess(blankAnswers()).verdict, null));
test('readings listed', () => {
  const r = assess(withNA);
  assert.ok(r.readings.some((t) => t.includes('Not applicable')));
  assert.deepEqual(r.naItems, [{ key: 'tenant', reason: 'single-tenant internal tool', score: 5 }]);
});

test('live stop: FIRE wording, no DO NOT BUILD, liveStop reading', () => {
  const r = assess({ ...liveFraud({}), e: { ...fraud.e, worstCase: 'catastrophic' } });
  assert.equal(r.verdict, 'FIRE');
  assert.ok(!JSON.stringify([r.reasons, r.stop, r.meaning]).includes('DO NOT BUILD'));
  assert.ok(r.readings.some((t) => t.includes('Part 1 stop')));
});
test('watch items add the watch reading', () => {
  const r = assess(liveFraud({ irr: 50, ucr: 20, ppr: 1.1, diy: 3, rlr: 0 }));
  assert.equal(r.verdict, 'TRAIN');
  assert.ok(r.live!.watch.length > 0);
  assert.ok(r.readings.some((t) => t.includes('watch items')));
});

test('live: a met FIRE criterion gives FIRE at once, with sections still open', () => {
  const open = liveFraud({ rlr: 0.3 });
  const r = assess({ ...open, h: { ...open.h, trust: null }, e: { ...open.e, hitl: null } });
  assert.equal(r.verdict, 'FIRE');
  assert.equal(r.decision, 'FIRE');
  assert.equal(r.meaning, 'Discontinue or downgrade this agent: evaluate the alternatives.');
  assert.equal(r.alternatives!.length, 4);
  assert.equal(r.pathToHire, null);
  assert.deepEqual(r.notAssessed, ['H', 'E']);
  // Nothing fires and sections are open: still pending.
  const calm = liveFraud({ rlr: 0 });
  assert.equal(assess({ ...calm, h: { ...calm.h, trust: null } }).verdict, null);
  // A blank live review (every rate unmeasured) never fires on its own.
  assert.equal(assess({ ...blankAnswers(), isLive: true }).verdict, null);
});

test('diyMonths reading only when the months rule withheld a FIRE', () => {
  const keys = (a: ReturnType<typeof liveFraud>) => assess(a).readingKeys;
  const calm = { irr: 70, ucr: 5, ppr: 1.1, rlr: 0 };
  assert.ok(!keys(liveFraud({ ...calm, diy: 10 })).includes('diyMonths')); // plain Warning DIY
  const recent = { ...liveFraud({ ...calm, diy: 20 }), assessmentDate: '2026-02-15' }; // 1 month live
  assert.ok(keys(recent).includes('diyMonths'));
  assert.equal(assess(recent).verdict, 'TRAIN');
  const fired = liveFraud({ ...calm, diy: 20 }); // 9 months live
  assert.equal(assess(fired).verdict, 'FIRE');
  assert.ok(!keys(fired).includes('diyMonths'));
});
test('no launch date: a Critical DIY warns with the launch date unknown', () => {
  const a = liveFraud({ irr: 70, ucr: 5, ppr: 1.1, rlr: 0, diy: 20 });
  const r = assess({ ...a, review: { ...a.review!, launchDate: null } });
  assert.equal(r.verdict, 'TRAIN');
  assert.ok(r.live!.watch.includes('DIY 20% is Critical but the launch date is unknown, so a warning only'));
  assert.ok(!r.live!.watch.some((w) => w.includes('under 3 months')));
  assert.ok(r.readingKeys.includes('diyMonths'));
});
