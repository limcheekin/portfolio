import test from 'node:test';
import assert from 'node:assert/strict';
import {
  H_ITEMS, I_ITEMS, E_GUARDRAILS, E_BOUNDARIES, RED_FLAGS, ALTERNATIVES,
  SIGN_OFF_ROLES, CHECKLIST_SOURCE, MIT_LICENCE_TEXT,
} from '../../src/lib/hire/checklist.ts';

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
