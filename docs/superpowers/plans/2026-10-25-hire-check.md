# HIRE Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `/hire/` web tool, the HIRE MCP server at `/mcp/hire` and the home section "04 MCP Servers", all scoring with one shared, deterministic module built on Inês Bolaños's H.I.R.E. checklist.

**Architecture:** A pure TypeScript scoring module (`src/lib/hire/`) holds the vendored checklist, scoring, live review, reasons, validation and the `#a=` link codec. The browser island, the WebMCP tools and the MCP server all call `assess()` from it. The PDF is built in the browser with pdf-lib, which loads only when the button is clicked. The MCP server is a second route in the existing Node process.

**Tech Stack:** Astro 5, React 19 islands, Tailwind 3, GSAP via `useMatchMedia`, `@modelcontextprotocol/sdk` 1.32, zod 4, pdf-lib 1.17.1 + `@pdf-lib/fontkit`, `@fontsource/inter` (static woff), `node:test` through `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-25-hire-check-design.md` (approved 2026-10-25). Read it before any task. The framework sources it names are at `/home/limcheekin/dev/ws/evals/HIRE-AI-framework`.

## Global Constraints

- Verdict labels: only HIRE, TRAIN, DO NOT BUILD (pre-build) and HIRE, TRAIN, FIRE (live). No other verdict words.
- Bands: total ≤30 DO NOT BUILD (FIRE when live), 31–50 TRAIN, >50 HIRE. Ceiling 77, floor −55.
- The checklist's wording, "Consider" hints and red-flag strings are vendored verbatim. Anything the framework doesn't define is labelled "this tool's reading" in the UI, the PDF and the MCP output.
- Never cite `LEARNING_PLAN.md` in UI, report or MCP text.
- The web tool never sends answers over the network. The MCP server never stores or logs request bodies, including in error logs.
- An unmeasured metric is `null`. It is never `0`.
- `CLAUDE.md` animation rules apply: GSAP only inside `useGSAP`/`useMatchMedia`; animate transform and opacity only; reduced-motion branches; no loops without a pause control.
- Components use palette tokens (`src/lib/palette.mjs` → Tailwind). No raw hex or `rgba()` in components or the PDF module.
- Don't use the capitalised word `Insights` in `src/pages` or `src/components` (`npm run verify` fails on it).
- Free-text caps (web and MCP alike): agent name 80; business problem 500; job title 80; responsibilities 500; boundaries 500; KPI name 80 and target 40, at most 6 rows; R table cells 300 each; N/A reason 160; rationale 1000; next steps 500; sign-off names 80.
- Framework source commit to record: `319b20e6fb7dc0452ae25677e7cefd9309151d1d`. Licence line: `Copyright (c) 2026 Inês Bolaños` (MIT).
- No new runtime dependencies beyond `pdf-lib@1.17.1`, `@pdf-lib/fontkit@1.1.1` and `@fontsource/inter` (static woff for the PDF).

## Review Focus

1. **A half-finished assessment** (some items still `null`): the gauge shows the sum of the answered items, the verdict is "pending", and nothing throws. The test goes in Task 2.
2. **An old or hand-edited `#a=` link** (bad base64, wrong version, a field over its cap, an unknown score value): the page shows "This link can't be read" and starts a fresh assessment. It never shows a wrong verdict. The test goes in Task 6.
3. **Boundary values on the metric bands** (UCR exactly 15 and 30, PPR exactly 1.2 and 2.0, IRR exactly 40 and 60, RLR exactly 0 and 1): each lands in the band the spec's inequalities give. The test goes in Task 4.
4. **N/A chosen, then the user changes their mind**: switching N/A back to a value clears the reason, and a blank reason never validates. The tests go in Task 6 (blank reason) and Task 10 (switch back).
5. **Negative totals** (I down to −2, E down to −60, total down to −55): the gauge, the section bars and the PDF dial draw them without overflowing. The test goes in Task 8 (PDF dial angle clamps) and Task 2 (score floor).

---

## File map

```
src/lib/hire/
  checklist.ts      vendored checklist data + source/licence (pure data)
  types.ts          HireAnswers, Assessment and friends (types only)
  score.ts          section scores, Part 1 gates, red flags, pre-build band
  helpers.ts        time-saved and ROI suggestions
  live.ts           metric bands, FIRE criteria, watch items, pair readings
  reasons.ts        reasons, path to HIRE, alternatives, readings list
  assess.ts         assess(answers): Assessment (the one entry point)
  validate.ts       validateAnswers(input) (plain TS, the single rule source)
  link.ts           encode/decode the #a= payload
  example.ts        the fraud case study as HireAnswers
  pdf.ts            buildReportPdf(...) (browser and Node)
src/lib/hire-tools.ts         HIRE MCP tool definitions (zod), manifest (server/build only)
src/lib/webmcp.ts             registerWebMcpTools(), shared by both WebMCP islands
mcp/hire-server.ts            buildHireServer()
src/pages/hire/index.astro    the page (SSR intro, checklist text, credit)
src/components/hire/          HireTool.tsx and its parts
src/components/home/McpServers.astro, McpConsole.tsx
src/data/mcp-servers.ts       console transcripts and connect commands
tests/hire/*.test.ts          node:test suites
```

---

### Task 1: Test harness, types and the vendored checklist

