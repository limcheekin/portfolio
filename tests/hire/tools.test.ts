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

test('get_hire_checklist: clients receive interview guidance through the declared output schema', async () => {
  const r = await runHireTool('get_hire_checklist', {});
  const published = z.object(HIRE_TOOLS.get_hire_checklist.output).parse(r) as Record<string, unknown>;
  assert.equal(typeof published.interviewInstructions, 'string');
  assert.ok((published.interviewInstructions as string).trim().length > 0);
});

// Characterize the shared expense-agent audit: these scores are hypothetical, not facts inferred from its job.
test('assess_agent: expense-agent verdict depends on access, and an omitted Rule row raises r3', async () => {
  const answers = {
    v: 1,
    name: 'Expense support',
    isLive: false,
    assessmentDate: '2026-10-26',
    part1: { canStateBusinessProblem: true, canDefineJobAndKpis: true },
    r: { ruleBased: false, informational: false },
    h: { trust: 2, culturalFit: 2, userControl: 3, changeManagement: 2, dataQuality: 2, systemIntegration: 2, interaction: 2 },
    i: { frequency: 5, timeSavings: 3, roi: 5, strategicValue: 2 },
    e: { worstCase: 'moderate', access: 10, hitl: 5, security: 5, rollback: 5, audit: 5, fallback: 5, tenant: 5 },
  };
  const readOnly: any = await runHireTool('assess_agent', answers);
  assert.deepEqual([readOnly.scores.h, readOnly.scores.i, readOnly.scores.e, readOnly.scores.total], [15, 15, 30, 60]);
  assert.equal(readOnly.verdict, 'HIRE');
  assert.deepEqual(readOnly.redFlags.map((f: any) => f.key), ['r3']);
  assert.ok(readOnly.readingKeys.includes('redFlags'));

  const writesDrafts: any = await runHireTool('assess_agent', { ...answers, e: { ...answers.e, access: -10 } });
  assert.equal(writesDrafts.scores.total, 40);
  assert.equal(writesDrafts.verdict, 'TRAIN');

  const comparison: any = await runHireTool('assess_agent', {
    ...answers,
    r: { ...answers.r, table: { rule: { does: 'Validate claim fields and policy limits.', why: 'Does not interpret contextual questions.' } } },
  });
  assert.deepEqual(comparison.redFlags, []);

  await assert.rejects(runHireTool('assess_agent', {
    name: answers.name, part1: answers.part1, r: answers.r, e: { worstCase: 'moderate' },
  }), (err: unknown) => {
    assert.ok(err instanceof HireInputError);
    assert.ok(err.issues.includes('i.roi: required'));
    assert.ok(err.issues.includes('e.security: required'));
    return true;
  });
});

test('get_hire_checklist: Part 1 gates, FIRE criteria, live yes/no questions, documentation', async () => {
  const r: any = await runHireTool('get_hire_checklist', {});
  assert.equal(r.gates.intent.label, 'Need vs. Hype');
  assert.equal(r.gates.intent.stop, "If you can't clearly articulate the business problem, STOP.");
  assert.equal(r.gates.role.label, 'Role Definition');
  assert.equal(r.gates.review.label, 'Performance Review');
  assert.equal(r.gates.jobStop, "If you can't define the job description and metrics of success, STOP");
  assert.match(r.gates.worstCase.stop, /DO NOT BUILD THIS AGENT/);
  assert.equal(r.fire.criteria.length, 7);
  assert.deepEqual(r.fire.liveQuestions.map((q: any) => q.field), ['review.maintenanceExceedsValue', 'review.betterSolution']);
  assert.ok(r.fire.liveQuestions.every((q: any) => r.fire.criteria.some((c: any) => c.key === q.criterion)));
  assert.equal(r.alternatives.length, 4);
  assert.equal(r.documentation.signOff.length, 5);
  assert.equal(r.documentation.fields[1].note, 'HIRE / TRAIN / FIRE');
  assert.equal(r.sections.r.table.rows.length, 2);
  assert.equal(r.figures.roi.length, 5);
  // The published output schema names the new keys (no silent passthrough).
  const json: any = z.toJSONSchema(z.object(HIRE_TOOLS.get_hire_checklist.output));
  for (const k of ['gates', 'fire', 'alternatives', 'documentation', 'figures']) assert.ok(json.required.includes(k), k);
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
