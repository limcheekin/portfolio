import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { assess } from '../../src/lib/hire/assess.ts';
import { HireInputError, runHireTool } from '../../src/lib/hire/tools-runtime.ts';
import { HIRE_TOOLS, hireManifest } from '../../src/lib/hire-tools.ts';
import { blankAnswers, FRAUD_CASE, hireFixture, liveFire, liveFraud, lowScore, stopped, withNA } from './helpers.ts';

const input = z.object(HIRE_TOOLS.assess_agent.input);
const output = z.object(HIRE_TOOLS.assess_agent.output);

test('assess_agent: the fraud example is TRAIN 42 with a report link', async () => {
  const r: any = await runHireTool('assess_agent', FRAUD_CASE);
  assert.equal(r.verdict, 'TRAIN');
  assert.equal(r.scores.total, 42);
  assert.ok(r.reportUrl.startsWith('https://kin.rag.wtf/hire/#a='));
});

test('assess_agent: a Part 1 stop needs only its gate', async () => {
  const r: any = await runHireTool('assess_agent', { part1: { canStateBusinessProblem: false } });
  assert.equal(r.verdict, 'DO NOT BUILD');
});

test('assess_agent: bad or incomplete answers throw HireInputError with the issues', async () => {
  await assert.rejects(runHireTool('assess_agent', { ...FRAUD_CASE, h: { ...FRAUD_CASE.h, trust: 7 } }), (err: unknown) => {
    assert.ok(err instanceof HireInputError);
    assert.match(err.issues[0], /^h\.trust: must be 1, 2 or 3/);
    return true;
  });
  await assert.rejects(runHireTool('assess_agent', { name: 'x' }), HireInputError);
  await assert.rejects(runHireTool('nope' as any, {}), HireInputError);
});

test('get_hire_checklist: 7 H items, 13 red flags, every reading', async () => {
  const r: any = await runHireTool('get_hire_checklist', {});
  assert.equal(r.sections.h.length, 7);
  assert.equal(Object.keys(r.redFlags).length, 13);
  assert.ok(r.readings.length > 0);
  assert.equal(z.object(HIRE_TOOLS.get_hire_checklist.output).safeParse(r).success, true);
});

test('the published input schema accepts every valid fixture (never stricter than the validator)', () => {
  for (const a of [FRAUD_CASE, hireFixture, lowScore, withNA, stopped, liveFire, liveFraud({ ppr: 2.5, prevIrr: 70, irr: 50 }), blankAnswers()]) {
    const r = input.safeParse(a);
    assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.issues));
  }
});

test('the output schema accepts every kind of assessment: pending, stop, pre-build, live', async () => {
  for (const a of [blankAnswers(), stopped, FRAUD_CASE, lowScore, withNA, liveFire, { ...stopped, isLive: true }]) {
    const r = output.safeParse({ ...assess(a), reportUrl: 'https://kin.rag.wtf/hire/#a=x' });
    assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.issues));
  }
});

test('the manifest states the privacy rule', () => {
  assert.match(hireManifest().description, /never stores or logs/);
  assert.deepEqual(hireManifest().tools.map((t) => t.name), ['get_hire_checklist', 'assess_agent']);
});