**Files:**
- Modify: `package.json` (scripts)
- Create: `src/lib/hire/types.ts`, `src/lib/hire/checklist.ts`
- Test: `tests/hire/checklist.test.ts`
- Modify: `CLAUDE.md` (Commands: add `npm test`; replace "There is no test runner" with "Unit tests: `npm test` (node:test via tsx) for the HIRE scoring module")

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type NA = { na: string };                    // "not applicable" with its reason
  export type HScore = 1 | 2 | 3;
  export type WorstCase = 'minor' | 'moderate' | 'severe' | 'catastrophic';
  export type MetricKey = 'ucr' | 'ppr' | 'diy' | 'irr' | 'rlr';
  export type Verdict = 'HIRE' | 'TRAIN' | 'DO NOT BUILD' | 'FIRE';
  export type SignOffRole = 'productManager' | 'engineering' | 'dataAnalytics' | 'securityCompliance' | 'endUsers';
  export interface MetricInput { value: number | null; previous?: number | null; sample?: number | null; limit?: number | null }
  export interface HireAnswers {
    v: 1;
    name: string;
    isLive: boolean;
    assessmentDate: string;                            // YYYY-MM-DD
    part1: {
      canStateBusinessProblem: boolean | null;
      businessProblem?: string;
      canDefineJobAndKpis: boolean | null;
      job?: { title?: string; responsibilities?: string; boundaries?: string };
      kpis?: Array<{ name: string; target: string }>;
    };
    r: {
      ruleBased: boolean | null;
      informational: boolean | null;
      traits: { ambiguity: boolean; multiStepReasoning: boolean; intermediateStates: boolean; retrying: boolean; adapting: boolean };
      table?: Partial<Record<'rule' | 'chatbot' | 'agent', { does?: string; why?: string }>>;
    };
    h: Record<'trust' | 'culturalFit' | 'userControl' | 'changeManagement' | 'dataQuality' | 'systemIntegration' | 'interaction', HScore | null>;
    i: {
      frequency: 1 | 2 | 3 | 4 | 5 | null; timeSavings: 1 | 2 | 3 | 4 | null; roi: -5 | 0 | 5 | null; strategicValue: HScore | null;
      figures?: { unit?: 'minutes' | 'hours'; current?: number; expected?: number; buildCost?: number; annualMaintenanceCost?: number; expectedAnnualSavings?: number; currency?: string };
    };
    e: {
      worstCase: WorstCase | null;
      hitl: -5 | 0 | 5 | NA | null; security: -5 | 5 | NA | null; rollback: -5 | 5 | NA | null;
      audit: -5 | 5 | NA | null; tenant: -5 | 5 | NA | null; access: -10 | 10 | NA | null; fallback: -5 | 5 | NA | null;
    };
    review?: {                                         // present only when isLive
      launchDate: string | null;
      metrics: Record<MetricKey, MetricInput>;         // rlr.limit is never set
      maintenanceExceedsValue: boolean | null;
      betterSolution: boolean | null;
    };
    doc?: { rationale?: string; nextSteps?: string; reviewDate?: string; signOff?: Partial<Record<SignOffRole, string>> };
  }
  ```
  `Assessment` is defined in Task 5 (in `types.ts`, appended there).
- Produces (`checklist.ts`): `CHECKLIST_SOURCE = { repo: 'https://github.com/inesbolanos/HIRE-AI-framework', commit: '319b20e6fb7dc0452ae25677e7cefd9309151d1d', file: 'framework/hire-checklist.md', licence: 'MIT', copyright: 'Copyright (c) 2026 Inês Bolaños' }`, `MIT_LICENCE_TEXT` (the full text, copied from the framework's `LICENSE`), `H_ITEMS`, `I_ITEMS`, `E_GUARDRAILS`, `E_BOUNDARIES`, `WORST_CASE_OPTIONS`, `R_QUESTIONS`, `R_TRAITS`, `RED_FLAGS` (keyed `h1..h3, i1..i3, r1..r3, e1..e4`), `ALTERNATIVES`, `SIGN_OFF_ROLES`, `METRIC_DEFS` (name, unit, denominator text, guide question), `KPI_SUGGESTIONS` (the guide's Good bands: `IRR > 60%`, `DIY < 5%`, `RLR = 0%`, `UCR < 15%`, `PPR ≤ 1.2 turns`), `FLOW` (ordered `{ id, letter: 'I' | 'R' | 'E' | 'H' | 'M' | '·', title, part: 0 | 1 | 2 | 3 | 4, liveOnly?: true }`, the spec's Flow; the UI rail and `get_hire_checklist` both read it), `THRESHOLDS = { doNotBuildMax: 30, trainMax: 50, ceiling: 77 }`. Each item is `{ key, label, question, consider?: string, options: Array<{ value: number | string; label: string }> }`, with `question` and `consider` copied verbatim from `framework/hire-checklist.md` (keep its own spelling, e.g. "Strategical value", "users knowledge").

- [ ] **Step 1: Add the scripts.** In `package.json` add `"test": "tsx --test tests/hire/*.test.ts"`. Install `npm i pdf-lib@1.17.1 @pdf-lib/fontkit@1.1.1 @fontsource/inter` now, so later tasks need no install step.

- [ ] **Step 2: Write the failing test** `tests/hire/checklist.test.ts`:
  ```ts
  test('section maxima match the checklist', () => {
    const max = (items) => items.reduce((s, it) => s + Math.max(...it.options.map((o) => Number(o.value))), 0);
    assert.equal(max(H_ITEMS), 21);
    assert.equal(max(I_ITEMS), 17);
    assert.equal(max([...E_GUARDRAILS, ...E_BOUNDARIES]) - 1, 39);   // worst case: best is minor = -1
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
  ```

- [ ] **Step 3: Run** `npm test`. Expected: FAIL (cannot find module `src/lib/hire/checklist`).

- [ ] **Step 4: Write `types.ts` and `checklist.ts`** to the interfaces above, transcribing from the checklist file. Option values: H items 1–3 (`interaction`: 1 reactive, 2 mixed, 3 proactive); frequency 1–5 (annually … daily); time savings 1–4 with the checklist's four labels; ROI −5/0/5; strategic 1–3; worst case `minor`/`moderate`/`severe`/`catastrophic` with E points −1/−10/−20/none; HITL −5/0/5; security, rollback, audit, tenant and fallback −5/5; access −10 (write) / 10 (read-only). `METRIC_DEFS` denominators: UCR "all conversations"; PPR "resolved conversations (conversations that reached a resolving action)"; DIY "all conversations"; IRR "resolvable conversations (conversations with an actionable request)"; RLR "interactions (one user message plus the agent's reply)".

- [ ] **Step 5: Run** `npm test`. Expected: 3 passing.

- [ ] **Step 6: Commit**
  ```bash
  git add package.json package-lock.json src/lib/hire/types.ts src/lib/hire/checklist.ts tests/hire/checklist.test.ts CLAUDE.md
  git commit -m "feat(hire): vendor the H.I.R.E. checklist and add the test harness"
  ```

---

### Task 2: Section scores, Part 1 gates, red flags, pre-build band

**Files:**
- Create: `src/lib/hire/score.ts`
- Test: `tests/hire/score.test.ts`

**Interfaces:**
- Consumes: `HireAnswers`, `NA`, `RED_FLAGS`, `THRESHOLDS` (Task 1).
- Produces:
  ```ts
  export type StopGate = 'problem' | 'job' | 'ruleBased' | 'informational' | 'catastrophic';
  export interface Stop { gate: StopGate; message: string }
  export interface SectionScores { h: number; i: number; e: number; total: number; complete: { h: boolean; i: boolean; e: boolean } }
  export interface RedFlag { section: 'H' | 'I' | 'R' | 'E'; key: keyof typeof RED_FLAGS; text: string }
  export const isNA: (v: unknown) => v is NA;
  export function eItemScore(key: keyof HireAnswers['e'], v): number | null;  // NA → best value (+5, access +10)
  export function sectionScores(a: HireAnswers): SectionScores;               // sums answered items; null counts 0
  export function firstStop(a: HireAnswers): Stop | null;                      // checks in Part 1 order
  export function band(total: number): 'DO NOT BUILD' | 'TRAIN' | 'HIRE';
  export function redFlags(a: HireAnswers): RedFlag[];
  export function traitCount(a: HireAnswers): number;
  export function traitsNote(a: HireAnswers): string | null;   // "may not need an AI agent (N of 5 traits)" when ruleBased===false && informational===false && traitCount<3
  export function naItems(a: HireAnswers): Array<{ key: string; reason: string; score: number }>;
  ```

- [ ] **Step 1: Create `tests/hire/helpers.ts`** exporting `blankAnswers(): HireAnswers` (every score `null`, `isLive: false`, `assessmentDate: '2026-10-25'`), `allWorst()` (H all 1; I 1/1/−5/1; worst case severe; every E item at its minimum) and a temporary `fraud` built inline from the case study (Task 6 replaces it with `FRAUD_CASE`). Later tasks add their fixtures here.

- [ ] **Step 2: Write the failing tests** `tests/hire/score.test.ts`:
  ```ts
  test('fraud case scores H17 I15 E10 = 42', () => {
    const s = sectionScores(fraud);
    assert.deepEqual([s.h, s.i, s.e, s.total], [17, 15, 10, 42]);
    assert.equal(band(s.total), 'TRAIN');
  });
  test('band edges', () => {
    assert.equal(band(30), 'DO NOT BUILD'); assert.equal(band(31), 'TRAIN');
    assert.equal(band(50), 'TRAIN'); assert.equal(band(51), 'HIRE');
  });
  test('floor is -55', () => assert.equal(sectionScores(allWorst()).total, -55));     // H all 1, I 1/1/-5/1, E severe + every minimum
  test('partial answers sum what is answered and mark incomplete', () => {
    const s = sectionScores({ ...blankAnswers(), h: { ...blankAnswers().h, trust: 3 } });
    assert.equal(s.total, 3); assert.equal(s.complete.h, false);
  });
  test('N/A scores the best value', () => {
    assert.equal(eItemScore('hitl', { na: 'no critical actions' }), 5);
    assert.equal(eItemScore('access', { na: 'x' }), 10);
  });
  test('Part 1 stops, in order', () => {
    assert.equal(firstStop({ ...fraud, part1: { ...fraud.part1, canStateBusinessProblem: false } })?.gate, 'problem');
    assert.equal(firstStop({ ...fraud, part1: { ...fraud.part1, canDefineJobAndKpis: false } })?.gate, 'job');
    assert.equal(firstStop({ ...fraud, r: { ...fraud.r, ruleBased: true } })?.gate, 'ruleBased');
    assert.equal(firstStop({ ...fraud, r: { ...fraud.r, informational: true } })?.gate, 'informational');
    assert.equal(firstStop({ ...fraud, e: { ...fraud.e, worstCase: 'catastrophic' } })?.gate, 'catastrophic');
    assert.equal(firstStop(fraud), null);
  });
  test('red flag triggers', () => {
    const keys = (a) => redFlags(a).map((f) => f.key);
    assert.deepEqual(keys(fraud), []);
    assert.ok(keys({ ...fraud, h: { ...fraud.h, culturalFit: 1 } }).includes('h1'));
    assert.ok(keys({ ...fraud, i: { ...fraud.i, frequency: 2 } }).includes('i1'));
    assert.ok(keys({ ...fraud, r: { ...fraud.r, table: { ...fraud.r.table, rule: {} } } }).includes('r3'));
    assert.ok(keys({ ...fraud, e: { ...fraud.e, hitl: 0 } }).includes('e1'));   // worstCase moderate (-10) makes partial a flag
    assert.ok(!keys({ ...fraud, e: { ...fraud.e, hitl: 0, worstCase: 'minor', access: 10 } }).includes('e1'));
  });
  test('traits note, not a red flag', () => {
    const two = { ...fraud, r: { ...fraud.r, traits: { ...fraud.r.traits, intermediateStates: false } } };
    assert.equal(traitsNote(two), 'may not need an AI agent (2 of 5 traits)');
    assert.ok(!redFlags(two).some((f) => f.key === 'r3'));
  });
  ```

- [ ] **Step 3: Run** `npm test`. Expected: FAIL (`score.ts` missing).

- [ ] **Step 4: Implement `score.ts`.** Red-flag triggers, exactly as in the spec: h1 `trust===1 || culturalFit===1`; h2 `dataQuality===1`; h3 `changeManagement===1`; i1 `frequency!==null && frequency<=2`; i2 `canDefineJobAndKpis===false`; i3 `canStateBusinessProblem===false`; r1 `ruleBased===true`; r2 `informational===true`; r3 the R table's `rule.does` and `rule.why` both blank or missing; e1 `hitl===-5 || (hitl===0 && (worstCase is moderate or severe || access===-10))`; e2 `security===-5`; e3 `rollback===-5`; e4 `worstCase==='catastrophic'`. An N/A item never raises a flag. Stop messages: problem "STOP: the business problem can't be stated."; job "STOP: the job description and KPIs can't be defined."; ruleBased "Don't build an agent: use automation"; informational "Don't build an agent: use a chatbot"; catastrophic "Catastrophic failure would cause irreversible harm: DO NOT BUILD."

- [ ] **Step 5: Run** `npm test`. Expected: all passing.

- [ ] **Step 6: Commit** `git commit -m "feat(hire): section scores, Part 1 gates and red flags"` (add `src/lib/hire/score.ts tests/hire/`).

---

### Task 3: Time-saved and ROI helpers

**Files:**
- Create: `src/lib/hire/helpers.ts`
- Test: `tests/hire/helpers.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface TimeSaved { savedPerProcess: number; savedPct: number; suggestion: 1 | 2 | 3 | 4 }
  export function timeSaved(current?: number, expected?: number): TimeSaved | null;   // null when current empty or ≤0
  export interface Roi { netAnnualSavings: number; monthlyNetSavings: number; breakEvenMonths: number | 'Never'; year1RoiPct: number; suggestion: -5 | 0 | 5 }
  export function roi(buildCost?: number, annualMaintenanceCost?: number, expectedAnnualSavings?: number): Roi | null;  // null when buildCost empty or ≤0, or savings missing
  ```

- [ ] **Step 1: Write the failing tests:**
  ```ts
  test('time saved bands', () => {
    assert.equal(timeSaved(100, 90)!.suggestion, 1);   // 10%
    assert.equal(timeSaved(100, 89)!.suggestion, 2);   // 11%
    assert.equal(timeSaved(100, 80)!.suggestion, 2);   // 20%
    assert.equal(timeSaved(100, 50)!.suggestion, 3);   // 50%
    assert.equal(timeSaved(100, 49)!.suggestion, 4);
    assert.equal(timeSaved(100, 120)!.suggestion, 1);  // negative saving
    assert.equal(timeSaved(0, 5), null);
  });
  test('glossary examples', () => {
    const r = roi(300_000, 0, 400_000)!;
    assert.equal(r.year1RoiPct.toFixed(1), '33.3'); assert.equal(r.suggestion, 5);
    assert.equal(roi(300_000, 0, 360_000)!.breakEvenMonths, 10);    // $30K/month
  });
  test('ROI edges', () => {
    assert.equal(roi(300_000, 500_000, 400_000)!.breakEvenMonths, 'Never');
    assert.equal(roi(300_000, 0, 300_000)!.suggestion, 0);
    assert.equal(roi(300_000, 0, 250_000)!.suggestion, -5);     // breaks even in 14.4 months, Year-1 negative
    assert.equal(roi(0, 0, 100), null);
  });
  ```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** with the spec's formulas (`year1RoiPct = ((netAnnualSavings − buildCost) / buildCost) × 100`).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): time-saved and Year-1 ROI suggestions"`.

---

### Task 4: Live review (metric bands, FIRE criteria, watch items, pairs)

**Files:**
- Create: `src/lib/hire/live.ts`
- Test: `tests/hire/live.test.ts`

**Interfaces:**
- Consumes: `HireAnswers['review']`, `MetricKey`, `MetricInput`.
- Produces:
  ```ts
  export type Band = 'Good' | 'Warning' | 'Critical';
  export function metricBand(key: MetricKey, value: number): Band;
  export function monthsBetween(fromISO: string, toISO: string): number;      // whole calendar months, floor
  export interface FireHit { key: MetricKey | 'maintenance' | 'betterSolution'; text: string }
  export interface LiveReading {
    bands: Partial<Record<MetricKey, Band>>;
    fire: FireHit[];
    watch: string[];
    pairs: string[];
    unmeasured: MetricKey[];
    notes: string[];          // e.g. "IRR trend unknown", small-sample flags, RLR band-vs-verdict note
  }
  export function readLive(review: NonNullable<HireAnswers['review']>, assessmentDate: string): LiveReading;
  export const SMALL_SAMPLE = 30;   // display-only flag threshold (this tool's reading)
  ```

- [ ] **Step 1: Write the failing tests** (`m(values)` builds a review with the given `{ucr, ppr, diy, irr, rlr}` values, `previous` where given, launch `2026-01-01`, assessed `2026-10-25`):
  ```ts
  test('band edges', () => {
    assert.equal(metricBand('ucr', 15), 'Warning'); assert.equal(metricBand('ucr', 30), 'Warning'); assert.equal(metricBand('ucr', 30.1), 'Critical');
    assert.equal(metricBand('ppr', 1.2), 'Good');   assert.equal(metricBand('ppr', 2.0), 'Warning'); assert.equal(metricBand('ppr', 2.01), 'Critical');
    assert.equal(metricBand('diy', 5), 'Warning');  assert.equal(metricBand('diy', 15), 'Warning');
    assert.equal(metricBand('irr', 60), 'Warning'); assert.equal(metricBand('irr', 40), 'Warning'); assert.equal(metricBand('irr', 39.9), 'Critical');
    assert.equal(metricBand('rlr', 0), 'Good');     assert.equal(metricBand('rlr', 1), 'Warning');  assert.equal(metricBand('rlr', 1.01), 'Critical');
  });
  test('RLR above 0 fires although its meter says Warning', () => {
    const r = readLive(m({ rlr: 0.3 }), D);
    assert.deepEqual(r.fire.map((f) => f.key), ['rlr']); assert.equal(r.bands.rlr, 'Warning');
  });
  test('PPR critical fires only with IRR falling', () => {
    assert.deepEqual(readLive(m({ ppr: 2.4, irr: 50 }), D).fire, []);                                  // no previous: trend unknown
    assert.ok(readLive(m({ ppr: 2.4, irr: 50 }), D).notes.includes('IRR trend unknown'));
    assert.deepEqual(readLive(m({ ppr: 2.4, irr: 50, prevIrr: 55 }), D).fire.map((f) => f.key), ['ppr']);
  });
  test('DIY critical fires only after 3 months', () => {
    assert.deepEqual(readLive(m({ diy: 20 }, { launch: '2026-08-01' }), D).fire, []);
    assert.deepEqual(readLive(m({ diy: 20 }, { launch: '2026-07-25' }), D).fire.map((f) => f.key), ['diy']);
  });
  test('custom limits tighten, never loosen', () => {
    assert.deepEqual(readLive(m({ ucr: 20 }, { limits: { ucr: 18 } }), D).fire.map((f) => f.key), ['ucr']);
    assert.deepEqual(readLive(m({ irr: 45 }, { limits: { irr: 50 } }), D).fire.map((f) => f.key), ['irr']);
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
  test('booleans fire', () => {
    assert.deepEqual(readLive({ ...m({}), maintenanceExceedsValue: true, betterSolution: true }, D).fire.map((f) => f.key), ['maintenance', 'betterSolution']);
  });
  ```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement `live.ts`.** Bands, FIRE criteria (in the order UCR, PPR, DIY, RLR, IRR, maintenance, better solution), watch items (every Warning rate, plus non-firing Critical rates), and the four pair readings with the precedence rule, all exactly as in the spec's "Live agent review" section. Pair labels to start the strings with: "Narrow agent", "Clarifying before acting", "Healthy clarification", "Efficiency warning". Add a note "RLR is in the guide's Warning band, but the checklist treats any red line as FIRE" when `0 < rlr ≤ 1`. Flag a small sample in `notes` when `sample < SMALL_SAMPLE`; it never affects `fire`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): live review readings and FIRE criteria"`.

---

### Task 5: Reasons, path to HIRE, alternatives and `assess()`

**Files:**
- Create: `src/lib/hire/reasons.ts`, `src/lib/hire/assess.ts`
- Modify: `src/lib/hire/types.ts` (append `Assessment`)
- Test: `tests/hire/assess.test.ts`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces (`types.ts`):
  ```ts
  export interface PathStep { key: string; label: string; gain: number; totalAfter: number; actionable: boolean; proposed: true }
  export interface Assessment {
    mode: 'pre-build' | 'live';
    verdict: Verdict | null;            // null = pending (answers incomplete and no stop)
    decision: 'HIRE' | 'TRAIN' | 'FIRE' | null;   // the Documentation field
    meaning: string | null;             // one line for the cover
    stop: Stop | null;
    notAssessed: Array<'H' | 'I' | 'E' | 'metrics'>;
    scores: SectionScores;
    redFlags: RedFlag[];
    notes: string[];                    // traits note, N/A notes, live notes
    reasons: string[];
    pathToHire: PathStep[] | null;
    alternatives: typeof ALTERNATIVES | null;
    live: LiveReading | null;
    naItems: Array<{ key: string; reason: string; score: number }>;
    readings: string[];                 // every "this tool's reading" that applies to this result
    framework: { source: typeof CHECKLIST_SOURCE };
  }
  ```
- Produces (`reasons.ts`): `pathToHire(a: HireAnswers, total: number): PathStep[]`, `buildReasons(a, scores, flags, live): string[]`.
- Produces (`assess.ts`): `export function assess(a: HireAnswers): Assessment`.

- [ ] **Step 1: Add fixtures to `tests/hire/helpers.ts`:** `lowScore` = fraud with `hitl: -5, rollback: -5` (total 22); `withNA` = fraud with `tenant: { na: 'single-tenant internal tool' }`; `liveFraud(values)` = fraud with `isLive: true`, launch `2026-01-01`, `assessmentDate: '2026-10-25'`, the given metric values and every other rate `null`. Then write the failing tests:
  ```ts
  test('fraud case: TRAIN 42, path +20 suggest-only reaches 62', () => {
    const r = assess(fraud);
    assert.equal(r.verdict, 'TRAIN'); assert.equal(r.scores.total, 42); assert.equal(r.decision, 'TRAIN');
    assert.deepEqual(r.pathToHire!.map((s) => [s.key, s.gain, s.totalAfter]), [['access', 20, 62]]);
    assert.equal(r.alternatives, null);
  });
  test('pre-build ≤30 is DO NOT BUILD, recorded as FIRE, with alternatives and a path', () => {
    const r = assess(lowScore);   // total 28, no stop
    assert.equal(r.verdict, 'DO NOT BUILD'); assert.equal(r.decision, 'FIRE');
    assert.equal(r.alternatives!.length, 4); assert.ok(r.pathToHire);
  });
  test('a Part 1 stop: verdict now, no path, rest not assessed', () => {
    const r = assess({ ...blankAnswers(), part1: { ...blankAnswers().part1, canStateBusinessProblem: false } });
    assert.equal(r.verdict, 'DO NOT BUILD'); assert.equal(r.pathToHire, null);
    assert.deepEqual(r.notAssessed, ['H', 'I', 'E']);
  });
  test('live: stop, ≤30, R downgrade and any FIRE criterion give FIRE', () => {
    assert.equal(assess(liveFraud({ rlr: 0.3 })).verdict, 'FIRE');
    assert.equal(assess({ ...liveFraud({}), r: { ...fraud.r, ruleBased: true } }).verdict, 'FIRE');
    assert.equal(assess(liveFraud({ irr: 70, ucr: 5, ppr: 1.1, diy: 3, rlr: 0 })).verdict, 'TRAIN');   // 42, nothing fires
  });
  test('actionable levers alone always pass 50', () => {
    // H 21 + time 4 + ROI 5 + E 40, with intrinsic at worst (frequency 1, strategic 1, severe -20) = 52
    const steps = pathToHire(allWorst(), sectionScores(allWorst()).total);
    assert.ok(steps.every((s) => s.actionable)); assert.ok(steps.at(-1)!.totalAfter > 50);
  });
  test('pending while incomplete', () => assert.equal(assess(blankAnswers()).verdict, null));
  test('readings listed', () => {
    const r = assess(withNA);
    assert.ok(r.readings.some((t) => t.includes('Not applicable')));
    assert.deepEqual(r.naItems, [{ key: 'tenant', reason: 'single-tenant internal tool', score: 5 }]);
  });
  ```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** Path to HIRE, as in the spec: candidate levers are unanswered-at-best items; actionable = E guardrails and boundaries, H items, I `timeSavings` and `roi`; intrinsic = `worstCase`, `frequency`, `strategicValue`. Sort actionable levers by gain (descending, ties E → H → I in checklist order), then intrinsic the same way. N/A items are never levers. Take steps until `totalAfter > 50`. The spec's "out of reach" message is not built: the test above shows the actionable levers alone always reach at least 52, so it can never show. Show the path when the verdict is TRAIN, or a pre-build DO NOT BUILD with no stop. Alternatives show for FIRE or a pre-build DO NOT BUILD. `meaning` lines: HIRE "An AI agent is the right solution."; TRAIN "Promising: improve the weaknesses before full deployment."; DO NOT BUILD "Don't build this agent: evaluate the alternatives."; FIRE "Discontinue or downgrade this agent: evaluate the alternatives." Every rule from the spec's "Calls made" and "Decided" sections that affects this result adds its sentence to `readings`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): assess() with reasons, path to HIRE and alternatives"`.

---

### Task 6: Validator, link codec and the fraud example

**Files:**
- Create: `src/lib/hire/validate.ts`, `src/lib/hire/link.ts`, `src/lib/hire/example.ts`
- Modify: `tests/hire/helpers.ts` (replace the inline `fraud` with `FRAUD_CASE`; add `hireFixture` = `FRAUD_CASE` with `access: 10` (62 HIRE), `stopped` = `blankAnswers()` with `canStateBusinessProblem: false`, `liveFire` = `liveFraud({ rlr: 0.3 })`)
- Test: `tests/hire/validate.test.ts`, `tests/hire/link.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // validate.ts — the single source of the input rules (browser, WebMCP and MCP server all call it)
  export type Validation = { ok: true; answers: HireAnswers } | { ok: false; issues: string[] };
  export function validateAnswers(input: unknown, opts?: { requireComplete?: boolean }): Validation;
  export const TEXT_CAPS: Record<string, number>;   // the caps in Global Constraints
  // link.ts
  export const REPORT_BASE = 'https://kin.rag.wtf/hire/';
  export async function encodeAnswers(a: HireAnswers): Promise<string>;   // base64url(deflate-raw(JSON))
  export async function decodeAnswers(s: string): Promise<Validation>;    // never throws
  export async function reportUrl(a: HireAnswers): Promise<string>;       // `${REPORT_BASE}#a=${…}`
  export const LONG_LINK = 2000;
  // example.ts
  export const FRAUD_CASE: HireAnswers;   // pre-build, values from the spec's "Example" bullet
  ```

- [ ] **Step 1: Write the failing tests:**
  ```ts
  test('example validates as complete', () => assert.equal(validateAnswers(FRAUD_CASE, { requireComplete: true }).ok, true));
  test('rejects scores outside the checklist', () => {
    assert.equal(validateAnswers({ ...FRAUD_CASE, h: { ...FRAUD_CASE.h, trust: 4 } }).ok, false);
    assert.equal(validateAnswers({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, security: 0 } }).ok, false);
  });
  test('N/A needs a reason and never applies to the worst case', () => {
    assert.equal(validateAnswers({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, tenant: { na: '  ' } } }).ok, false);
    assert.equal(validateAnswers({ ...FRAUD_CASE, e: { ...FRAUD_CASE.e, worstCase: { na: 'x' } } }).ok, false);
  });
  test('caps', () => assert.equal(validateAnswers({ ...FRAUD_CASE, name: 'x'.repeat(81) }).ok, false));
  test('a stopped assessment is complete enough', () => {
    const stopped = { ...blankAnswers(), part1: { canStateBusinessProblem: false, canDefineJobAndKpis: null } };
    assert.equal(validateAnswers(stopped, { requireComplete: true }).ok, true);
  });
  test('an unstopped incomplete one is not', () => assert.equal(validateAnswers(blankAnswers(), { requireComplete: true }).ok, false));
  test('round trip and length', async () => {
    const s = await encodeAnswers(FRAUD_CASE);
    assert.deepEqual((await decodeAnswers(s) as any).answers, FRAUD_CASE);
    assert.ok((await reportUrl(FRAUD_CASE)).length < LONG_LINK);
  });
  test('garbage links never throw', async () => {
    for (const s of ['', '!!!', 'AAAA', await encodeAnswers({ ...FRAUD_CASE, v: 2 } as any)]) assert.equal((await decodeAnswers(s)).ok, false);
  });
  ```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement.** Use `CompressionStream('deflate-raw')` and `DecompressionStream` (global in Node 20 and browsers). The base64url helpers have no `Buffer`, so they work in the browser. `FRAUD_CASE` comes from the case study: name "Fraud Support Agent", `isLive: false`, the job title, responsibilities and boundaries verbatim from `case-studies/fraud-support-agent.md`, its 6 KPIs (DIY target `< 15%` with the note that cites the metrics guide's table), traits ambiguity, multi-step reasoning and intermediate states, the 3-row R table verbatim, and the scores H 2,3,3,2,3,3,1 / I 5,3,5,2 / E moderate, 5,5,5,5,5, −10, 5. The rationale carries the strict-reading note from the spec. `assessmentDate` is `'2026-08-29'` (the case study's publish date), so the fixture is stable.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): input validator, #a= link codec and the fraud example"`.

