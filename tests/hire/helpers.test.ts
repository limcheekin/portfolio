import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roi, timeSaved } from '../../src/lib/hire/helpers.ts';

test('time saved bands', () => {
  assert.equal(timeSaved(100, 90)!.suggestion, 1);
  assert.equal(timeSaved(100, 89)!.suggestion, 2);
  assert.equal(timeSaved(100, 80)!.suggestion, 2);
  assert.equal(timeSaved(100, 50)!.suggestion, 3);
  assert.equal(timeSaved(100, 49)!.suggestion, 4);
  assert.equal(timeSaved(100, 120)!.suggestion, 1);
  assert.equal(timeSaved(0, 5), null);
  assert.equal(timeSaved(undefined, 5), null);
  assert.equal(timeSaved(100, 50)!.savedPct, 50);
});
test('glossary examples', () => {
  const r = roi(300_000, 0, 400_000)!;
  assert.equal(r.year1RoiPct.toFixed(1), '33.3');
  assert.equal(r.suggestion, 5);
  assert.equal(roi(300_000, 0, 360_000)!.breakEvenMonths, 10);
});
test('ROI edges', () => {
  assert.equal(roi(300_000, 500_000, 400_000)!.breakEvenMonths, 'Never');
  assert.equal(roi(300_000, 0, 300_000)!.suggestion, 0);
  assert.equal(roi(300_000, 0, 250_000)!.suggestion, -5);
  assert.equal(roi(0, 0, 100), null);
  assert.equal(roi(100, 0, undefined), null);
});
