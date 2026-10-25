import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FRAUD_CASE } from '../../src/lib/hire/example.ts';
import { sectionScores } from '../../src/lib/hire/score.ts';
import { TEXT_CAPS, validateAnswers } from '../../src/lib/hire/validate.ts';
import { blankAnswers, liveFire, stopped } from './helpers.ts';

const bad = (x: unknown, opts?: { requireComplete?: boolean }) => {
  const r = validateAnswers(x, opts);
  assert.equal(r.ok, false);
  return r.ok ? [] : r.issues;
};

test('example validates as complete and round-trips deep-equal', () => {
  const r = validateAnswers(FRAUD_CASE, { requireComplete: true });
  assert.equal(r.ok, true);
  assert.deepEqual((r as any).answers, FRAUD_CASE);
  assert.equal(sectionScores(FRAUD_CASE).total, 42);
});

test('example text fits the caps', () => {
  for (const row of Object.values(FRAUD_CASE.r.table!)) for (const c of Object.values(row)) assert.ok(c!.length <= TEXT_CAPS.tableCell);
  assert.equal(FRAUD_CASE.part1.kpis!.length, 6);
});

test('rejects scores outside the checklist', () => {
  assert.match(bad({ ...FRAUD_CASE, h: { ...FRAUD_CASE.h, trust: 4 } })[0], /^h\.trust: must be 1, 2 or 3/);
  bad({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, security: 0 } });
  bad({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, worstCase: 'huge' } });
  bad({ ...FRAUD_CASE, i: { ...FRAUD_CASE.i, roi: 1 } });
});

test('N/A needs a reason and never applies to the worst case', () => {
  bad({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, tenant: { na: '  ' } } });
  bad({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, tenant: { na: 'x'.repeat(161) } } });
  bad({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, worstCase: { na: 'x' } } });
  bad({ ...FRAUD_CASE, h: { ...FRAUD_CASE.h, trust: { na: 'x' } } });
  assert.equal(validateAnswers({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, tenant: { na: 'single tenant' } } }).ok, true);
});

test('caps, rows, version, types, dates, unknown keys', () => {
  bad({ ...FRAUD_CASE, name: 'x'.repeat(81) });
  bad({ ...FRAUD_CASE, part1: { ...FRAUD_CASE.part1, kpis: Array(7).fill({ name: 'a', target: 'b' }) } });
  bad({ ...FRAUD_CASE, part1: { ...FRAUD_CASE.part1, kpis: [{ name: 'a', target: 'x'.repeat(41) }] } });
  bad({ ...FRAUD_CASE, v: 2 });
  bad({ ...FRAUD_CASE, isLive: 'yes' });
  bad({ ...FRAUD_CASE, assessmentDate: '2026-02-30' });
  bad({ ...FRAUD_CASE, extra: 1 });
  bad({ ...FRAUD_CASE, doc: { reviewDate: '29/08/2026' } });
  bad({ ...FRAUD_CASE, i: { ...FRAUD_CASE.i, figures: { buildCost: -1 } } });
  bad({ ...FRAUD_CASE, i: { ...FRAUD_CASE.i, figures: { buildCost: Infinity } } });
  for (const x of [null, 5, 'a', [], undefined]) bad(x);
});

test('metric ranges and limits', () => {
  const ok = (metrics: any) => validateAnswers({ ...liveFire, review: { ...liveFire.review, metrics: { ...liveFire.review!.metrics, ...metrics } } }).ok;
  assert.equal(ok({ ucr: { value: 101 } }), false);
  assert.equal(ok({ ppr: { value: 0.9 } }), false);
  assert.equal(ok({ rlr: { value: 0, limit: 1 } }), false);
  assert.equal(ok({ ucr: { value: 10, limit: 20 } }), true);
  assert.equal(validateAnswers(liveFire, { requireComplete: true }).ok, true);
  assert.equal(validateAnswers({ ...liveFire, review: { ...liveFire.review, launchDate: '2026-13-01' } }).ok, false);
});

test('partial input is normalized to blanks', () => {
  const r = validateAnswers({ name: 'x' }) as any;
  assert.equal(r.ok, true);
  assert.equal(r.answers.v, 1);
  assert.equal(r.answers.h.trust, null);
  assert.equal(r.answers.r.traits.adapting, false);
  assert.equal(r.answers.part1.canStateBusinessProblem, null);
  assert.equal('review' in r.answers, false);
  assert.match(r.answers.assessmentDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('a stopped assessment is complete enough', () => {
  assert.equal(validateAnswers(stopped, { requireComplete: true }).ok, true);
  const second = { ...blankAnswers(), part1: { canStateBusinessProblem: true, canDefineJobAndKpis: false } };
  assert.equal(validateAnswers(second, { requireComplete: true }).ok, true);
});

test('an unstopped incomplete one is not, and issues are capped', () => {
  const issues = bad(blankAnswers(), { requireComplete: true });
  assert.ok(issues.length >= 1 && issues.length <= 20);
  bad({ ...FRAUD_CASE, h: { ...FRAUD_CASE.h, trust: null } }, { requireComplete: true });
});

test('custom FIRE limits: the validator applies the UI rule (tighten, never loosen)', () => {
  const v = (k: string, limit: number) => validateAnswers({ ...liveFire, review: { ...liveFire.review, metrics: { ...liveFire.review!.metrics, [k]: { value: null, limit } } } });
  const ok = (k: string, limit: number) => assert.equal(v(k, limit).ok, true, `${k} limit ${limit}`);
  const no = (k: string, limit: number) => { const r = v(k, limit); assert.equal(r.ok, false, `${k} limit ${limit}`); return r.ok ? '' : r.issues[0]; };
  ok('ucr', 30); no('ucr', 30.1); no('ucr', 0);
  ok('ppr', 1.0); ok('ppr', 2.0); no('ppr', 2.01);
  ok('diy', 15); no('diy', 15.5);
  ok('irr', 40); ok('irr', 99); no('irr', 100); no('irr', 39);
  for (const n of [0, 0.5, 1, 50]) no('rlr', n);
  assert.equal(no('ucr', 50), 'review.metrics.ucr.limit: must be above 0% and at most 30% (never looser than Critical)');
  assert.equal(no('irr', 100), 'review.metrics.irr.limit: must be at least 40% and below 100% (never looser than Critical)');
  // An allowed limit is kept.
  assert.equal((v('ucr', 20) as any).answers.review.metrics.ucr.limit, 20);
});