---

### Task 7: HIRE MCP server at `/mcp/hire`

**Files:**
- Create: `src/lib/hire-tools.ts`, `src/lib/hire/tools-runtime.ts`, `mcp/hire-server.ts`
- Modify: `mcp/server.ts` (routing, error logging), `nginx.conf` (new `location = /mcp/hire`), `scripts/generate-api.ts` (write `.well-known/mcp-hire.json`), `scripts/mcp-smoke.ts` (HIRE checks), `.github/workflows/ci.yaml`

**Interfaces:**
- Consumes: `assess`, `validateAnswers`, `reportUrl`, `CHECKLIST_SOURCE` and the checklist arrays.
- Produces:
  ```ts
  // src/lib/hire-tools.ts (zod; server and build only)
  export const HIRE_SERVER = { name: 'kin-hire', title: 'HIRE check', version: '1.0.0', url: `${SITE_URL}/mcp/hire` };
  export const HIRE_INSTRUCTIONS: string;
  export const HIRE_TOOLS: Record<HireToolName, { title; description; input: z.ZodRawShape; output: z.ZodRawShape }>;
  export function hireManifest(): object;     // same shape as mcpManifest(), no resources, privacy statement in description
  // src/lib/hire/tools-runtime.ts (zod-free, so the browser can use it in Task 13)
  export type HireToolName = 'get_hire_checklist' | 'assess_agent';
  export function runHireTool(name: HireToolName, input: unknown): Promise<object>;
  // get_hire_checklist → { source: CHECKLIST_SOURCE, flow: FLOW, sections: { h: H_ITEMS, i: I_ITEMS, r: { questions: R_QUESTIONS, traits: R_TRAITS }, e: { worstCase: WORST_CASE_OPTIONS, guardrails: E_GUARDRAILS, boundaries: E_BOUNDARIES } }, redFlags: RED_FLAGS, metrics: METRIC_DEFS, thresholds: THRESHOLDS, textCaps: TEXT_CAPS, readings: string[] }
  // assess_agent → { ...assess(answers), reportUrl }
  // mcp/hire-server.ts
  export function buildHireServer(): McpServer;
  ```

