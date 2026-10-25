import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as PDFLib from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { assess } from '../../src/lib/hire/assess.ts';
import { buildReportPdf, dialAngle, reportFileName } from '../../src/lib/hire/pdf.ts';
import type { PdfDeps } from '../../src/lib/hire/pdf.ts';
import { FRAUD_CASE, hireFixture, liveFire, lowScore, stopped } from './helpers.ts';

const font = (w: number) => {
  const b = readFileSync(`node_modules/@fontsource/inter/files/inter-latin-${w}-normal.woff`);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const deps: PdfDeps = { PDFLib, fontkit, regular: font(400), bold: font(700) };

// One fraud build, shared by the tests that need it (each build embeds and subsets two fonts, ~2 s).
const fraudPdf = buildReportPdf(deps, FRAUD_CASE, assess(FRAUD_CASE)).then((b) => PDFLib.PDFDocument.load(b));

test('fraud report: A4, cover + why + detail pages, titled', async () => {
  const doc = await fraudPdf;
  assert.ok(doc.getPageCount() >= 3);
  assert.deepEqual(doc.getPage(0).getSize(), { width: 595.28, height: 841.89 });
  assert.equal(doc.getTitle(), 'HIRE check: Fraud Support Agent');
  assert.equal(doc.getAuthor(), 'kin.rag.wtf/hire');
});

test('every verdict, a stop, and a pending verdict with negative E and an N/A item render', async () => {
  // Pending (ROI unanswered), with hitl and rollback at -5 (E is -10) and tenant marked not applicable.
  const pending = {
    ...FRAUD_CASE,
    i: { ...FRAUD_CASE.i, roi: null },
    e: { ...FRAUD_CASE.e, hitl: -5 as const, rollback: -5 as const, tenant: { na: 'single tenant' } },
  };
  assert.equal(assess(pending).verdict, null);
  assert.equal(assess(pending).scores.e, -10);
  for (const a of [hireFixture, lowScore, stopped, liveFire, pending]) await buildReportPdf(deps, a, assess(a));
});

test('long text with emoji, symbols and no spaces paginates without throwing', async () => {
  const long = ('word 😀 ≤ → · ✓ 日本語 ' + 'x'.repeat(60) + ' ').repeat(40).slice(0, 1000);
  const a = {
    ...FRAUD_CASE,
    name: 'Agent 😀 ' + 'N'.repeat(80),
    part1: { ...FRAUD_CASE.part1, businessProblem: long, job: { title: long.slice(0, 80), responsibilities: long, boundaries: `${long}\n${long}` } },
    doc: { rationale: long, nextSteps: long, reviewDate: '2027-01-01', signOff: { productManager: 'Ana 😀' } },
  };
  const big = await PDFLib.PDFDocument.load(await buildReportPdf(deps, a, assess(a)));
  assert.ok(big.getPageCount() >= (await fraudPdf).getPageCount());
});

test('dial clamps', () => {
  assert.equal(dialAngle(-100), dialAngle(-55));
  assert.equal(dialAngle(-55), 0);
  assert.equal(dialAngle(77), 180);
  assert.equal(dialAngle(500), 180);
});

test('report file name', () => {
  assert.equal(reportFileName('Fraud Support Agent!', '2026-08-29'), 'HIRE-fraud-support-agent-2026-08-29.pdf');
  assert.match(reportFileName(''), /^HIRE-agent-\d{4}-\d{2}-\d{2}\.pdf$/);
});

test('no raw colours in the module', () => {
  assert.doesNotMatch(readFileSync('src/lib/hire/pdf.ts', 'utf8'), /#[0-9a-f]{6}|rgb\(\s*\d/i);
});
