# HIRE check: web tool, MCP server and home section

Date: 2026-10-25. Status: design, approved by the owner on 2026-10-25.

## Intent

Help someone decide whether an AI agent is worth building (or keeping), and say why. The owner's framing: having the courage not to build an agent is what makes great product strategy. The output is a **verdict plus its reasons**, exported as a **PDF report for a CEO or CTO**.

It is built on the H.I.R.E. framework by **Inês Bolaños** (Senior Product Analyst, PagerDuty), MIT licensed: https://github.com/inesbolanos/HIRE-AI-framework. A local clone is at `/home/limcheekin/dev/ws/evals/HIRE-AI-framework` (content read at `319b20e`; HEAD is now `0811c9d`, a merge with identical framework files). The framework repo has a checklist, a metrics guide and a Python analytics pipeline, but **no code that scores the checklist**; this is the first executable version of it.

Three deliverables, all in this repo, all on kin.rag.wtf:

1. **`/hire/` web tool**: interactive, visually polished checklist with a live verdict and a one-click PDF report.
2. **HIRE MCP server** at `https://kin.rag.wtf/mcp/hire`, **separate from** the portfolio server at `/mcp`: an agent interviews its user, then gets back the verdict, reasons and a report link.
3. **Home page section "04 MCP Servers"** presenting both MCP servers (Contact becomes 05).

## Goals

- A verdict anyone can reproduce: same answers, same verdict, in the browser and over MCP (one shared scoring module, no LLM).
- Faithful to the source. Wording, scores, gates and thresholds come from the framework files; anything the framework does not define is marked in the UI and the report as this tool's reading.
- A report a CEO/CTO will read: cover page with score dial and verdict, then the reasons.
- Covers both moments the framework covers: deciding before building, and the 3–6 month review of a live agent (including FIRE).
- Private by construction: the web tool never sends answers anywhere. The MCP path necessarily receives answers in the request (the agent posts them); the server computes in memory, never stores or logs request bodies (including in error logs), and free text is optional there. `/hire/` and the HIRE manifest state exactly this.

## Non-goals

- Computing the five agent metrics from conversation logs. That is the framework's Python pipeline; users bring their rates already calculated.
- Accounts, saved history, server-side storage, analytics on answers.
- LLM-written reasons or advice.
- Editing or extending the framework itself (no new questions, weights or metrics).
- Listing the tool in `/projects/` or adding it to the header nav (see "Calls made").

## Anti-goals (would be a failure even if it works)

- A verdict that differs from what the checklist gives for the same answers (the fraud case study must score 42/77 TRAIN).
- Presenting an invented rule as the framework's.
- Treating an unmeasured metric as 0%.
- The web tool sending answers, including free text about internal projects, to a server; or the MCP server storing or logging them.
- A page that breaks the site's animation, content or agent-first rules in `CLAUDE.md`.

## Source of truth

Read these before planning; the tool must match them.