- [ ] **Step 1: Write the failing smoke checks** in `scripts/mcp-smoke.ts`. Parameterise `post`/`rpc` by endpoint, then add a section run against `${endpoint}/hire` with manifest `dist/.well-known/mcp-hire.json`:
  - `initialize`: `serverInfo.name === 'kin-hire'`; capabilities match the manifest.
  - `tools/list` equals the manifest's tools; every tool `readOnlyHint: true`.
  - `get_hire_checklist` returns 7 H items and 13 red flags.
  - `assess_agent` with the fraud example returns `verdict: 'TRAIN'`, `scores.total: 42` and a `reportUrl` starting `https://kin.rag.wtf/hire/#a=` (the script imports `FRAUD_CASE`).
  - `assess_agent` with `h.trust: 7` gives JSON-RPC error `-32602`; an unknown tool gives `-32602`.
  - A stopped input (`canStateBusinessProblem: false` only) returns `verdict: 'DO NOT BUILD'`.
  - Foreign Origin → 403.

- [ ] **Step 2: Run** `npm run build && (PORTFOLIO_DIR=dist node build/mcp/server.mjs &) && npm run mcp:smoke`. Expected: portfolio checks pass; HIRE checks FAIL (404 or missing manifest).

- [ ] **Step 3: Implement.**
  - `hire-tools.ts`: the zod input shape mirrors `HireAnswers` and generates the published JSON Schema.
  - `mcp/hire-server.ts`: `buildHireServer()` registers both tools with `TOOL_ANNOTATIONS`. It wraps `tools/call` (same technique as `useSpecErrorCodes`) so `validateAnswers(args, { requireComplete: true })` runs **before** the SDK handler and throws `McpError(ErrorCode.InvalidParams, issues.join('; '))`. That makes the validator the single rule source and gives -32602 deterministically.
  - `server.ts`: route `/mcp` → `buildServer()`, `/mcp/hire` → `buildHireServer()`. The 404 text names both endpoints. In the catch block, log only `err instanceof Error ? err.name : 'error'` with the path, never `err` itself. Add a comment saying why: request bodies must never reach logs.
  - `nginx.conf`: `location = /mcp/hire` is a copy of `/mcp` (same zone, so the 60/min budget is shared; state that in a comment).
  - `generate-api.ts`: write `dist/.well-known/mcp-hire.json` from `hireManifest()`.
  - CI: run `npm test` before Build; add `test -f dist/.well-known/mcp-hire.json`.

