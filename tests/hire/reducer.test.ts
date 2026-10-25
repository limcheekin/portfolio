import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blankHireAnswers, hireReducer, scoringAnswers, todayISO } from '../../src/components/hire/useHireState.ts';
import { assess } from '../../src/lib/hire/assess.ts';
import { validateAnswers } from '../../src/lib/hire/validate.ts';
import { blankAnswers, FRAUD_CASE } from './helpers.ts';

test('switching N/A back to a value clears the reason', () => {
  let s = hireReducer(blankAnswers(), { type: 'set', path: 'e.tenant', value: { na: 'single tenant' } });
  s = hireReducer(s, { type: 'set', path: 'e.tenant', value: 5 });
  assert.equal(s.e.tenant, 5);
});

test('startReview from an old link resets the date', () => {
  const s = hireReducer({ ...FRAUD_CASE, assessmentDate: '2025-01-01' }, { type: 'startReview' });
  assert.equal(s.isLive, true);
  assert.equal(s.assessmentDate, todayISO());
  assert.deepEqual(Object.values(s.review!.metrics).map((m) => m.value), [null, null, null, null, null]);
});

test('todayISO is the local date as YYYY-MM-DD', () => {
  const d = new Date();
  const want = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(todayISO(), want);
});

test('set writes a dotted path without touching the input', () => {
  const a = blankAnswers();
  const s = hireReducer(a, { type: 'set', path: 'h.trust', value: 2 });
  assert.equal(s.h.trust, 2);
  assert.equal(a.h.trust, null);
  assert.notEqual(s.h, a.h);
  assert.equal(s.i, a.i, 'untouched branches are shared');
});

test('set creates missing objects and writes array rows', () => {
  let s = hireReducer(blankAnswers(), { type: 'set', path: 'part1.kpis', value: [{ name: '', target: '' }, { name: '', target: '' }] });
  s = hireReducer(s, { type: 'set', path: 'part1.kpis.1.target', value: 'IRR > 60%' });
  assert.deepEqual(s.part1.kpis, [{ name: '', target: '' }, { name: '', target: 'IRR > 60%' }]);
  s = hireReducer(s, { type: 'set', path: 'i.figures.current', value: 30 });
  assert.deepEqual(s.i.figures, { current: 30 });
  s = hireReducer(s, { type: 'set', path: 'r.table.rule.does', value: 'menu' });
  assert.deepEqual(s.r.table, { rule: { does: 'menu' } });
});

test('set with undefined removes an optional field', () => {
  let s = hireReducer(blankAnswers(), { type: 'set', path: 'i.figures.current', value: 30 });
  s = hireReducer(s, { type: 'set', path: 'i.figures.current', value: undefined });
  assert.deepEqual(s.i.figures, {});
  assert.equal('current' in s.i.figures!, false);
});

test('load replaces, reset starts a blank assessment dated today', () => {
  const s = hireReducer(blankAnswers(), { type: 'load', answers: FRAUD_CASE });
  assert.deepEqual(s, FRAUD_CASE);
  const r = hireReducer(s, { type: 'reset' });
  assert.deepEqual(r, blankHireAnswers());
  assert.equal(r.assessmentDate, todayISO());
});

test('startReview keeps the answers and the launch date, but not the old metrics', () => {
  const old = { ...FRAUD_CASE, isLive: true, review: { launchDate: '2026-01-01', metrics: { ucr: { value: 3 }, ppr: { value: 1.5 }, diy: { value: 4 }, irr: { value: 70 }, rlr: { value: 0 } }, maintenanceExceedsValue: true, betterSolution: false } };
  const s = hireReducer(old, { type: 'startReview' });
  assert.deepEqual(s.h, FRAUD_CASE.h);
  assert.equal(s.review!.launchDate, '2026-01-01');
  assert.equal(s.review!.maintenanceExceedsValue, null);
  assert.equal(s.review!.metrics.irr.value, null);
});

test('a blank N/A reason scores as unanswered and never reaches the link', () => {
  const s = hireReducer(FRAUD_CASE, { type: 'set', path: 'e.tenant', value: { na: '  ' } });
  const scored = scoringAnswers(s);
  assert.equal(scored.e.tenant, null);
  assert.equal(assess(scored).verdict, null, 'pending, not a best-value score');
  assert.equal(validateAnswers(scored).ok, true);
  const named = hireReducer(s, { type: 'set', path: 'e.tenant', value: { na: 'single tenant' } });
  assert.deepEqual(scoringAnswers(named).e.tenant, { na: 'single tenant' });
});

test('the blank state is valid and pending', () => {
  const b = blankHireAnswers();
  assert.equal(validateAnswers(b).ok, true);
  const x = assess(b);
  assert.equal(x.verdict, null);
  assert.equal(x.scores.total, 0);
});