- `framework/hire-checklist.md`: questions, scores, STOP gates, red flags, thresholds, FIRE criteria, alternatives, documentation and sign-off blocks.
- `framework/agent-metrics/ai-agent-metrics.md`: the five metrics, their Good/Warning/Critical bands, and how to read them in pairs.
- `case-studies/template.md` and `case-studies/fraud-support-agent.md`: how a completed assessment is laid out; the fraud case is the worked example (H 17, I 15, E 10 = 42/77 TRAIN, path to HIRE "suggest-only is worth +20").
- `GLOSSARY.md`: HIRE/TRAIN/FIRE definitions, ROI and break-even formulas, HITL/HOTL/HOOTL, guardrails.
- `LEARNING_PLAN.md` (the owner's, untracked): flags real scoring traps, e.g. human-in-the-loop means approval *before execution*; tenant isolation means no cross-customer learning; the RLR band vs. zero-tolerance conflict; "distinguish the one-time suitability score from continuing performance and safety gates". It is unpublished: use it to get readings right, but never cite it in UI, report or MCP text; cite the published file the point rests on instead.

Vendor the checklist content as structured data in this repo (question text, hints, options, scores, red flags), recording the source commit, so the build never fetches GitHub. The checklist is MIT licensed, so the vendored file carries its copyright notice ("Copyright (c) 2026 Inês Bolaños") and licence text, and the `/hire/` page and the PDF credit the author and link the licence.

## The assessment model

### Questions and scores (from the checklist)

- **H, Human & Habits (range 7 to 21):** 7 items across Cultural Readiness (trust, cultural fit, user control, change management plan) and Infrastructure Readiness (data quality, system integration, interaction with user: reactive 1 / mixed 2 / proactive 3). Each 1–3.
- **I, Impact & Intent (range −2 to 17):**
  - *Gates (unscored):* intent check (`canStateBusinessProblem`: STOP gate); job description (title, key responsibilities, boundaries) and KPIs with targets (`canDefineJobAndKpis`: STOP gate). When the gate passes the web UI requires at least 1 KPI row and shows 3 empty rows, like the checklist; up to 6 are supported so the fraud case study's 5 headline agent metrics + deterministic coverage all fit). The two STOP gates are explicit booleans in the shared model so MCP callers can pass the gate without providing optional free text, and opening the resulting `reportUrl` in the browser never re-evaluates empty optional text as a failed gate.
  - *Scored items:* problem frequency 1–5 (annually … daily); time savings 1–4 (0–10%, 11–20%, 21–50%, >50%); ROI −5/0/5; strategic value 1–3. (Note: I can be negative, down to −2, when ROI is −5.)
- **R, Rules vs. Responses vs. Reasoning (gate, scores 0):** rule-based? → automation. Purely informational? → chatbot. Otherwise five traits (ambiguity, multi-step reasoning, remembering intermediate states, retrying, adapting); 3+ → likely an agent. Plus the comparison table as free text: Rule, Chatbot, and (matching `case-studies/template.md` and the fraud case study) Reasoning Agent ("what it would do / why it's not enough or why it works").
- **E, Exposure & Execution (range −60 to 39):** worst case: minor −1, moderate −10, severe −20, catastrophic = DO NOT BUILD (mandatory, always counted); Guardrails & Safety (5 items): human-in-the-loop −5/0/5, deterministic security −5/5, rollback −5/5, audit trail −5/5, tenant isolation −5/5; Execution Boundaries (2 items): read-only 10 / write −10, fallback −5/5.
- **Total** = H + I + E, **range −55 to 77** (ceiling 77). ≤30 DO NOT BUILD, 31–50 TRAIN, >50 HIRE. Score dials, gauges and section bars must handle negative I, E and Total values.
- **Red flags** per section use the checklist's verbatim strings, raised deterministically from answers. The checklist lists the flags but not what raises them, so every trigger below is this tool's reading and is labeled so:
  - **H:**
    1. `"Users are resistant to automation in this area"` → `trust === 1` (or `culturalFit === 1`)
    2. `"Historical data is incomplete, inconsistent, or outdated"` → `dataQuality === 1`
    3. `"No plan for user training or change management"` → `changeManagement === 1`
  - **I:**
    4. `"Problem occurs less than 10 times per year (low ROI)"` → `frequency <= 2` (annually or quarterly)
    5. `"Can't write a clear job description"` → `canDefineJobAndKpis === false`
    6. `"Building \"because everyone else has AI\""` → `canStateBusinessProblem === false`
  - **R:**
    7. `"Using an agent for a simple rule-based task"` → `ruleBased === true`
    8. `"Expecting a chatbot to reason and make decisions"` → `informational === true`
    9. `"No clear distinction between what's automated vs. what requires reasoning"` → the R table's **Rule** row ("what it would do / why it's not enough") is left blank: the team has not said which part rules handle. Over MCP, an omitted Rule row raises it too. Separate from this flag, fewer than 3 traits shows the note `"may not need an AI agent (N of 5 traits)"` (see "Decided where the framework is silent")
  - **E:**
    10. `"No human approval for high-stakes actions"` → `hitl === -5` (or `hitl === 0` when `worstCase <= -10` or `access === -10`)
    11. `"Security decisions are made probabilistically by AI"` → `security === -5`
    12. `"No rollback or undo capability"` → `rollback === -5`
    13. `"Catastrophic failure would cause irreversible harm"` → `worstCase === 'catastrophic'`

Show each question's checklist wording and "Consider" hint verbatim, so users score against the source (see the learning plan's traps).

### Helpers computed from the user's figures (suggest, user can override)