- [ ] **Step 4: Run** the Step 2 command again. Expected: "All MCP checks passed" for both servers.

- [ ] **Step 5: Commit** `git commit -m "feat(hire): HIRE MCP server at /mcp/hire"`.

---

### Task 8: PDF report

**Files:**
- Create: `src/lib/hire/pdf.ts`
- Modify: `src/lib/palette.mjs` (add `amber` and a `print` set: `print-ink`, `print-muted`, `print-rule`, `print-paper`, `print-green`, `print-amber`, `print-coral`), `DESIGN.md` (Portfolio tokens rows; widen `danger`'s role to "form errors and the FIRE / DO NOT BUILD verdict"; `amber` for the TRAIN verdict only)
- Test: `tests/hire/pdf.test.ts`

**Interfaces:**
- Consumes: `Assessment`, `HireAnswers`, checklist data, `COLORS`.
- Produces:
  ```ts
  export interface PdfDeps { PDFLib: typeof import('pdf-lib'); fontkit: unknown; regular: ArrayBuffer; bold: ArrayBuffer }
  export async function buildReportPdf(deps: PdfDeps, a: HireAnswers, r: Assessment): Promise<Uint8Array>;
  export function dialAngle(total: number): number;    // degrees across a 180° arc, clamped to [-55, 77]
  export const reportFileName: (name: string) => string;   // "HIRE-<slug>-<assessmentDate>.pdf"
  ```

- [ ] **Step 1: Write the failing tests** (Node reads the woff files from `node_modules/@fontsource/inter/files/inter-latin-{400,700}-normal.woff`):
  ```ts
  test('fraud report: A4, cover + why + detail pages, titled', async () => {
    const bytes = await buildReportPdf(deps, FRAUD_CASE, assess(FRAUD_CASE));
    const doc = await PDFLib.PDFDocument.load(bytes);
    assert.ok(doc.getPageCount() >= 3);
    assert.deepEqual(doc.getPage(0).getSize(), { width: 595.28, height: 841.89 });
    assert.equal(doc.getTitle(), 'HIRE check: Fraud Support Agent');
    assert.equal(doc.getAuthor(), 'kin.rag.wtf/hire');
  });
  test('every verdict and a stop render', async () => {
    for (const a of [hireFixture, lowScore, stopped, liveFire]) await buildReportPdf(deps, a, assess(a));
  });
  test('dial clamps', () => { assert.equal(dialAngle(-100), dialAngle(-55)); assert.equal(dialAngle(77), 180); });
  test('no raw colours in the module', () => assert.doesNotMatch(readFileSync('src/lib/hire/pdf.ts', 'utf8'), /#[0-9a-f]{6}|rgb\(\s*\d/i));
  ```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** the layout from the spec's PDF bullets: cover (name, "Should we build it?" or "Should we keep it?", dial, verdict pill, meaning, date, kin.rag.wtf/hire, unmeasured-metrics line when live); "Why"; then the detail pages in H, I, R, E order, documentation, the sign-off block, and the framework credit with `MIT_LICENCE_TEXT`. Draw the dial with `drawSvgPath` and convert tokens with a local `hexToRgb(COLORS[...])`. Use `useObjectStreams: false` only if a test needs it. Every "this tool's reading" item from `r.readings` appears on the Why page.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Then build the fraud report to a scratch file (a few lines run with `npx tsx`, writing outside the repo) and open it. The cover should show the dial at 42 in amber with a TRAIN pill.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): PDF report with pdf-lib"`.

---

### Task 9: `/hire/` page shell, Markdown copy, JSON-LD, sitemap

**Files:**
- Create: `src/pages/hire/index.astro`, `src/components/hire/ChecklistText.astro` (the full checklist, server-rendered from `checklist.ts`)
- Modify: `scripts/generate-api.ts` (`writeMarkdown('/hire/', …)`), `scripts/sitemap-lastmod.mjs` (`'/hire/': ['src/pages/hire', 'src/components/hire', 'src/lib/hire']`), `src/layouts/BaseLayout.astro` (only if needed: nothing should change)

**Interfaces:**
- Consumes: checklist data, `CHECKLIST_SOURCE`, `webPageJsonLd`, `PERSON_REF`, `PAGE_MAIN`, `PAGE_TITLE`, `MEASURE`, `Breadcrumb`.
- Produces: the page at `/hire/` with an empty mount `<HireTool client:load />` (Task 10 fills it in) and a `<noscript>` line saying the interactive check needs JavaScript and that the checklist text below is complete.

- [ ] **Step 1: Write the failing checks** in `scripts/verify-content.ts`:
  - `dist: hire page SSR` checks that the page has "Should you build that AI agent?" (h1), "Inês Bolaños", "MIT", "Trust assessment", "Catastrophic failure would cause irreversible harm" and "If you checked 3+ boxes above, you likely need an".
  - `dist: hire Markdown` checks that `dist/hire/index.md` exists and contains `# HIRE check` and the source commit.
  - `dist: hire JSON-LD` checks for `"@type":"WebApplication"` and `"isBasedOn"` pointing at the framework repo.
- [ ] **Step 2: Run** `npm run build && npm run verify:dist`. Expected: those three checks FAIL.
- [ ] **Step 3: Implement.** Title "HIRE check: should you build that AI agent? | Lim Chee Kin". Description: one sentence, at most 160 characters. JSON-LD: `webPageJsonLd('/hire/')` plus `{ '@type': 'WebApplication', name: 'HIRE check', applicationCategory: 'BusinessApplication', operatingSystem: 'Any (browser)', url, author: PERSON_REF, isBasedOn: 'https://github.com/inesbolanos/HIRE-AI-framework', license: 'https://opensource.org/license/mit' }` and `breadcrumbJsonLd(['HIRE check', '/hire/'])`. Pass `markdownUrl="/hire/index.md"`. The privacy sentence goes on the page verbatim from the spec's Goals bullet. The page uses no GSAP until Task 10.
- [ ] **Step 4: Run** `npm run build && npm run verify:dist`. Expected: all checks pass.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): /hire/ page shell, Markdown copy and JSON-LD"`.

