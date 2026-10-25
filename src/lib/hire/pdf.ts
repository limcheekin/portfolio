// The HIRE check report: an A4, light-theme PDF for a CEO or CTO, built with pdf-lib.
// pdf-lib and the fonts come in through PdfDeps so the browser can lazy-load them on click.
import type * as PdfLibTypes from 'pdf-lib';
import { COLORS } from '../palette.mjs';
import {
  ALTERNATIVES, CHECKLIST_SOURCE, E_BOUNDARIES, E_GUARDRAILS, H_ITEMS, I_ITEMS, METRIC_DEFS,
  MIT_LICENCE_TEXT, R_QUESTIONS, R_TRAITS, SIGN_OFF_ROLES, WORST_CASE_OPTIONS,
} from './checklist.ts';
import type { ChecklistItem } from './checklist.ts';
import { isNA } from './score.ts';
import type { Assessment, HireAnswers, MetricKey, Verdict } from './types.ts';

export interface PdfDeps {
  PDFLib: typeof import('pdf-lib');
  fontkit: unknown;
  regular: ArrayBuffer;
  bold: ArrayBuffer;
}

const SCORE_MIN = -55;
const SCORE_MAX = 77;

/** Degrees across the 180° dial arc (0 = far left, 180 = far right) for a total, clamped to the score range. */
export function dialAngle(total: number): number {
  const t = Math.min(SCORE_MAX, Math.max(SCORE_MIN, total));
  return ((t - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 180;
}

export const reportFileName = (name: string, date: string = new Date().toISOString().slice(0, 10)): string => {
  const slug = name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return `HIRE-${slug || 'agent'}-${date}.pdf`;
};

type Token = keyof typeof COLORS;
const A4 = { w: 595.28, h: 841.89 };
const M = { x: 56, top: 60, bottom: 64 };
const CONTENT_W = A4.w - M.x * 2;

// ASCII stand-ins for characters the embedded Inter subset lacks.
const FALLBACK: Record<string, string> = {
  '≤': '<=', '≥': '>=', '→': '->', '←': '<-', '✓': 'Yes', '✔': 'Yes', '✗': 'No', '✘': 'No',
  '·': '-', '•': '-', '…': '...', '“': '"', '”': '"', '‘': "'", '’': "'", '−': '-', '×': 'x', ' ': ' ',
};

const VERDICT_TOKEN: Record<Verdict, Token> = {
  HIRE: 'print-green', TRAIN: 'print-amber', 'DO NOT BUILD': 'print-coral', FIRE: 'print-coral',
};

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// Amber is the TRAIN verdict's ink only, so a Warning band prints neutral; the band is also written out as text.
const BAND_TOKEN = { Good: 'print-green', Warning: 'print-muted', Critical: 'print-coral' } as const;
const METER_MAX: Record<MetricKey, number> = { ucr: 100, ppr: 5, diy: 100, irr: 100, rlr: 5 };
const fmtNum = (n: number) => String(Math.round(n * 100) / 100);

export async function buildReportPdf(deps: PdfDeps, a: HireAnswers, r: Assessment): Promise<Uint8Array> {
  const { PDFDocument, rgb } = deps.PDFLib;
  type PDFPage = PdfLibTypes.PDFPage;
  type PDFFont = PdfLibTypes.PDFFont;

  const doc = await PDFDocument.create();
  doc.registerFontkit(deps.fontkit as never);
  const regular = await doc.embedFont(deps.regular, { subset: true });
  const bold = await doc.embedFont(deps.bold, { subset: true });
  const regSet = new Set(regular.getCharacterSet());
  const boldSet = new Set(bold.getCharacterSet());

  const col = (t: Token) => {
    const [x, y, z] = hexToRgb(COLORS[t]);
    return rgb(x, y, z);
  };

  /** Keep only what both fonts can draw; single-line text (newlines become spaces). */
  const clean = (s: string): string => {
    let out = '';
    for (const ch of s) {
      const cp = ch.codePointAt(0)!;
      if (cp === 10 || cp === 13 || cp === 9) { out += ' '; continue; }
      if (cp < 32 || cp === 127) continue;
      if (regSet.has(cp) && boldSet.has(cp)) { out += ch; continue; }
      const f = FALLBACK[ch];
      if (f !== undefined) out += f;
    }
    return out;
  };

  let page: PDFPage = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M.top;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - M.top;
  };
  const ensure = (h: number) => { if (y - h < M.bottom) newPage(); };

  /** Break text into lines that fit maxWidth; over-long words are split by character. */
  const wrap = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const lines: string[] = [];
    for (const para of text.split(/\r?\n/)) {
      const t = clean(para).trim();
      if (!t) { lines.push(''); continue; }
      let line = '';
      for (const word of t.split(/ +/)) {
        const tryLine = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(tryLine, size) <= maxWidth) { line = tryLine; continue; }
        if (line) { lines.push(line); line = ''; }
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > maxWidth) {
          let n = rest.length;
          while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > maxWidth) n--;
          lines.push(rest.slice(0, n));
          rest = rest.slice(n);
        }
        line = rest;
      }
      lines.push(line);
    }
    return lines;
  };

  interface TextOpts { size?: number; font?: PDFFont; color?: Token; x?: number; width?: number; gap?: number; lead?: number; align?: 'left' | 'center' }

  /** Flowing paragraph with pagination. Returns nothing; advances y. */
  const para = (text: string, o: TextOpts = {}) => {
    const size = o.size ?? 10;
    const font = o.font ?? regular;
    const x = o.x ?? M.x;
    const width = o.width ?? CONTENT_W - (x - M.x);
    const lh = o.lead ?? size * 1.45;
    for (const line of wrap(text, font, size, width)) {
      ensure(lh);
      y -= lh;
      if (line) {
        const lx = o.align === 'center' ? x + (width - font.widthOfTextAtSize(line, size)) / 2 : x;
        page.drawText(line, { x: lx, y: y + size * 0.28, size, font, color: col(o.color ?? 'print-ink') });
      }
    }
    y -= o.gap ?? 0;
  };

  const h2 = (text: string) => {
    ensure(46);
    y -= 12;
    para(text, { size: 15, font: bold });
    page.drawLine({ start: { x: M.x, y: y + 2 }, end: { x: A4.w - M.x, y: y + 2 }, thickness: 0.75, color: col('print-rule') });
    y -= 6;
  };
  const h3 = (text: string, color: Token = 'print-muted') => {
    ensure(34);
    y -= 6;
    para(text.toUpperCase(), { size: 8.5, font: bold, color, gap: 2 });
  };
  const bullet = (text: string, o: TextOpts = {}) => {
    ensure((o.size ?? 10) * 1.45);
    const size = o.size ?? 10;
    page.drawCircle({ x: M.x + 3, y: y - size * 1.45 + size * 0.28 + size * 0.35, size: 1.4, color: col(o.color ?? 'print-muted') });
    para(text, { ...o, x: M.x + 14, gap: o.gap ?? 3 });
  };
  const kv = (label: string, value: string, o: { color?: Token } = {}) => {
    const lines = wrap(value || 'Not answered', regular, 10, CONTENT_W - 150);
    ensure(14.5 * Math.min(lines.length, 2));
    const top = y;
    para(label, { size: 9, color: 'print-muted', width: 140 });
    const after = y;
    y = top;
    para(value || 'Not answered', { x: M.x + 150, width: CONTENT_W - 150, color: value ? o.color : 'print-muted' });
    y = Math.min(y, after) - 3;
  };

  const verdict = r.verdict;
  const vToken: Token = verdict ? VERDICT_TOKEN[verdict] : 'print-muted';
  const vLabel = verdict ?? 'Pending';
  const nameText = clean(a.name).trim() || 'Untitled agent';
  const total = r.scores.total;

  // ---------------------------------------------------------------- Page 1: cover
  page.drawRectangle({ x: 0, y: A4.h - 10, width: A4.w, height: 10, color: col(vToken) });
  y = A4.h - 90;
  para('HIRE CHECK  |  AI AGENT READINESS REPORT', { size: 9, font: bold, color: 'print-muted', gap: 14 });
  para(nameText, { size: 30, font: bold, lead: 36, gap: 8 });
  para(a.isLive ? 'Should we keep it?' : 'Should we build it?', { size: 18, color: 'print-muted', gap: 28 });

  // dial
  const cx = A4.w / 2;
  const cy = y - 150;
  const R = 130;
  const pt = (deg: number, rad: number): [number, number] => [-rad * Math.cos((deg * Math.PI) / 180), -rad * Math.sin((deg * Math.PI) / 180)];
  const arc = (d1: number, d2: number) => {
    const [x1, y1] = pt(d1, R);
    const [x2, y2] = pt(d2, R);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const bands: Array<[number, number, Token]> = [[SCORE_MIN, 30, 'print-coral'], [30, 50, 'print-amber'], [50, SCORE_MAX, 'print-green']];
  for (const [from, to, token] of bands) {
    page.drawSvgPath(arc(dialAngle(from) + 0.6, dialAngle(to) - 0.6), { x: cx, y: cy, borderColor: col(token), borderWidth: 16 });
  }
  const ang = dialAngle(total);
  const [nx, ny] = pt(ang, R - 30);
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + nx, y: cy - ny }, thickness: 3, color: col('print-ink') });
  page.drawCircle({ x: cx, y: cy, size: 7, color: col('print-ink') });
  const tick = (v: number, label: string) => {
    const [tx, ty] = pt(dialAngle(v), R + 20);
    const w = regular.widthOfTextAtSize(label, 8);
    page.drawText(label, { x: cx + tx - w / 2, y: cy - ty - 3, size: 8, font: regular, color: col('print-muted') });
  };
  tick(SCORE_MIN, String(SCORE_MIN)); tick(30, '30'); tick(50, '50'); tick(SCORE_MAX, String(SCORE_MAX));
  const totalText = String(total);
  page.drawText(totalText, { x: cx - bold.widthOfTextAtSize(totalText, 44) / 2, y: cy - 62, size: 44, font: bold, color: col('print-ink') });
  const sub = `of ${SCORE_MAX} points${r.notAssessed.length ? ', partly assessed' : ''}`;
  page.drawText(sub, { x: cx - regular.widthOfTextAtSize(sub, 10) / 2, y: cy - 80, size: 10, font: regular, color: col('print-muted') });
  y = cy - 118;

  // verdict pill
  const pillSize = 18;
  const pillW = bold.widthOfTextAtSize(vLabel, pillSize) + 44;
  page.drawRectangle({ x: cx - pillW / 2, y: y - 14, width: pillW, height: 38, color: col(vToken), borderWidth: 0 });
  page.drawText(vLabel, { x: cx - (pillW - 44) / 2, y: y - 1, size: pillSize, font: bold, color: col('print-paper') });
  y -= 44;

  const meaning = r.stop ? r.stop.message : r.meaning ?? 'The answers are not complete yet, so there is no verdict.';
  para(meaning, { size: 12, align: 'center', x: M.x + 30, width: CONTENT_W - 60, gap: 10 });
  if (a.isLive && r.live) {
    const un = r.live.unmeasured.map((k) => k.toUpperCase());
    para(
      un.length ? `Not yet measured: ${un.join(', ')}. Unmeasured metrics are never counted as zero.` : 'All five agent metrics were measured.',
      { size: 10, color: 'print-muted', align: 'center', x: M.x + 30, width: CONTENT_W - 60, gap: 6 },
    );
  }
  y = 150;
  para(`Assessed ${a.assessmentDate}   |   ${a.isLive ? 'Live agent review' : 'Pre-build check'}`, { size: 10, color: 'print-muted', align: 'center', gap: 2 });
  para('kin.rag.wtf/hire', { size: 11, font: bold, align: 'center' });

  // ---------------------------------------------------------------- Page 2: why
  newPage();
  h2('Why');
  h3('Section scores');
  /** Horizontal meter on [min, max]: track, zero line when the range is negative, fill clamped so it never leaves the track. */
  const meter = (x: number, by: number, w: number, h: number, min: number, max: number, v: number, token: Token) => {
    page.drawRectangle({ x, y: by, width: w, height: h, color: col('print-rule') });
    const at = (n: number) => x + ((Math.min(max, Math.max(min, n)) - min) / (max - min)) * w;
    const z = at(0);
    const e = at(v);
    page.drawRectangle({ x: Math.min(z, e), y: by, width: Math.abs(e - z), height: h, color: col(token) });
    if (min < 0) page.drawLine({ start: { x: z, y: by - 2 }, end: { x: z, y: by + h + 2 }, thickness: 0.8, color: col('print-ink') });
  };
  const secRow = (label: string, v: number, min: number, max: number, done: boolean) => {
    ensure(20);
    y -= 15;
    page.drawText(label, { x: M.x, y, size: 10, font: regular, color: col('print-ink') });
    meter(M.x + 160, y - 1, 200, 9, min, max, v, v < 0 ? 'print-coral' : 'print-ink');
    const t = done ? `${v} of ${max}` : `${v} so far (partial)`;
    page.drawText(t, { x: M.x + 372, y, size: 9, font: regular, color: col('print-muted') });
    y -= 4;
  };
  secRow('Human & Habits', r.scores.h, 7, 21, r.scores.complete.h);
  secRow('Impact & Intent', r.scores.i, -2, 17, r.scores.complete.i);
  secRow('Exposure & Execution', r.scores.e, -60, 39, r.scores.complete.e);
  y -= 4;
  bullet(`Total: ${total} of ${SCORE_MAX}. Bands: 30 or less DO NOT BUILD (FIRE when live), 31 to 50 TRAIN, above 50 HIRE.`, { font: bold });
  if (r.stop) {
    h3('Stopped at a gate', 'print-coral');
    para(r.stop.message, { gap: 4 });
  }
  if (r.reasons.length) {
    h3('Reasons');
    for (const t of r.reasons) bullet(t);
  }
  if (r.redFlags.length) {
    h3('Red flags');
    for (const f of r.redFlags) bullet(`${f.section}: ${f.text}`, { color: 'print-coral' });
  }
  if (r.notes.length) {
    h3('Notes');
    for (const t of r.notes) bullet(t);
  }
  if (r.pathToHire?.length) {
    h3('What it takes to reach HIRE');
    r.pathToHire.forEach((s, i) => bullet(`${i + 1}. ${s.label} (+${s.gain}, total ${s.totalAfter}). Proposed${s.actionable ? '' : '; depends on the problem itself'}.`));
    para('Each step is a proposed change: re-score once it is built and verified.', { size: 9, color: 'print-muted', gap: 2 });
  }
  if (r.alternatives?.length) {
    h3('Alternative solutions to consider');
    for (const alt of ALTERNATIVES) bullet(`${alt.name}: ${alt.description}`);
  }
  if (a.isLive && r.live) {
    h3('Live metrics');
    const rev = a.review;
    for (const k of Object.keys(METRIC_DEFS) as MetricKey[]) {
      const def = METRIC_DEFS[k];
      const v = rev?.metrics[k]?.value ?? null;
      const band = r.live.bands[k];
      ensure(18);
      const top = y;
      para(def.name, { size: 9.5, width: 230 });
      const after = y;
      y = top;
      if (v === null || !band) para('Not measured', { x: M.x + 240, size: 9.5, color: 'print-muted' });
      else {
        const unit = def.unit === '%' ? '%' : ' turns';
        meter(M.x + 240, y - 11, 90, 8, 0, METER_MAX[k], v, BAND_TOKEN[band]);
        para(`${fmtNum(v)}${unit}  ${band}`, { x: M.x + 340, size: 9.5, font: bold, color: BAND_TOKEN[band] });
      }
      y = Math.min(y, after) - 2;
    }
    if (r.live.fire.length) { h3('FIRE criteria met', 'print-coral'); for (const f of r.live.fire) bullet(f.text, { color: 'print-coral' }); }
    if (r.live.watch.length) { h3('Watch items'); for (const t of r.live.watch) bullet(t); }
    if (r.live.pairs.length) { h3('Metric pairs'); for (const t of r.live.pairs) bullet(t); }
    if (r.live.notes.length) for (const t of r.live.notes) bullet(t);
  }
  if (r.naItems.length) {
    h3('Marked not applicable');
    for (const n of r.naItems) bullet(`${[...E_GUARDRAILS, ...E_BOUNDARIES].find((i) => i.key === n.key)?.label ?? n.key}: ${n.reason} (scored ${n.score})`);
  }
  h3("This tool's reading");
  para('The framework is silent or ambiguous on these points, so this tool says what it assumed.', { size: 9, color: 'print-muted', gap: 2 });
  for (const t of r.readings) bullet(t, { size: 9.5 });

  // ---------------------------------------------------------------- Detail pages
  newPage();
  h2('The job and its KPIs');
  kv('Business problem', a.part1.businessProblem ?? '');
  if (a.part1.canStateBusinessProblem !== null) kv('Can state the problem', a.part1.canStateBusinessProblem ? 'Yes' : 'No');
  if (a.part1.canDefineJobAndKpis !== null) kv('Can define job and KPIs', a.part1.canDefineJobAndKpis ? 'Yes' : 'No');
  kv('Job title', a.part1.job?.title ?? '');
  kv('Responsibilities', a.part1.job?.responsibilities ?? '');
  kv('Boundaries', a.part1.job?.boundaries ?? '');
  h3('KPIs');
  if (a.part1.kpis?.length) for (const k of a.part1.kpis) bullet(`${k.name}: ${k.target}`);
  else para('None listed.', { color: 'print-muted' });

  const optLabel = (item: ChecklistItem, v: unknown) => {
    if (v === null || v === undefined) return 'Not answered';
    if (isNA(v)) return `Not applicable: ${v.na}`;
    const o = item.options.find((x) => x.value === v);
    return o ? `${o.label} (${Number(v) > 0 ? '+' : ''}${v})` : String(v);
  };
  const items = (list: ChecklistItem[], src: Record<string, unknown>) => {
    for (const it of list) {
      ensure(40);
      para(it.label, { size: 10, font: bold });
      para(it.question.charAt(0).toUpperCase() + it.question.slice(1) + (it.question.endsWith('?') ? '' : ''), { size: 9, color: 'print-muted' });
      para(optLabel(it, src[it.key]), { gap: 5 });
    }
  };

  h2('Human & Habits (H)');
  items(H_ITEMS, a.h as Record<string, unknown>);
  h2('Impact & Intent (I)');
  items(I_ITEMS, a.i as unknown as Record<string, unknown>);
  const f = a.i.figures;
  if (f && Object.values(f).some((v) => v !== undefined)) {
    h3('Figures behind the ROI suggestion');
    const cur = f.currency ? `${f.currency} ` : '';
    const rows: Array<[string, unknown]> = [
      [`Time per task now (${f.unit ?? 'minutes'})`, f.current], [`Expected time per task (${f.unit ?? 'minutes'})`, f.expected],
      ['Build cost', f.buildCost === undefined ? undefined : `${cur}${f.buildCost}`],
      ['Annual maintenance cost', f.annualMaintenanceCost === undefined ? undefined : `${cur}${f.annualMaintenanceCost}`],
      ['Expected annual savings', f.expectedAnnualSavings === undefined ? undefined : `${cur}${f.expectedAnnualSavings}`],
    ];
    for (const [l, v] of rows) if (v !== undefined) kv(l, String(v));
  }

  h2('The right tool (R)');
  para(R_QUESTIONS.ruleBased.question, { font: bold, size: 10 });
  para(a.r.ruleBased === null ? 'Not answered' : a.r.ruleBased ? 'Yes' : 'No', { gap: 5 });
  para(R_QUESTIONS.informational.question, { font: bold, size: 10 });
  para(a.r.informational === null ? 'Not answered' : a.r.informational ? 'Yes' : 'No', { gap: 5 });
  para(`${R_QUESTIONS.traits} (reasoning traits)`, { font: bold, size: 10 });
  for (const t of R_TRAITS) bullet(`${t.label} ${(a.r.traits as Record<string, boolean>)[t.key] ? 'Yes' : 'No'}`, { size: 9.5 });
  const tbl = a.r.table;
  if (tbl) {
    h3('Rule-based vs chatbot vs reasoning agent');
    for (const [key, label] of [['rule', 'Rule-based automation'], ['chatbot', 'Chatbot'], ['agent', 'Reasoning agent']] as const) {
      const row = tbl[key];
      if (!row || (!row.does && !row.why)) continue;
      ensure(70);
      para(label, { font: bold, size: 10 });
      if (row.does) kv('What it does', row.does);
      if (row.why) kv('Why or why not', row.why);
    }
  }

  h2('Exposure & Execution (E)');
  const wc = WORST_CASE_OPTIONS.find((o) => o.value === a.e.worstCase);
  para('Worst case', { font: bold, size: 10 });
  para(wc ? `${wc.label} (for example ${wc.example})` : 'Not answered', { gap: 5 });
  items(E_GUARDRAILS, a.e as Record<string, unknown>);
  items(E_BOUNDARIES, a.e as Record<string, unknown>);

  if (a.isLive && a.review) {
    h2('Live review answers');
    kv('Launch date', a.review.launchDate ?? '');
    for (const k of Object.keys(METRIC_DEFS) as MetricKey[]) {
      const m = a.review.metrics[k];
      const parts = [m.value === null ? 'Not measured' : `${fmtNum(m.value)}${METRIC_DEFS[k].unit === '%' ? '%' : ' turns'}`];
      if (m.previous != null) parts.push(`previous ${fmtNum(m.previous)}`);
      if (m.sample != null) parts.push(`sample ${m.sample}`);
      if (m.limit != null) parts.push(`custom limit ${fmtNum(m.limit)}`);
      kv(METRIC_DEFS[k].name, parts.join(', '));
    }
    const yn = (v: boolean | null) => (v === null ? '' : v ? 'Yes' : 'No');
    kv('Maintenance exceeds value', yn(a.review.maintenanceExceedsValue));
    kv('A better solution exists', yn(a.review.betterSolution));
  }

  h2('Documentation');
  kv('Decision', r.decision ?? 'Pending', r.decision ? { color: VERDICT_TOKEN[r.decision] } : {});
  kv('Rationale', a.doc?.rationale ?? '');
  kv('Next steps', a.doc?.nextSteps ?? '');
  kv('Review date', a.doc?.reviewDate ?? '');
  ensure(200); // keep the five sign-off lines on one page
  h3('Sign-off');
  for (const role of SIGN_OFF_ROLES) {
    ensure(34);
    y -= 8;
    const who = clean(a.doc?.signOff?.[role.key] ?? '').trim();
    para(role.label, { size: 9, color: 'print-muted', width: 150 });
    y += 14.5;
    if (who) para(who, { x: M.x + 150, width: 200 });
    else y -= 14.5;
    const lineY = y - 2;
    page.drawLine({ start: { x: M.x + 150, y: lineY }, end: { x: M.x + 370, y: lineY }, thickness: 0.6, color: col('print-ink') });
    page.drawLine({ start: { x: M.x + 390, y: lineY }, end: { x: A4.w - M.x, y: lineY }, thickness: 0.6, color: col('print-ink') });
    page.drawText('Name or signature', { x: M.x + 150, y: lineY - 9, size: 7, font: regular, color: col('print-muted') });
    page.drawText('Date', { x: M.x + 390, y: lineY - 9, size: 7, font: regular, color: col('print-muted') });
    y = lineY - 12;
  }

  h2('Framework credit and licence');
  para(
    `This report applies the H.I.R.E. checklist (Human & Habits, Impact & Intent, Right tool, Exposure & Execution) by Inês Bolaños, ${CHECKLIST_SOURCE.licence} licensed. Source: ${CHECKLIST_SOURCE.repo}, ${CHECKLIST_SOURCE.file}, commit ${CHECKLIST_SOURCE.commit.slice(0, 7)}. Checklist wording is the framework's; points marked as this tool's reading are not. The scoring, report and verdict labels here are by kin.rag.wtf/hire.`,
    { size: 9, gap: 6 },
  );
  para(MIT_LICENCE_TEXT.replace(/\n(?!\n)/g, ' ').trim(), { size: 7.5, color: 'print-muted' });

  // ---------------------------------------------------------------- footers
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    if (i === 0) return;
    p.drawLine({ start: { x: M.x, y: 44 }, end: { x: A4.w - M.x, y: 44 }, thickness: 0.5, color: col('print-rule') });
    p.drawText(clean(`HIRE check: ${nameText}`).slice(0, 70), { x: M.x, y: 30, size: 8, font: regular, color: col('print-muted') });
    const right = `kin.rag.wtf/hire   |   Page ${i + 1} of ${pages.length}`;
    p.drawText(right, { x: A4.w - M.x - regular.widthOfTextAtSize(right, 8), y: 30, size: 8, font: regular, color: col('print-muted') });
  });

  doc.setTitle(`HIRE check: ${nameText}`);
  doc.setAuthor('kin.rag.wtf/hire');
  doc.setSubject(`${a.isLive ? 'Live agent review' : 'Pre-build check'}, ${vLabel}, ${total} of ${SCORE_MAX}`);
  doc.setCreator('kin.rag.wtf/hire');
  doc.setProducer('pdf-lib');
  return doc.save();
}