- **Time saved:** `current` and `expected` share a single unit selector (`minutes` or `hours`), displaying derived `Time saved per process = current − expected` and `Time saved % = (current − expected) / current × 100`. Continuous half-open intervals map to the 1–4 score: `≤ 10%` → `1` (including `≤ 0%`), `(10%, 20%]` → `2`, `(20%, 50%]` → `3`, `> 50%` → `4`. No suggestion when `current` is empty or `≤ 0`.
- **ROI and break-even (glossary + checklist):** from `buildCost`, `annualMaintenanceCost` (explicitly labeled `/year`), and `expectedAnnualSavings`:
  - `netAnnualSavings = expectedAnnualSavings − annualMaintenanceCost`
  - `monthlyNetSavings = netAnnualSavings / 12`
  - `breakEvenMonths = monthlyNetSavings > 0 ? buildCost / monthlyNetSavings : "Never"`
  - `year1RoiPct = ((netAnnualSavings − buildCost) / buildCost) × 100` (matches the glossary's `(Benefit − Cost) / Cost × 100` example where `buildCost = $300K`, `expectedAnnualSavings = $400K`, `annualMaintenanceCost = $0` → `33.3%`).
  - Suggests `−5` when `year1RoiPct < 0`, `0` when `year1RoiPct === 0`, `5` when `year1RoiPct > 0`. Currency is a free label. No ROI suggestion when `buildCost` is empty or `≤ 0`.
  - The Year-1 horizon is this tool's reading (the glossary's example is Year 1; the checklist names no horizon). It suggests `−5` for an agent that breaks even in, say, 14 months, so the UI shows `breakEvenMonths` beside the suggestion and labels it "Year-1 ROI".
- **Frequency ≤ quarterly** (`1` or `2`) raises the `"Problem occurs less than 10 times per year (low ROI)"` red flag.

### Flow (decided)

The checklist says "in some sections the decision is go/no-go, while in others it's defined by a score". The tool follows that split. Order never changes the score; it lets people stop as early as possible and never asks a question before what it depends on.