---

### Task 10: The interactive tool, Guided mode

**Files:**
- Create: `src/components/hire/HireTool.tsx` (state, mode switch, link sync), `src/components/hire/useHireState.ts` (reducer), `src/components/hire/steps/*.tsx` (`StartStep`, `JobStep`, `RightToolStep`, `WorstCaseStep`, `ReadinessStep` for H, `ImpactStep` for I with the helpers, `GuardrailsStep` for E), `src/components/hire/Rail.tsx`, `src/components/hire/ScoreGauge.tsx`, `src/components/hire/Question.tsx` (one checklist item: verbatim question, "Consider" hint, options, N/A + reason for E items)

**Interfaces:**
- Consumes: `assess`, `validateAnswers`, `encodeAnswers`, `decodeAnswers`, `timeSaved`, `roi`, `FRAUD_CASE`, checklist data.
- Produces:
  ```ts
  export type Action =
    | { type: 'set'; path: string; value: unknown }        // dotted path into HireAnswers
    | { type: 'load'; answers: HireAnswers }
    | { type: 'reset' }
    | { type: 'startReview' };                              // isLive=true, assessmentDate=today, review defaults
  export function hireReducer(s: HireAnswers, a: Action): HireAnswers;
  export const todayISO: () => string;                       // local date, YYYY-MM-DD
  ```
  The rail and step order come from `FLOW` (Task 1).

