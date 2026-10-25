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