0. **Start:** agent name; "Is this agent already live?"; optional "load the fraud case study example".
1. **Part 1, "Should this exist?" (go/no-go)**
   1. **I · The job:** business problem (STOP if it can't be stated), job description and KPIs (STOP if they can't be defined). Default KPI suggestions use the metrics guide's true `Good` bands (`IRR > 60%`, `DIY < 5%`, `RLR = 0%`, `UCR < 15%`, `PPR ≤ 1.2 turns`). Note: the fraud case study fixture loads its verbatim `DIY < 15%` target with a note explaining that `< 15%` is the guide's Warning ceiling rather than its `< 5%` Good band (the note cites the metrics guide's table).
   2. **R · The right tool:** classified against the job just written. Automation or chatbot → stop with that recommendation. Fewer than 3 traits → "may not need an AI agent" note, continue (see "Decided where the framework is silent").
   3. **E · Worst case:** catastrophic → DO NOT BUILD. The −1/−10/−20 carries into the E score.
2. **Live metrics** (only when the agent is live; see below).
3. **Part 2, "How ready is it?" (scored, checklist order):** H, then I (frequency, time, ROI, strategic; after R because cost depends on what is built), then E (guardrails and execution, worst case prefilled).
4. **Result** and report.

When a gate stops the assessment the verdict shows immediately, with "finish the rest for the record"; unfinished sections show as "not assessed" in the report.

The progress rail labels steps with their H/I/R/E letter. The report lays sections out in the checklist's H, I, R, E order.

### Live agent review (decided)

The checklist's documentation block says "revisit this decision in 3–6 months". The live path *is* that review: re-score the checklist with what is now known, plus the FIRE criteria.

- Answers prefill from the original report link if the user has one. Starting a review from that link sets the agent live and resets `assessmentDate` to today, so the old link's date never feeds the 3-month rule.
- **Metrics step:**
  - The five rates (`UCR %`, `PPR turns` with valid minimum `1.0`, `DIY %`, `IRR %`, `RLR %`), each defaulting to **"not measured"** (never `0%`), with optional previous-period value and sample size labeled with each metric's exact denominator from the guide and `agent_metrics.py`:
    - **UCR:** *all conversations* (if `0%` is entered, show a hint warning that rules-only pipelines report `0.0%` without LLM `correction` labels)
    - **PPR:** *resolved conversations* (conversations that reached a resolving action)
    - **DIY:** *all conversations*
    - **IRR:** *resolvable conversations* (conversations with an actionable request, not all or resolved conversations)
    - **RLR:** *total interactions* (an interaction is one user message plus the agent's reply, per the glossary; not conversations)
  - `launchDate` and `assessmentDate` (defaults to today when created, stored in the `#a=` payload so `monthsBetween(launchDate, assessmentDate) >= 3` is deterministic and opening a saved report link months later never flips the verdict).
  - Boolean questions: `"maintenance costs exceed value delivered?"` (if ROI inputs have `annualMaintenanceCost > expectedAnnualSavings`, suggest `"Yes"`) and `"a better solution is available?"`.
  - Optional per-metric tighter FIRE limits (never looser than Critical):
    - **UCR:** custom limit $L \in (0\%, 30\%]$, fires if `UCR > L`
    - **PPR:** custom limit $L \in [1.0, 2.0]$, fires if `PPR > L` and `IRR < previousIRR`
    - **DIY:** custom limit $L \in (0\%, 15\%]$, fires if `DIY > L` and live $\ge 3$ months
    - **IRR (reversed direction):** custom limit $L \in [40\%, 100\%)$, fires if `IRR < L`
    - **RLR:** not customizable (`> 0%` is already zero-tolerance in the checklist)
- **Meter bands (exact inequalities from `ai-agent-metrics.md`):**
  - **UCR:** Good `< 15%` · Warning `15% ≤ x ≤ 30%` · Critical `> 30%`
  - **PPR:** Good `1.0 ≤ x ≤ 1.2` · Warning `1.2 < x ≤ 2.0` · Critical `> 2.0`
  - **DIY:** Good `< 5%` · Warning `5% ≤ x ≤ 15%` · Critical `> 15%`
  - **IRR:** Good `> 60%` · Warning `40% ≤ x ≤ 60%` · Critical `< 40%`
  - **RLR:** Good `=== 0%` · Warning `0% < x ≤ 1%` · Critical `> 1%` (on meter; FIRE triggers at `> 0%`)
- **Verdict:**
  - **FIRE** if any checklist FIRE criterion is met, or the new total is ≤30 (this tool's reading: the template's verdict slot offers only HIRE/TRAIN/FIRE beside the ≤30 DO NOT BUILD band), or a Part 1 stop fails, or the R gate now says automation/chatbot (the glossary's FIRE includes "downgraded to chatbot or automation"). FIRE lists the checklist's four alternatives (Automation, Chatbot, Human Process Improvement, Wait).
  - **Otherwise** the new total's band: 31–50 TRAIN, >50 HIRE.
  - **Watch items and metric pairings:** Rates that don't trigger FIRE never change the verdict. Both **Warning rates** and **non-firing Critical rates** (i.e. `DIY > 15%` when live `< 3` months; `PPR > 2.0` when `IRR` is not falling or has no previous period) become watch items in the report, alongside deterministic pair readings from the metrics guide and case study:
    - *High IRR + High DIY (`IRR > 60%` and `DIY ≥ 5%`):* narrow agent — accurate on the requests it handles, but users abandon it on everything else.
    - *Warning IRR + Warning PPR (`40% ≤ IRR ≤ 60%` and `1.2 < PPR ≤ 2.0`):* clarifying before acting — when resolution isn't instant, the agent typically resolves after a clarifying question (the fraud case study's `48.9%` / `1.53` pair).
    - *PPR rising + IRR rising/flat (`PPR > previousPPR` and `IRR ≥ previousIRR`):* healthy clarification — extra turns are buying resolution.
    - *PPR warning/rising + IRR falling ((`PPR > 1.2` or `PPR > previousPPR`) and `IRR < previousIRR`, and the PPR FIRE rule did not fire):* efficiency warning — turns are rising while instant resolution falls.
    - *Precedence:* the clarifying reading shows only when there is no previous period or IRR is not falling; otherwise the trend readings replace it, so one report never calls the same pair both healthy and a warning. The pair thresholds are this tool's reading.
  - Unmeasured rates are stated on the cover, e.g. "HIRE · FIRE check incomplete: UCR, RLR not measured".
- **FIRE criteria (checklist):** `UCR > 30%` (or `> customLimit`); `PPR > 2.0` (or `> customLimit`) with `IRR < previousIRR`; `DIY > 15%` (or `> customLimit`) when `monthsBetween(launchDate, assessmentDate) >= 3`; `RLR > 0%`; `IRR < 40%` (or `< customLimit`); `maintenance > value`; `better solution available`.

### Reasons, alternatives and path to HIRE

The report's reasons are generated by fixed rules from the answers: which gates passed, strongest and weakest answers, red flags raised, metric readings.

- **"What it takes to reach HIRE"** (shown when verdict is TRAIN, or pre-build DO NOT BUILD with no Part 1 gate failure): lists the biggest available score gains in order until the total would exceed 50. Actionable product and engineering levers (**E** execution boundaries & guardrails, then **H** readiness, then **I** time savings & ROI) are ranked ahead of intrinsic problem properties (`worstCase`, `frequency`, `strategicValue`), with ties broken in E → H → I checklist order. Precisely: actionable levers sorted by gain (largest first, ties E → H → I), then intrinsic properties the same way. N/A items are not levers. If every lever together can't pass 50, the section says HIRE is out of reach with changes under the team's control. Each step is a proposed change; the report says to re-score once it is built and verified. The fraud case (`42/77`) must produce `"make it suggest-only, +20"` first, reaching `62/77 > 50` and matching the case study.
- **Alternative Solutions** (Automation, Chatbot, Human Process Improvement, Wait): shown whenever the verdict is **FIRE** or pre-build **DO NOT BUILD** (matching `hire-checklist.md`: `≤30: DO NOT BUILD, evaluate alternative solutions`).

### Documentation and sign-off (from the checklist)

Agent name, decision, rationale (generated, editable), next steps, review date (default 3 months after `assessmentDate`, editable; the checklist says 3–6), and sign-off lines for Product Manager, Engineering, Data/Analytics, Security/Compliance and End Users Representative (names optional).

The checklist's Decision field offers only HIRE / TRAIN / FIRE. A pre-build DO NOT BUILD records **FIRE** there (the checklist's closing line: "having the courage to FIRE an agent before building it"); the verdict pill and cover keep DO NOT BUILD.

## Web tool: `/hire/`

- **Two modes, freely switchable, sharing one set of answers (decided):** *Guided* (default): a few questions per screen, one step per rail item, live score gauge and running verdict in a side rail (below `md` the rail collapses to a sticky score bar). *Focus*: one question per screen, keyboard-driven (number keys pick, Enter continues; shortcuts are off while a text or number field has focus), score hidden until a reveal at the end.
- **Report link (decided):** answers are compressed (`deflate-raw` via `CompressionStream`) and base64url-encoded into the URL fragment `#a=…`, which browsers never send to a server. Opening it restores the assessment and shows the result with the PDF button. The link changes as the user answers, so it doubles as "save and share". Anyone holding the link can read the answers; say so next to the share control.
- **PDF (decided):** built in the browser on click with pdf-lib, Inter embedded and subset. The library and fonts load only on click.
  - Page 1 (decided): cover. Agent name, "Should we build it?" (or "Should we keep it?" when live), score dial, verdict pill, one-line meaning, date, kin.rag.wtf/hire.
  - Page 2: "Why": section scores, reasons, red flags, what it takes to reach HIRE and/or alternative solutions, metric meters when live.
  - Following pages: job description and KPIs, every answer by section in H, I, R, E order with the R table, documentation, sign-off block, framework credit and licence.
  - Light theme for print; verdict colours green (HIRE), amber (TRAIN), coral (DO NOT BUILD / FIRE). Define the PDF colour tokens in `src/lib/palette.mjs` so no module uses raw hex or `rgb()` literals (`CLAUDE.md` rule). The palette has no amber and no light print set yet: add both (amber is used on the page too) and list them in `DESIGN.md` "Portfolio tokens".
- **Look and motion:** the site's dark style and tokens; all `CLAUDE.md` animation rules apply (useGSAP/useMatchMedia, transform/opacity only, reduced-motion branches, no loops without a pause control). Native scrolling (no Lenis; not the home page).
- **Example:** a "Load example" control fills in the fraud case study (H `17`, I `15`, R `ruleBased = false`, `informational = false`, 3 reasoning traits checked [`ambiguity`, `multiStepReasoning`, `intermediateStates`] + the 3-row Rule/Chatbot/Reasoning Agent table, E `10` = `42/77` TRAIN). The case study doesn't list which traits it checked; these three are this tool's reading of its R section and are labeled so. The rationale carries a note: a strict reading of the checklist's wording for Human-in-the-Loop ("approve critical actions before execution") and Tenant Isolation ("not used for cross customer learning") would lower E; the example keeps the case study's scores so it reproduces 42/77.
- **WebMCP:** register the HIRE tools in browsers that support it, the way `WebMCPTools.tsx` does for the portfolio: they run the scoring module in the page and never call `/mcp/hire`, so the privacy goal holds. Register them on `/hire/` only (or lazy-load the module) so other pages don't ship it. The browser has no `zod`, so one plain-TypeScript validator in the shared module (allowed score values, non-empty N/A reasons, text caps) is the single source of the rules; the server's zod schema calls it rather than restating them.
- Server-rendered: the intro, the framework credit and the full checklist text exist in the HTML for agents and no-JS readers; the interactive tool is an island. A Markdown version of the page (`/hire/index.md`) follows the site's pattern.

## HIRE MCP server: `https://kin.rag.wtf/mcp/hire` (decided: its own server)

- Same Node process and conventions as the portfolio server (`mcp/server.ts`): stateless Streamable HTTP, POST only, JSON responses, no auth, Origin check, spec error codes, 64 KB body limit, rate-limited by nginx with JSON 429/503 (new `location = /mcp/hire`, security headers included).
- Its own server name, title, version, instructions and manifest; the portfolio server's description stays "read-only data about Lim Chee Kin".
- Tools (names are the builder's call; these are placeholders):
  - `get_hire_checklist`: the full checklist as structured data (questions, options, scores, gates, red flags, flow order, live metrics fields), so an agent can interview its user.
  - `assess_agent`: answers in (zod-validated: every score must be one of the checklist's allowed values, or "not applicable" with a reason for E guardrails and execution boundaries; when a Part 1 gate stops the assessment, only the answers up to that gate are required and the rest come back "not assessed"), out: verdict, total and section scores, gate outcome, reasons, red flags, path to HIRE or FIRE alternatives, metric readings when live, which parts are this tool's reading, and `reportUrl` (`https://kin.rag.wtf/hire/#a=…`).
- Annotations: read-only, idempotent, no open world (pure computation).
- Scoring is the same module the page uses.

## Home section "04 MCP Servers" (decided: style B, after Latest Writing)

- A console like the hero's agent console, with one tab per server (HIRE first, then Portfolio). Each tab is a fixed sample transcript: the `claude mcp add --transport http …` connect command, then a short exchange (for HIRE: question → `get_hire_checklist` → `assess_agent` → verdict and report link). A copy button for the connect command, a "Try HIRE in the browser →" link to `/hire/`, and links to each manifest.
- Transcript text is server-rendered. If it types in, it plays once when scrolled into view (not a loop), and reduced motion shows it complete. The hero console is offscreen by then, so the "at most hero console plus one Work card animate at once" rule holds; check it.
- Tabs are keyboard accessible (ARIA tabs). Contact renumbers to 05.

## Agent-first surfaces to update

`CLAUDE.md` requires every surface to move together. At least:
- `public/llms.txt` (both servers and their tools) and `.well-known/agent.json` (agent card; currently says "the read-only MCP server at /mcp").
- A manifest for the HIRE server alongside `/.well-known/mcp.json`, `api/index.json` (resource list and its `mcp` field), and `hire/index.md` generated by `scripts/generate-api.ts`.
- `mcp:smoke` (both servers: `tools/list`, a valid assessment, a rejected invalid one, error codes, Origin rule).
- `scripts/verify-content.ts` (`verify` / `verify:dist`): update home section ID order (`hero`, `work`, `career`, `writing`, `mcp`, `contact`), exempt `/mcp/hire` alongside `/mcp` in the discovery-link static-file check, check `hire/index.md`, verify both manifests and every named tool, and avoid the capitalized word `Insights` in `src/pages` or `src/components` (which `verify` forbids).
- Sitemap (`/hire/`), JSON-LD for `/hire/` (`WebApplication`, author is the site Person, `isBasedOn` the framework repo), CI's required files, and `CLAUDE.md` itself (including scoping the inner-page GSAP and home-section side-rail notes to account for `/hire/`).

## Feasibility (checked with a throwaway prototype)

Built in the scratchpad only, now discarded (nothing in the repo):
- MCP SDK server with both tools; SDK client listed tools, called the assessment (TRAIN 34/77 example), got a 723-character report link (~500 characters of free text included); an invalid `risk` value returned `-32602`.
- Headless Chromium opened the link, restored the answers, and the PDF button produced a 13 KB, 2-page A4 PDF in 0.8 s, text identical to the Node-generated one; cover dial and Inter rendering checked visually.
- The prototype's scoring reproduced the fraud case study exactly (H 17, I 15, E 10, 42/77 TRAIN, "+20 suggest-only").
- Costs found: pdf-lib + fontkit ≈ 550 KB gzip (≈ 180 KB with built-in Helvetica instead of Inter); lazy-loaded on click. pdf-lib's ESM build needs a bundler (Vite handles it).

## Calls made (the owner hasn't ruled on these; check while reading)

1. **Verdict for live agents** uses the re-scored total plus the FIRE rules; Warning and non-firing Critical rates are "watch" items, not verdict changes.
2. **"Months after launch"** means live for 3 months or more (matches the 3–6 month review cycle). Earlier, a critical DIY gives a warning, not FIRE.
3. **PPR critical without a previous period** shows "IRR trend unknown" and does not fire.
4. **RLR between 0% and 1%** shows Warning on its meter (the guide's band) but the verdict is FIRE (the checklist's zero tolerance). The report explains the difference.
5. **Report link length:** per-field caps on free text; aim for under ~2,000 characters typical; warn the user when the link gets long.
6. **PDF font:** Inter, embedded, loaded only on click.
7. **No header nav item and no `/projects/` entry:** the tool is found from the home section, `/hire/` links and the agent surfaces.
8. **Tool names** above are placeholders.
9. Verdict labels use the framework's words only (HIRE, TRAIN, DO NOT BUILD before building; HIRE, TRAIN, FIRE for a live agent); R stops read "Don't build an agent: use automation" / "…use a chatbot". The documentation block's Decision field records FIRE for a pre-build DO NOT BUILD, since the checklist offers only HIRE / TRAIN / FIRE there.
14. **Year-1 ROI** drives the ROI suggestion, with break-even shown beside it; the user can override.
15. **Default review date** is 3 months after the assessment date.
10. **"Load example" and the home console's sample run** use the fraud case as a **pre-build** assessment (42/77 TRAIN). Its published rates are rules-only and the case study calls them "a baseline, not a trigger", so they are not used as a live review.
11. **Sample size is display-only:** it never changes the verdict; the report flags small samples. A minimum would be an invented rule, and one red line in ten interactions should still fire.
12. **A live agent that fails a Part 1 stop** (catastrophic worst case, no statable problem, no job description/KPIs) gets **FIRE** with the alternatives list: every pre-build DO NOT BUILD outcome maps to FIRE once the agent exists.
13. **MCP input:** scored answers required (only up to the gate when a Part 1 gate stops); omitting the R table's Rule row raises the "No clear distinction…" red flag; free text (job description, KPIs, R table, rationale, sign-off names) optional, with the same per-field caps as the web tool, so the `reportUrl` can carry it.

## Decided where the framework is silent (owner's decisions, 2026-10-25)

Both are this tool's reading of the checklist; label them so in the UI, the report and the MCP output.

- **"Not applicable" guardrails and execution boundaries.** The checklist says "if some don't apply to your use case, adjust the score accordingly" with no rule. Every E guardrail and execution boundary (not the worst case, which is mandatory) offers "Not applicable", which scores the item's **best value** (+5; +10 for read-only vs. write) and **requires a one-line reason**. The report prints each N/A item with its reason next to the score so a reader can challenge it. Totals, ceiling and bands are unchanged. MCP input accepts N/A only with a non-empty reason.
- **Fewer than 3 of the 5 R traits.** The checklist says 3+ means "you likely need an AI agent" and nothing for fewer. With 0–2 traits (and neither rule-based nor informational) the tool **warns and continues**: the cover shows the note "may not need an AI agent (N of 5 traits)" (a note, not the checklist's red flag "No clear distinction…", which is raised by a blank Rule row), and scoring goes on to a normal verdict. It does not stop, and it does not trigger FIRE for a live agent.

## Left to the builder

File layout, component structure, state management, the exact `#a=` payload schema and versioning, PDF layout details beyond the above, copy for intros and hints (other than checklist wording, which is verbatim), how the scoring module is tested (the repo has no test runner; fixtures must include the fraud case study at 42/77 and each gate), and the manifest URL for the HIRE server.
