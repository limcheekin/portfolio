import assert from 'node:assert/strict';
import { test } from 'node:test';
import { currentScreen, focusKey, focusScreens, isTypingField, STOP_SCREEN } from '../../src/components/hire/focus.ts';
import { hireReducer } from '../../src/components/hire/useHireState.ts';
import { blankAnswers, FRAUD_CASE } from './helpers.ts';

const el = (tagName: string, attrs: Record<string, string> = {}, isContentEditable = false) => ({
  tagName,
  isContentEditable,
  getAttribute: (n: string) => attrs[n] ?? null,
});
const key = (k: string, extra: Partial<Parameters<typeof focusKey>[0]> = {}) => ({
  key: k, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, ...extra,
});

test('one screen per scored item, every step covered, metrics only when live', () => {
  const pre = focusScreens(blankAnswers());
  const ids = pre.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const k of ['trust', 'culturalFit', 'userControl', 'changeManagement', 'dataQuality', 'systemIntegration', 'interaction']) assert.ok(ids.includes(`h.${k}`));
  for (const k of ['frequency', 'timeSavings', 'roi', 'strategicValue']) assert.ok(ids.includes(`i.${k}`));
  for (const k of ['hitl', 'security', 'rollback', 'audit', 'tenant', 'access', 'fallback']) assert.ok(ids.includes(`e.${k}`));
  assert.equal(ids[0], 'start');
  assert.equal(ids.at(-1), 'result');
  assert.ok(!ids.includes('metrics'));
  assert.deepEqual([...new Set(pre.map((s) => s.step))], ['start', 'job', 'tool', 'worst', 'human', 'impact', 'exposure', 'result']);
  const live = focusScreens({ ...blankAnswers(), isLive: true });
  assert.equal(live.length, pre.length + 1);
  assert.equal(live[live.findIndex((s) => s.id === 'worst') + 1].id, 'metrics');
  for (const s of Object.values(STOP_SCREEN)) assert.ok(ids.includes(s));
});

test('done: a blank N/A reason and a Yes job gate without a KPI are not done', () => {
  const screens = focusScreens(blankAnswers());
  const done = (id: string, a: ReturnType<typeof blankAnswers>) => screens.find((s) => s.id === id)!.done(a);
  let a = blankAnswers();
  assert.equal(done('e.tenant', a), false);
  a = hireReducer(a, { type: 'set', path: 'e.tenant', value: { na: '  ' } });
  assert.equal(done('e.tenant', a), false);
  a = hireReducer(a, { type: 'set', path: 'e.tenant', value: { na: 'single tenant' } });
  assert.equal(done('e.tenant', a), true);
  a = hireReducer(a, { type: 'set', path: 'e.tenant', value: -5 });
  assert.equal(done('e.tenant', a), true);

  assert.equal(done('job.role', a), false);
  a = hireReducer(a, { type: 'set', path: 'part1.canDefineJobAndKpis', value: true });
  assert.equal(done('job.role', a), false);
  a = hireReducer(a, { type: 'set', path: 'part1.kpis', value: [{ name: 'UCR', target: '<15%' }] });
  assert.equal(done('job.role', a), true);
  assert.equal(done('job.role', hireReducer(blankAnswers(), { type: 'set', path: 'part1.canDefineJobAndKpis', value: false })), true);
  assert.equal(done('tool.traits', blankAnswers()), true);
  for (const s of focusScreens(FRAUD_CASE)) assert.equal(s.done(FRAUD_CASE), true, s.id);
});

test('mode switch maps screens to steps and back', () => {
  const screens = focusScreens(blankAnswers());
  const at = (screenId: string, stepId: string) => screens[currentScreen(screens, screenId, stepId)].id;
  assert.equal(at('h.dataQuality', 'human'), 'h.dataQuality'); // Focus -> Guided -> Focus keeps the screen
  assert.equal(at('h.dataQuality', 'impact'), 'i.frequency'); // Guided moved on: the step's first screen
  assert.equal(at('start', 'exposure'), 'e.hitl');
  assert.equal(at('metrics', 'metrics'), 'start'); // not live: no metrics screen, fall back to the first
  assert.equal(screens.find((s) => s.id === 'tool.table')!.step, 'tool');
});

test('typing fields switch the shortcuts off; radios and checkboxes do not', () => {
  for (const t of [undefined, 'text', 'number', 'url', 'date', 'search']) {
    assert.equal(isTypingField(el('INPUT', t ? { type: t } : {})), true, String(t));
  }
  assert.equal(isTypingField(el('TEXTAREA')), true);
  assert.equal(isTypingField(el('SELECT')), true);
  assert.equal(isTypingField(el('DIV', {}, true)), true);
  assert.equal(isTypingField(el('INPUT', { type: 'radio' })), false);
  assert.equal(isTypingField(el('INPUT', { type: 'checkbox' })), false);
  assert.equal(isTypingField(el('H3')), false);
  assert.equal(isTypingField(null), false);

  // "15" typed into a currency field picks nothing
  const field = el('INPUT', { type: 'text', inputmode: 'decimal' });
  assert.equal(focusKey(key('1'), field), null);
  assert.equal(focusKey(key('5'), field), null);
  assert.equal(focusKey(key('Enter'), field), null);
  assert.equal(focusKey(key('Backspace'), field), null);
  assert.equal(focusKey(key('Backspace'), el('TEXTAREA')), null);
});

test('keys: digits pick, Enter continues, Backspace goes back; modifiers, repeats and buttons left alone', () => {
  const h = el('H3');
  assert.deepEqual(focusKey(key('1'), h), { kind: 'pick', n: 0 });
  assert.deepEqual(focusKey(key('9'), h), { kind: 'pick', n: 8 });
  assert.equal(focusKey(key('0'), h), null);
  assert.deepEqual(focusKey(key('3'), el('INPUT', { type: 'radio' })), { kind: 'pick', n: 2 });
  assert.deepEqual(focusKey(key('Enter'), h), { kind: 'next' });
  assert.deepEqual(focusKey(key('Enter'), el('INPUT', { type: 'radio' })), { kind: 'next' });
  assert.equal(focusKey(key('Enter'), el('BUTTON')), null);
  assert.equal(focusKey(key('Enter'), el('A')), null);
  assert.deepEqual(focusKey(key('Backspace'), null), { kind: 'back' });
  assert.equal(focusKey(key('Enter', { repeat: true }), h), null);
  assert.equal(focusKey(key('Backspace', { repeat: true }), h), null);
  for (const m of ['ctrlKey', 'metaKey', 'altKey', 'shiftKey'] as const) assert.equal(focusKey(key('1', { [m]: true }), h), null, m);
  assert.equal(focusKey(key('1', { isComposing: true }), h), null);
  assert.equal(focusKey(key('1', { defaultPrevented: true }), h), null);
  assert.equal(focusKey(key('a'), h), null);
});
