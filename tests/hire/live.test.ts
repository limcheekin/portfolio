import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metricBand, monthsBetween, readLive } from '../../src/lib/hire/live.ts';
import { m } from './helpers.ts';

const D = '2026-10-25';

test('band edges', () => {
  assert.equal(metricBand('ucr', 15), 'Warning'); assert.equal(metricBand('ucr', 30), 'Warning'); assert.equal(metricBand('ucr', 30.1), 'Critical');
  assert.equal(metricBand('ppr', 1.2), 'Good'); assert.equal(metricBand('ppr', 2.0), 'Warning'); assert.equal(metricBand('ppr', 2.01), 'Critical');
  assert.equal(metricBand('diy', 5), 'Warning'); assert.equal(metricBand('diy', 15), 'Warning');
  assert.equal(metricBand('irr', 60), 'Warning'); assert.equal(metricBand('irr', 40), 'Warning'); assert.equal(metricBand('irr', 39.9), 'Critical');
  assert.equal(metricBand('rlr', 0), 'Good'); assert.equal(metricBand('rlr', 1), 'Warning'); assert.equal(metricBand('rlr', 1.01), 'Critical');
});
test('monthsBetween floors whole calendar months', () => {
  assert.equal(monthsBetween('2026-07-25', D), 3);
  assert.equal(monthsBetween('2026-08-01', D), 2);
});
test('RLR above 0 fires although its meter says Warning', () => {
  const r = readLive(m({ rlr: 0.3 }), D);
  assert.deepEqual(r.fire.map((f) => f.key), ['rlr']); assert.equal(r.bands.rlr, 'Warning');
  assert.ok(r.notes.some((n) => n.startsWith('RLR is in the guide')));
});
test('PPR critical fires only with IRR falling', () => {
  assert.deepEqual(readLive(m({ ppr: 2.4, irr: 50 }), D).fire, []);
  assert.ok(readLive(m({ ppr: 2.4, irr: 50 }), D).notes.includes('IRR trend unknown'));
  assert.deepEqual(readLive(m({ ppr: 2.4, irr: 50, prevIrr: 55 }), D).fire.map((f) => f.key), ['ppr']);
});
test('DIY critical fires only after 3 months', () => {
  assert.deepEqual(readLive(m({ diy: 20 }, { launch: '2026-08-01' }), D).fire, []);
  assert.equal(readLive(m({ diy: 20 }, { launch: '2026-08-01' }), D).watch.length, 1);
  assert.deepEqual(readLive(m({ diy: 20 }, { launch: '2026-07-25' }), D).fire.map((f) => f.key), ['diy']);
});
test('custom limits tighten, never loosen', () => {
  assert.deepEqual(readLive(m({ ucr: 20 }, { limits: { ucr: 18 } }), D).fire.map((f) => f.key), ['ucr']);
  assert.deepEqual(readLive(m({ irr: 45 }, { limits: { irr: 50 } }), D).fire.map((f) => f.key), ['irr']);
  assert.deepEqual(readLive(m({ ucr: 20 }, { limits: { ucr: 40 } }), D).fire, []);
  assert.deepEqual(readLive(m({ irr: 45 }, { limits: { irr: 30 } }), D).fire, []);
});
test('unmeasured is never 0', () => {
  const r = readLive(m({ irr: 70 }), D);
  assert.deepEqual(r.unmeasured, ['ucr', 'ppr', 'diy', 'rlr']); assert.deepEqual(r.fire, []);
});
test('pair precedence: no healthy and warning for the same pair', () => {
  const noTrend = readLive(m({ irr: 48.9, ppr: 1.53 }), D).pairs;
  assert.ok(noTrend.some((p) => p.startsWith('Clarifying before acting')));
  const falling = readLive(m({ irr: 48.9, ppr: 1.53, prevIrr: 55 }), D).pairs;
  assert.ok(falling.some((p) => p.startsWith('Efficiency warning')));
  assert.ok(!falling.some((p) => p.startsWith('Clarifying before acting')));
});
test('narrow agent and healthy clarification', () => {
  assert.ok(readLive(m({ irr: 70, diy: 8 }), D).pairs.some((p) => p.startsWith('Narrow agent')));
  assert.ok(readLive(m({ irr: 62, ppr: 1.5, prevIrr: 60, prevPpr: 1.3 }), D).pairs.some((p) => p.startsWith('Healthy clarification')));
});
test('small sample is flagged, never changes fire', () => {
  const r = readLive({ ...m({ rlr: 2 }), metrics: { ...m({ rlr: 2 }).metrics, rlr: { value: 2, sample: 10 } } }, D);
  assert.deepEqual(r.fire.map((f) => f.key), ['rlr']);
  assert.ok(r.notes.some((n) => n.includes('small sample')));
});
test('booleans fire', () => {
  assert.deepEqual(readLive({ ...m({}), maintenanceExceedsValue: true, betterSolution: true }, D).fire.map((f) => f.key), ['maintenance', 'betterSolution']);
});