- [ ] **Step 1: Write the failing reducer tests** `tests/hire/reducer.test.ts`:
  ```ts
  test('switching N/A back to a value clears the reason', () => {
    let s = hireReducer(blankAnswers(), { type: 'set', path: 'e.tenant', value: { na: 'single tenant' } });
    s = hireReducer(s, { type: 'set', path: 'e.tenant', value: 5 });
    assert.equal(s.e.tenant, 5);
  });
  test('startReview from an old link resets the date', () => {
    const s = hireReducer({ ...FRAUD_CASE, assessmentDate: '2025-01-01' }, { type: 'startReview' });
    assert.equal(s.isLive, true); assert.equal(s.assessmentDate, todayISO());
    assert.deepEqual(Object.values(s.review!.metrics).map((m) => m.value), [null, null, null, null, null]);
  });
  ```
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement the reducer, then the components.**
  - **Link sync:** after each change, `encodeAnswers` → `history.replaceState(null, '', '#a=' + s)` (debounced 300 ms). On load, read `#a=` with `decodeAnswers`; when it fails, show "This link can't be read" above a fresh assessment.
  - **Start step:** agent name, "Is this agent already live?", "Load example", and for a live agent an optional "Paste your original report link" field. It decodes the link, `load`s it, then dispatches `startReview`.
  - **Job step:** the KPI rows offer `KPI_SUGGESTIONS` as one-click fills. At least 1 row, 3 shown, at most 6.
  - **Stops:** a stop shows the verdict at once with "Finish the rest for the record".
  - **Gauge:** `ScoreGauge` draws −55..77 with band ticks at 30 and 50; the needle moves through `gsap.to` inside `useMatchMedia` (rotation only; under reduced motion it is set directly).
  - **Layout:** `Rail` lists the steps with their letter. Below `md` it is a sticky bottom score bar.
  - **Helpers:** the time and ROI fields show the suggestion and a "Use suggestion" button. ROI shows "Year-1 ROI" and the break-even beside it.
  - **Labels:** every rule the tool adds carries a small "this tool's reading" label, linking to a footnote on the page.
- [ ] **Step 4: Run** `npm test` (PASS), then `npm run dev` and check by hand at 1280 px and 375 px:
  - (a) "Load example" gives 42/77 TRAIN.
  - (b) "Can't state the problem" stops with DO NOT BUILD.
  - (c) Reloading the URL restores the answers.
  - (d) With reduced motion emulated, nothing moves.
  - (e) No horizontal scroll at 375 px.
- [ ] **Step 5: Commit** `git commit -m "feat(hire): interactive tool, Guided mode"`.

---

### Task 11: Live metrics step, Result view, share and PDF button

**Files:**
- Create: `src/components/hire/steps/MetricsStep.tsx`, `src/components/hire/Result.tsx`, `src/components/hire/MetricMeter.tsx`, `src/components/hire/ShareLink.tsx`, `src/components/hire/PdfButton.tsx`

**Interfaces:**
- Consumes: `Assessment`, `readLive` output (via `assess`), `buildReportPdf`, `reportFileName`, `LONG_LINK`.
- Produces: no new exports beyond components.

- [ ] **Step 1: Implement `MetricsStep`.** Each rate starts "not measured". Each shows its denominator from `METRIC_DEFS`, the previous-period value, the sample size and an optional tighter limit; the UI blocks a limit looser than Critical. PPR has a minimum of 1.0. Entering UCR 0 shows the hint about rules-only pipelines. Launch date is a date input. The maintenance question pre-suggests "Yes" when `annualMaintenanceCost > expectedAnnualSavings`.
- [ ] **Step 2: Implement `Result`.** It shows: the verdict pill; the meaning; section bars; reasons; red flags (verbatim strings); notes; N/A items with their reasons; path to HIRE (each step marked "proposed: re-score once built"); alternatives; metric meters with bands; watch items and pairs; the "FIRE check incomplete: … not measured" line. Documentation fields: rationale prefilled from `reasons`, next steps, review date defaulting to `assessmentDate + 3 months`, and the five sign-off names.
- [ ] **Step 3: Implement `ShareLink` and `PdfButton`.**
  - `ShareLink` has a copy button and the sentence "Anyone with this link can read your answers." It warns when the URL is longer than `LONG_LINK`.
  - `PdfButton` runs `Promise.all([import('pdf-lib'), import('@pdf-lib/fontkit'), fetch(regularUrl), fetch(boldUrl)])`, with the font URLs from `?url` imports of the `@fontsource/inter` woff files. It shows a busy state while it builds, then triggers the download with `reportFileName`.
- [ ] **Step 4: Verify by hand.**
  - (a) Load the example, then Download PDF. You get a 3+ page A4 file named `HIRE-fraud-support-agent-2026-08-29.pdf` with TRAIN on the cover.
  - (b) Start a review and enter RLR 0.3. The verdict is FIRE, the meter shows Warning and the note explains the difference.
  - (c) The network panel shows no request carrying answers; only the pdf-lib chunk and the two woff files load on click.
  - (d) `npm run build`: the `/hire/` page's initial JS doesn't include pdf-lib (check that the `dist/_astro` chunk for pdf-lib loads only on click).
- [ ] **Step 5: Commit** `git commit -m "feat(hire): live metrics, result view, share link and PDF download"`.

---

### Task 12: Focus mode and motion polish

