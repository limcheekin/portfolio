import test from 'node:test';
import assert from 'node:assert/strict';
import {
  H_ITEMS, I_ITEMS, E_GUARDRAILS, E_BOUNDARIES, RED_FLAGS, ALTERNATIVES,
  SIGN_OFF_ROLES, CHECKLIST_SOURCE, MIT_LICENCE_TEXT, FIRE_CRITERIA, I_FIGURES, R_TABLE, DOCUMENTATION, E_WORST_CASE,
} from '../../src/lib/hire/checklist.ts';
import { CHECKLIST_SECTIONS, checklistMarkdown } from '../../src/lib/hire/copy.ts';

test('section maxima match the checklist', () => {
  const max = (items: Array<{ options: Array<{ value: number | string }> }>) =>
    items.reduce((s, it) => s + Math.max(...it.options.map((o) => Number(o.value))), 0);
  assert.equal(max(H_ITEMS), 21);
  assert.equal(max(I_ITEMS), 17);
  assert.equal(max([...E_GUARDRAILS, ...E_BOUNDARIES]) - 1, 39); // worst case: best is minor = -1
});

test('13 verbatim red flags, 4 alternatives, 5 sign-off roles', () => {
  assert.equal(Object.keys(RED_FLAGS).length, 13);
  assert.equal(RED_FLAGS.r3, "No clear distinction between what's automated vs. what requires reasoning");
  assert.equal(RED_FLAGS.i3, 'Building "because everyone else has AI"');
  assert.deepEqual(ALTERNATIVES.map((a) => a.name), ['Automation', 'Chatbot', 'Human Process Improvement', 'Wait']);
  assert.equal(SIGN_OFF_ROLES.length, 5);
});

test('source pinned and licensed', () => {
  assert.equal(CHECKLIST_SOURCE.commit.slice(0, 7), '319b20e');
  assert.match(MIT_LICENCE_TEXT, /Copyright \(c\) 2026 Inês Bolaños/);
});

test('FIRE criteria: 7, verbatim, keyed like the live reading', () => {
  assert.equal(FIRE_CRITERIA.criteria.length, 7);
  assert.deepEqual(FIRE_CRITERIA.criteria.map((c) => c.key), ['ucr', 'ppr', 'diy', 'rlr', 'irr', 'maintenance', 'betterSolution']);
  assert.equal(FIRE_CRITERIA.criteria[0].text, "User Correction Rate (UCR) in the critical band: the user is redoing the agent's work");
  assert.equal(FIRE_CRITERIA.criteria[3].text, 'Red Line Rate (RLR) above 0%: any violation is a compliance event, so this is the one threshold not to relax');
  assert.equal(FIRE_CRITERIA.criteria[6].text, 'A better solution is available');
  assert.match(FIRE_CRITERIA.intro, /^Deprecation criteria\. Fire the agent when a metric sits in the Critical band of the AI Agent Metrics Guide/);
});

test('the rest of the checklist text: figures, R table, worst-case STOP, documentation', () => {
  assert.deepEqual(I_FIGURES.timeSavings, ['Current time to resolve: _______ minutes/hours', 'Expected time with agent: _______ minutes/hours', 'Time saved per process: _______ minutes/hours']);
  assert.equal(I_FIGURES.roi!.length, 5);
  assert.equal(I_FIGURES.roi![3], 'Break-even timeline: _______');
  assert.deepEqual(R_TABLE.columns, ['Approach', 'What It Would Do', "Why It's Not Enough"]);
  assert.equal(R_TABLE.rows[1].why, "Why a chatbot doesn't solve this problem");
  assert.match(E_WORST_CASE.stop, /^If you selected "Catastrophic impact," DO NOT BUILD THIS AGENT\./);
  assert.deepEqual(DOCUMENTATION.fields.map((f) => f.label), ['Agent Name', 'Decision', 'Rationale', 'Next Steps', 'Review Date']);
});

test('the page and Markdown checklist carry every block, with the checklist\'s Decision wording', () => {
  const lines = CHECKLIST_SECTIONS.flatMap((s) => [s.heading, ...s.entries.flatMap((e) => [e.title, ...e.lines])]);
  const has = (t: string) => assert.ok(lines.includes(t), t);
  has('When we would FIRE this agent');
  for (const c of FIRE_CRITERIA.criteria) has(c.text);
  for (const l of [...I_FIGURES.timeSavings!, ...I_FIGURES.roi!]) has(l);
  has('Approach | What It Would Do | Why It\'s Not Enough');
  has("Rule | Explain what automation would do instead of an AI Agent | Why automation doesn't solve this problem");
  has('Decision: HIRE / TRAIN / FIRE');
  has('Rationale'); has('Next Steps'); has('Review Date: (Revisit this decision in 3-6 months)');
  has(E_WORST_CASE.stop);
  assert.ok(lines.some((l) => l.startsWith("This tool's reading: A pre-build DO NOT BUILD is recorded as FIRE")));
  assert.ok(!lines.some((l) => l.includes('DO NOT BUILD (FIRE for a live agent)')));
  const md = checklistMarkdown().join('\n');
  assert.match(md, /### When we would FIRE this agent/);
  assert.match(md, /- Decision: HIRE \/ TRAIN \/ FIRE/);
});
