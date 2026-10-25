import { test } from 'node:test';
import assert from 'node:assert/strict';
import { band, eItemScore, firstStop, naItems, redFlags, sectionScores, traitsNote } from '../../src/lib/hire/score.ts';
import { allWorst, blankAnswers, fraud } from './helpers.ts';
import type { HireAnswers } from '../../src/lib/hire/types.ts';

test('fraud case scores H17 I15 E10 = 42', () => {
  const s = sectionScores(fraud);
  assert.deepEqual([s.h, s.i, s.e, s.total], [17, 15, 10, 42]);
  assert.deepEqual(s.complete, { h: true, i: true, e: true });
  assert.equal(band(s.total), 'TRAIN');
});
test('band edges', () => {
  assert.equal(band(30), 'DO NOT BUILD'); assert.equal(band(31), 'TRAIN');
  assert.equal(band(50), 'TRAIN'); assert.equal(band(51), 'HIRE');
});
test('floor is -55', () => assert.equal(sectionScores(allWorst()).total, -55));
test('partial answers sum what is answered and mark incomplete', () => {
  const s = sectionScores({ ...blankAnswers(), h: { ...blankAnswers().h, trust: 3 } });
  assert.equal(s.total, 3); assert.equal(s.complete.h, false);
});
test('N/A scores the best value', () => {
  assert.equal(eItemScore('hitl', { na: 'no critical actions' }), 5);
  assert.equal(eItemScore('access', { na: 'x' }), 10);
  assert.equal(eItemScore('hitl', null), null);
});
test('naItems lists reasons with best scores', () => {
  const a = { ...fraud, e: { ...fraud.e, hitl: { na: 'no actions' }, access: { na: 'read only by design' } } } as HireAnswers;
  assert.deepEqual(naItems(a), [
    { key: 'hitl', reason: 'no actions', score: 5 },
    { key: 'access', reason: 'read only by design', score: 10 },
  ]);
});
test('Part 1 stops, in order', () => {
  assert.equal(firstStop({ ...fraud, part1: { ...fraud.part1, canStateBusinessProblem: false } })?.gate, 'problem');
  assert.equal(firstStop({ ...fraud, part1: { ...fraud.part1, canDefineJobAndKpis: false } })?.gate, 'job');
  assert.equal(firstStop({ ...fraud, r: { ...fraud.r, ruleBased: true } })?.gate, 'ruleBased');
  assert.equal(firstStop({ ...fraud, r: { ...fraud.r, informational: true } })?.gate, 'informational');
  assert.equal(firstStop({ ...fraud, e: { ...fraud.e, worstCase: 'catastrophic' } })?.gate, 'catastrophic');
  assert.equal(firstStop(fraud), null);
  assert.equal(firstStop({ ...fraud, part1: { ...fraud.part1, canStateBusinessProblem: false }, r: { ...fraud.r, ruleBased: true } })?.gate, 'problem');
});
test('red flag triggers', () => {
  const keys = (a: HireAnswers) => redFlags(a).map((f) => f.key);
  assert.deepEqual(keys(fraud), []);
  assert.ok(keys({ ...fraud, h: { ...fraud.h, culturalFit: 1 } }).includes('h1'));
  assert.ok(keys({ ...fraud, h: { ...fraud.h, dataQuality: 1 } }).includes('h2'));
  assert.ok(keys({ ...fraud, h: { ...fraud.h, changeManagement: 1 } }).includes('h3'));
  assert.ok(keys({ ...fraud, i: { ...fraud.i, frequency: 2 } }).includes('i1'));
  assert.ok(keys({ ...fraud, part1: { ...fraud.part1, canDefineJobAndKpis: false } }).includes('i2'));
  assert.ok(keys({ ...fraud, part1: { ...fraud.part1, canStateBusinessProblem: false } }).includes('i3'));
  assert.ok(keys({ ...fraud, r: { ...fraud.r, ruleBased: true } }).includes('r1'));
  assert.ok(keys({ ...fraud, r: { ...fraud.r, informational: true } }).includes('r2'));
  assert.ok(keys({ ...fraud, r: { ...fraud.r, table: { ...fraud.r.table, rule: {} } } }).includes('r3'));
  assert.ok(keys({ ...fraud, e: { ...fraud.e, hitl: 0 } }).includes('e1'));
  assert.ok(!keys({ ...fraud, e: { ...fraud.e, hitl: 0, worstCase: 'minor', access: 10 } }).includes('e1'));
  assert.ok(keys({ ...fraud, e: { ...fraud.e, hitl: -5 } }).includes('e1'));
  assert.ok(keys({ ...fraud, e: { ...fraud.e, security: -5 } }).includes('e2'));
  assert.ok(keys({ ...fraud, e: { ...fraud.e, rollback: -5 } }).includes('e3'));
  assert.ok(keys({ ...fraud, e: { ...fraud.e, worstCase: 'catastrophic' } }).includes('e4'));
  assert.ok(!keys({ ...fraud, e: { ...fraud.e, hitl: { na: 'none' }, security: { na: 'n' }, rollback: { na: 'n' } } }).some((k) => ['e1', 'e2', 'e3'].includes(k)));
});
test('traits note, not a red flag', () => {
  const two = { ...fraud, r: { ...fraud.r, traits: { ...fraud.r.traits, intermediateStates: false } } };
  assert.equal(traitsNote(two), 'may not need an AI agent (2 of 5 traits)');
  assert.ok(!redFlags(two).some((f) => f.key === 'r3'));
  assert.equal(traitsNote(fraud), null);
  assert.equal(traitsNote({ ...two, r: { ...two.r, ruleBased: true } }), null);
});