**Files:**
- Create: `src/components/hire/FocusMode.tsx`
- Modify: `src/components/hire/HireTool.tsx` (mode switch), `CLAUDE.md` (scope the "ship no GSAP" note and the "no side rails" rule: `/hire/` uses GSAP for its gauge and step transitions, and its score rail is the tool's one exception)

- [ ] **Step 1: Implement Focus mode.**
  - One question per screen.
  - Keys: number keys pick the nth option and Enter continues. Both are ignored while `document.activeElement` is an `input`, `textarea` or `select`. Backspace goes back only when no field is focused.
  - The score stays hidden until the end, then a reveal plays: the gauge needle sweeps once, under 1.5 s. Under reduced motion it is set directly.
  - Switching modes keeps the answers and the current step.
- [ ] **Step 2: Add step transitions** (opacity plus `y` 8 px; motion branch only) through `useMatchMedia`.
- [ ] **Step 3: Verify by hand.**
  - Typing "15" into a currency field doesn't pick option 1 then 5.
  - Tab order is logical, and every option is reachable by keyboard in both modes.
  - In the DevTools Performance panel, only transform and opacity animate.
- [ ] **Step 4: Commit** `git commit -m "feat(hire): Focus mode and transitions"`.

---

### Task 13: WebMCP tools on `/hire/`

**Files:**
- Create: `src/lib/webmcp.ts`, `src/components/hire/HireWebMCP.tsx`
- Modify: `src/components/WebMCPTools.tsx` (use the helper; behaviour unchanged), `src/pages/hire/index.astro` (mount `<HireWebMCP client:idle manifestUrl="/.well-known/mcp-hire.json" />`)

**Interfaces:**
- Produces:
  ```ts
  export function registerWebMcpTools(manifestUrl: string, run: (name: string, input: object) => Promise<unknown> | unknown): () => void;  // returns cleanup
  ```

- [ ] **Step 1: Extract** the registration body of `WebMCPTools.tsx` into `registerWebMcpTools`, keeping its comments, the AbortSignal and the `unregisterTool` fallback.
- [ ] **Step 2: Implement `HireWebMCP`.** It calls `registerWebMcpTools(manifestUrl, (name, input) => runHireTool(name, input))` with `runHireTool` from `src/lib/hire/tools-runtime.ts` (Task 7). It runs `validateAnswers` then `assess` and `reportUrl` in the page; no network call.
- [ ] **Step 3: Verify.**
  - `npm run build`, then grep `dist/_astro` for `zod`: it isn't in any chunk the `/hire/` page loads.
  - In Chrome with the WebMCP flag (if available), call `assess_agent` with the example and get TRAIN 42. Without the flag, check the page console is clean.
- [ ] **Step 4: Commit** `git commit -m "feat(hire): WebMCP tools on /hire/, shared registration helper"`.

---

### Task 14: Home section "04 MCP Servers"

**Files:**
- Create: `src/data/mcp-servers.ts`, `src/components/home/McpServers.astro`, `src/components/home/McpConsole.tsx`
- Modify: `src/pages/index.astro` (insert after `LatestWriting`), `src/components/home/ContactCta.astro` (only if it shows a number: it doesn't today, so no change is expected), `scripts/verify-content.ts` (home order adds `id="mcp"` between writing and contact; new check `dist: mcp section SSR`), `CLAUDE.md` (home section table and "Hero, 01 … 04 MCP Servers, 05 Contact")

**Interfaces:**
- Produces:
  ```ts
  export interface McpServerCard { id: 'hire' | 'portfolio'; name: string; endpoint: string; manifest: string; connect: string; transcript: Array<{ who: '$' | 'you' | 'agent' | 'ok'; text: string }> }
  export const MCP_SERVERS: McpServerCard[];   // HIRE first
  ```
  HIRE transcript (fixed):
  - `$ claude mcp add --transport http hire https://kin.rag.wtf/mcp/hire`
  - `✓ connected · 2 tools`
  - `you › Should we build a fraud triage agent?`
  - `agent › calls get_hire_checklist, interviews you…`
  - `agent › calls assess_agent → TRAIN · 42/77`
  - `agent › Report: kin.rag.wtf/hire/#a=…`

  Portfolio transcript: the connect command for `https://kin.rag.wtf/mcp`, then `search_portfolio {"query":"MCP"}` and a one-line result.

- [ ] **Step 1: Write the failing verify checks.** In `dist: home order` add `'id="mcp"'` before `'id="contact"'`. `dist: mcp section SSR` checks that both transcripts' text, "Try HIRE in the browser", `/.well-known/mcp.json` and `/.well-known/mcp-hire.json` are all present.
- [ ] **Step 2: Run** `npm run build && npm run verify:dist`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Section:** `<section id="mcp" aria-labelledby="mcp-title" class={`border-t border-graphite pb-14 pt-16 ${GUTTER}`}>` with `SectionHeading number="04"`.
  - **Tabs:** `McpConsole` (`client:visible`) renders ARIA tabs (`role="tablist"`, arrow keys move focus, Home/End). Every transcript is in the server HTML. Inactive panels are `hidden`, not removed.
  - **Typing:** the type-in plays once per tab on its first view while the section's ScrollTrigger is active (rows fade and rise, like `AgentConsole`). Under reduced motion every panel shows complete. It never loops, so it needs no pause control.
  - **Copy button:** copies the connect command and announces "Copied" through an `aria-live` region.
  - **Links:** the "Try HIRE in the browser →" link goes to `/hire/`.
- [ ] **Step 4: Run** `npm run build && npm run verify:dist` (PASS). Then check by hand that the hero console is offscreen before this section animates (scroll at 1280×800), so the "hero console plus one Work card" budget holds.
- [ ] **Step 5: Commit** `git commit -m "feat(home): 04 MCP Servers section"`.

---

### Task 15: Agent surfaces, verify rules, CI and docs

**Files:**
- Modify: `public/llms.txt`, `public/.well-known/agent.json`, `scripts/generate-api.ts` (`api/index.json`: keep `mcp`, add `mcpServers: [{ name, url, manifest }]`; the HIRE manifest in `HTTP_RESOURCES` is not needed), `public/api/openapi.json` (add `mcpServers` to the index schema), `scripts/verify-content.ts`, `.github/workflows/ci.yaml`, `CLAUDE.md`, `README.md` (a HIRE section)

- [ ] **Step 1: Write the failing verify checks.**
  - Discovery-link check: exempt `/mcp/hire` alongside `/mcp`.
  - `dist: MCP tool names agree` also requires every `HIRE_TOOLS` name in `dist/llms.txt` and `dist/.well-known/agent.json`.
  - `dist: HIRE manifest` parses `mcp-hire.json`, checks `url === 'https://kin.rag.wtf/mcp/hire'`, and checks the description contains "never stores or logs".
- [ ] **Step 2: Run** `npm run build && npm run verify:dist`. Expected: FAIL on the agent files.
- [ ] **Step 3: Update the surfaces.**
  - **`llms.txt`:** a line for the HIRE server with both tool names and its manifest, plus a line for `/hire/`.
  - **`agent.json`:** the description names both servers. Add a `hire-check` skill with example calls, and keep the `mcp-tools` skill for the portfolio.
  - **`CLAUDE.md`:**
    - the HIRE module and its tests
    - `/mcp/hire` in the MCP server and nginx paragraphs
    - the new home section
    - the manifest file
    - "Add a HIRE tool in `hire-tools.ts` and `tools-runtime.ts`, then name it in llms.txt and the agent card"
  - **CI:** `test -f dist/hire/index.html`, `test -f dist/hire/index.md`.
- [ ] **Step 4: Run the full gate.** Expected: everything passes with no failures.
  ```bash
  npm test && npm run build && npm run verify && npm run verify:dist && \
  (PORTFOLIO_DIR=dist node build/mcp/server.mjs &) && sleep 1 && npm run mcp:smoke
  ```
- [ ] **Step 5: Commit** `git commit -m "feat(hire): agent surfaces, verify checks, CI and docs"`.
