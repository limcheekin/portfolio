# Motion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the kin.rag.wtf home page as five calm, motion-led sections (Hero with a live agent console → pinned Selected Work track → Career → Latest Writing → Contact), and bring all content and agent-facing surfaces in line with the October 2026 CV.

**Architecture:** Astro 5 static site. Section text is server-rendered from content collections and `src/data/*`. Motion lives in React islands that share one GSAP module (`src/lib/gsap.ts`) and one Lenis instance (a `SmoothScroll` island in `BaseLayout`). A `scripts/verify-content.ts` harness is the test suite: content, label and SSR-output assertions run with `tsx`, and motion behaviour is checked in a browser against `npm run preview`.

**Tech Stack:** Astro 5, React 19 islands, Tailwind 3, gsap 3.15 (ScrollTrigger, SplitText), @gsap/react 2.1, lenis 1.3, tsx, gray-matter.

**Spec:** `docs/superpowers/specs/2026-10-18-motion-redesign-design.md` (see its *Amendments* for the 2026-10-19 changes made after the branch review, which supersede this plan where they differ). Approved mockups are in `docs/superpowers/specs/mockups/2026-10-18-motion-redesign/` (01 hero option C, 02 work track, 03 career + contact, 04 writing option A). Executors read the spec and open the mockups in a browser before any UI task.

## Global Constraints

- Stay on Astro 5. No Next.js.
- Never state an explicit years-of-experience figure ("over 25 years", "25+ years", "25+ year career") anywhere: copy, meta, JSON-LD, `llms.txt`, manifests, generated API, README, CLAUDE.md, PDF.
- Title everywhere: **"AI Solutions Architect"** (employer: Daxonet AI / Daxonet AI Sdn. Bhd.). The old title "Senior Tech Lead, AI Engineer, and Solution Architect" must not appear.
- Visible label **"Writing"** replaces "Insights" everywhere a human reads it. The URL `/insights/`, slugs, the `articles` collection name and JSON keys are unchanged.
- Palette per `DESIGN.md` plus `sky: '#38bdf8'` (open-source work only) and the home tokens in `DESIGN.md` *Portfolio tokens*.
- In our own animation code, animate only `x`, `y`, `xPercent`, `yPercent`, `scale`, `rotation` and `opacity`.
- All GSAP code uses `useGSAP(fn, { scope })` from `src/lib/gsap.ts`. Event-created tweens are wrapped in `contextSafe`. Never store tweens in `useState`. The only bare `useEffect` allowed for GSAP is the Lenis ↔ ticker bridge in `SmoothScroll`.
- Every animating component branches on `gsap.matchMedia(scope)` using `MQ` from `src/lib/motion.ts`. Under reduced motion: no x/y movement, no pin or scrub, no loops. Content is shown on its finished frame.
- Meaningful text is server-rendered. Hidden-before-reveal states are set by JS (`gsap.set`), never by CSS.
- At any moment, at most the hero console plus one active Work card animate.
- Inactive Work cards: card opacity `0.9`; illustration opacity `0.7` with `saturate(0.55)`, frozen on its finished frame.
- CI must still find these in `dist/`: `index.html`, `404.html`, `api/portfolio.json`, `api/openapi.json`, `llms-full.txt`, `llms.txt`, `ai-plugin.json`, `robots.txt`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work happens on branch `redesign/motion-2026-10`.

## Review Focus

1. **Reload or resize mid-page, below the Work section.** The pin distance and the Career and Writing trigger points realign, and nothing fires early. Pinned in Task 9 (refreshPriority + load/fonts refresh) and checked in Task 13.
2. **Keyboard user tabbing through the Work track.** Each focused card becomes active and scrolls into view inside the pinned range. Pinned in Task 9, browser step.
3. **JS disabled, or an agent fetching HTML.** All headline, card, career, writing and contact text is present. Pinned by `--dist` checks in Tasks 8–12.
4. **A 375px phone.** No horizontal page scroll, the console stacks, the track is a native swipe row with its own active card, and Career is a single column. Pinned in Tasks 8, 9 and 11, browser steps.
5. **Reduced motion switched on mid-session.** matchMedia reverts pins, loops and hidden states without a reload, and everything ends visible. Pinned in Task 9 and Task 11, browser steps.

---

## File Structure

**Create**
- `scripts/verify-content.ts`: assertion harness (`npm run verify`, flags `--dist`, `--links`).
- `src/lib/gsap.ts`: registers plugins once and re-exports `gsap`, `useGSAP`, `ScrollTrigger`, `SplitText`.
- `src/lib/motion.ts`: media-query constants.
- `src/components/motion/SmoothScroll.tsx`: the Lenis root and GSAP ticker bridge.
- `src/components/home/types.ts`: shared home types.
- `src/components/home/Hero.astro`, `HeroIntro.tsx`, `AgentConsole.tsx`, `DotGrid.tsx`
- `src/data/agent-runs.ts`
- `src/components/home/WorkTrack.tsx`
- `src/components/home/visuals/useVisualTimeline.ts`, `index.ts`, and `ClaimVisual.tsx`, `TradeVisual.tsx`, `WareVisual.tsx`, `AgentVisual.tsx`, `ConcordVisual.tsx`, `TalkVisual.tsx`, `RagVisual.tsx`
- `src/data/career.ts`, `src/components/home/CareerTimeline.tsx`
- `src/components/motion/RevealGroup.tsx`, `src/components/home/LatestWriting.astro`
- `src/components/home/ContactCta.astro`, `src/components/home/MagnetButton.tsx`
- New content: 6 project `.md` files, 5 article `.md` files, `src/content/experience/00-daxonet.json`.

**Modify:** `package.json`, `tailwind.config.mjs`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/data/site.ts`, `src/content/config.ts`, every file in `src/pages/**`, `src/pages/rss.xml.ts`, `scripts/generate-api.ts`, `public/llms.txt`, `public/ai-plugin.json`, `public/.well-known/{ai-plugin,agent,mcp}.json`, `public/api/openapi.json`, `public/site.webmanifest`, `public/resume.pdf`, `README.md`, `CLAUDE.md`, existing project, article and experience entries.

**Delete:** `src/components/FixedSidebars.astro`, `src/components/Banner.tsx`, `src/data/value-props.ts`, and `src/components/SectionWrapper.astro` (only `index.astro` uses it).

---

### Task 1: Verification harness, positioning, and years-figure removal

**Files:**
- Create: `scripts/verify-content.ts`
- Modify: `package.json`, `src/data/site.ts`, `src/pages/index.astro` (JSON-LD only), `src/pages/about.astro` (JSON-LD + meta), `scripts/generate-api.ts`, `public/llms.txt`, `public/ai-plugin.json`, `public/.well-known/ai-plugin.json`, `public/.well-known/agent.json`, `public/.well-known/mcp.json`, `public/api/openapi.json`, `public/site.webmanifest`, `README.md`, `public/resume.pdf`

**Interfaces:**
- Produces: `scripts/verify-content.ts` with
  - `check(name: string, fn: () => string[] | Promise<string[]>, opts?: { dist?: boolean; links?: boolean }): void`. `fn` returns failure messages; an empty array means pass. Checks flagged `dist` run only with `--dist`, and checks flagged `links` only with `--links`.
  - helpers `readText(path)`, `walk(dir, exts): string[]`, `frontmatter(dir): Array<{ slug: string; data: any; body: string }>` (gray-matter), and `htmlText(html: string): string`. `htmlText` strips tags and comments, decodes `&amp; &lt; &gt; &quot; &#39; &#x27;` and collapses whitespace.
  - The script prints `✓ name` or `✗ name` followed by indented failures, and exits 1 on any failure.
- Produces: `package.json` scripts `"verify": "tsx scripts/verify-content.ts"`, `"verify:dist": "tsx scripts/verify-content.ts --dist"` and `"verify:links": "tsx scripts/verify-content.ts --links"`.
- Produces: `ENGINEER_TITLE = "AI Solutions Architect"` and `ABOUT_CONTENT.introductionParagraphs` / `skills` (below) in `src/data/site.ts`.

- [ ] **Step 1: Install dependencies (none are installed yet)**

Run: `npm ci`. Expected: exits 0 and `node_modules/.bin/astro` exists.

- [ ] **Step 2: Write the harness and these failing checks**

```ts
const YEARS = new RegExp(['25\\+?[\\s-]?years?', 'over 25'].join('|'), 'i'); // built from parts so this file doesn't match itself
const OLD_TITLE = /Senior Tech Lead, AI Engineer/;
const SCAN = [...walk('src', ['.astro','.ts','.tsx','.md','.json']), ...walk('public', ['.txt','.json','.webmanifest','']), ...walk('scripts', ['.ts']), 'README.md']
  .filter(f => !f.endsWith('verify-content.ts'));

check('no explicit years figure', () => SCAN.filter(f => YEARS.test(readText(f))).map(f => `years figure in ${f}`));
check('old title gone', () => SCAN.filter(f => OLD_TITLE.test(readText(f))).map(f => `old title in ${f}`));
check('old employer label gone', () => SCAN.filter(f => readText(f).includes('RAG.WTF & AI Initiatives')).map(f => f));
check('title is AI Solutions Architect', async () => (await import('../src/data/site.ts')).ENGINEER_TITLE === 'AI Solutions Architect' ? [] : ['ENGINEER_TITLE']);
check('llms.txt names role + employer', () => ['AI Solutions Architect', 'Daxonet AI'].filter(s => !readText('public/llms.txt').includes(s)));
check('resume.pdf is the Oct 2026 CV', () => existsSync('docs/Resume-202610.pdf') && !readFileSync('public/resume.pdf').equals(readFileSync('docs/Resume-202610.pdf')) ? ['public/resume.pdf differs'] : []);
check('dist: portfolio.json title', () => JSON.parse(readText('dist/api/portfolio.json')).title === 'AI Solutions Architect' ? [] : ['portfolio.json title'], { dist: true });
check('dist: no years figure in dist', () => walk('dist', ['.html','.txt','.json','.xml']).filter(f => YEARS.test(readText(f))), { dist: true });
```

`walk(dir, [''])` must include extensionless files (for example `public/.well-known/agent-policy`).

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run verify`. Expected: ✗ on "no explicit years figure" (site.ts, index.astro, about.astro, both ai-plugin.json files, llms.txt, generate-api.ts, README.md), plus "old title gone", "old employer label gone", "title is…", "llms.txt…" and "resume.pdf…".

- [ ] **Step 4: Make the content changes**

- `cp docs/Resume-202610.pdf public/resume.pdf`.
- `src/data/site.ts`: set `ENGINEER_TITLE = "AI Solutions Architect"`. Drop `HERO_CONTENT.introduction` (later tasks replace `HERO_CONTENT`). `ABOUT_CONTENT.introductionParagraphs` becomes:
  1. "I'm Lim Chee Kin, an AI Solutions Architect at Daxonet AI in Kuala Lumpur. I design and ship enterprise AI: conversational agents, document extraction, human approvals, and integration with accounting and business platforms."
  2. "My work spans retrieval-augmented generation (RAG), real-time voice systems, cloud operations and distributed teams, built in Python and TypeScript. Before AI, I led enterprise Java teams across China, Europe and Malaysia, and delivered banking and healthcare systems."
  3. "I care about AI that does real work safely: role-restricted agent tools, explicit confirmation before writes, and private, self-hosted models where data sovereignty matters."

  `skills` becomes `["Agentic AI & MCP", "RAG & LLM Evaluation", "Voice AI (Pipecat)", "Python & FastAPI", "TypeScript & React", "Claude Agent SDK & Gemini", "Docker & Kubernetes", "GCP & AWS"]`.
- `index.astro` JSON-LD:
  - Person `description` → `${ENGINEER_TITLE} focused on enterprise AI, conversational agents and business workflow integration.`
  - `worksFor` → `{ "@type": "Organization", "name": "Daxonet AI Sdn. Bhd." }`
  - Replace the FAQ "How long has Lim Chee Kin been working…" with name "What is Lim Chee Kin's career background?" and answer "Lim Chee Kin started his software career in 1999. He led enterprise Java teams at DXC Technology and Zurich Technology Services, delivered banking and healthcare systems, built 10+ open-source Grails plugins, worked as an independent Principal AI Architect from 2021 to 2025, and joined Daxonet AI as AI Solutions Architect in 2026."
  - Update the "specialize in" and "technologies" FAQ answers from the CV skills.
- `about.astro`: the same `worksFor`, and meta description `Learn about ${ENGINEER_NAME}'s career in enterprise software, AI engineering and solution architecture.`
- `generate-api.ts`: `portfolio.title = "AI Solutions Architect"`. The `llms-full.txt` header line becomes `> AI Solutions Architect at Daxonet AI — enterprise AI agents, document extraction, RAG and voice AI.`
- `public/llms.txt`: rewrite the header, About, Core Skills (from the CV skills section) and Work Experience (add "2026-Present: AI Solutions Architect (Daxonet AI)" and "2021-2025: Principal AI Architect (Independent Consultant)"). Projects and Articles are finished in Tasks 2 and 4.
- Both `ai-plugin.json`: `description_for_model` → "Access structured portfolio data for Lim Chee Kin, an AI Solutions Architect at Daxonet AI focused on enterprise AI agents, RAG and voice AI. Provides projects (Claim Pilot, Trade Pilot, WareBot, Project Concord, Talk To AI, RAG.WTF and more), work experience history, written articles, and contact information. All data is available via a static JSON API at /api/portfolio.json."
- `agent.json`, `mcp.json`, `openapi.json` (`info.description` if it names the title), `site.webmanifest` (description, plus `theme_color`/`background_color` `#050507`) and `README.md`: replace the old title and years figure.

- [ ] **Step 5: Run checks to verify they pass**

Run: `npm run verify`. Expected: every non-dist check ✓.
Run: `npm run build && npm run verify:dist`. Expected: the build succeeds and every check ✓.

- [ ] **Step 6: Commit**

`git add -A scripts package.json package-lock.json src public README.md && git commit -m "feat(content): AI Solutions Architect positioning, new CV, drop years figure"`

---

### Task 2: Sync the articles collection with Medium

**Files:**
- Modify: the 5 existing `src/content/articles/*.md`
- Create: `zero-trust-ai-agents.md`, `llm-load-testing-gke.md`, `nanochat-single-gpu.md`, `talk-to-ai-fastrtc.md`, `open-text-embeddings-intro.md` in `src/content/articles/`
- Modify: `public/llms.txt` (Articles section), `scripts/verify-content.ts`

**Interfaces:**
- Produces: every article has `externalUrl` on `https://limcheekin.medium.com/…` and a correct `publishDate`. Newest three slugs: `zero-trust-ai-agents`, `llm-load-testing-gke`, `nanochat-single-gpu`.

- [ ] **Step 1: Add failing checks**

```ts
const EXPECTED_ARTICLES: Record<string, [string, string]> = { // slug -> [publishDate, externalUrl]  (copy the 10 rows of the spec's "Articles collection" table)
  'zero-trust-ai-agents': ['2026-03-13', 'https://limcheekin.medium.com/zero-trust-security-for-autonomous-ai-agents-691b5cbcec21'],
  /* …the other 9 rows exactly as in the spec table… */
};
check('articles match Medium', () => { /* every slug in EXPECTED exists; publishDate (YYYY-MM-DD) and externalUrl equal; no extra slugs */ });
check('latest three articles', () => /* frontmatter sorted by publishDate desc, first 3 slugs */ eq(['zero-trust-ai-agents','llm-load-testing-gke','nanochat-single-gpu']));
check('llms.txt has no coming-soon', () => readText('public/llms.txt').includes('coming soon') ? ['coming soon in llms.txt'] : []);
check('article links live', async () => { /* fetch https://limcheekin.medium.com/feed once (browser UA); each externalUrl must appear in it; GET each with redirect:'follow' must be < 400 */ }, { links: true });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify`. Expected: ✗ "articles match Medium" (wrong dates, 5 missing slugs, 2 missing URLs), ✗ "latest three", ✗ "coming soon".

- [ ] **Step 3: Update and create entries**

- Titles follow Medium exactly (`talking-book` becomes "Introducing Talking Book").
- New entries: `type: "Article"` and `platform: "Medium"`. `description` and 3–5 `tags` come from each Medium article (open it).
- Existing entries keep their `tags`. Set `platform: "Medium"` on all 10 for consistency.
- Remove the `picsum.photos` `image` lines (placeholders nothing renders).
- Rewrite the `llms.txt` Articles list as the 10 titles linked to their Medium URLs, newest first.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify && npm run verify:links`. Expected: all ✓. If Medium rate-limits the GETs, the feed-membership part must still pass; report any URL that fails.

- [ ] **Step 5: Commit**

`git commit -am "feat(content): sync articles with Medium (dates, links, 5 missing posts)"` (add the new files first).

---

### Task 3: Merge the CV into the experience collection

**Files:**
- Create: `src/content/experience/00-daxonet.json`
- Modify: `01-ai-engineer.json`, `02-dxc-tech-lead.json`, `03-zurich-tech-lead.json`, and `sortOrder` in all entries
- Modify: `scripts/verify-content.ts`

**Interfaces:**
- Produces: experience sorted by `sortOrder` 0…10, newest first. The first entry is `{ company: "Daxonet AI", title: "AI Solutions Architect", startDate: "2026-01" }`.

- [ ] **Step 1: Add failing checks**

```ts
check('experience order + Daxonet first', () => { /* sortOrders unique and strictly increasing by startDate desc; first.company === 'Daxonet AI' && first.title === 'AI Solutions Architect'; entry with title 'Principal AI Architect' has company 'Independent Consultant', startDate '2021-01', endDate '2025-12' */ });
check('merge kept trimmed detail', () => [
  ['02-dxc-tech-lead.json', 'contributing millions'], ['02-dxc-tech-lead.json', 'EPIC Configurator'], ['02-dxc-tech-lead.json', 'Divestiture and Acquisition'],
  ['03-zurich-tech-lead.json', '5-member'], ['01-ai-engineer.json', 'open-text-embeddings'], ['01-ai-engineer.json', 'Fluwix'],
].filter(([f, s]) => !readText(`src/content/experience/${f}`).includes(s)).map(([f, s]) => `${f} lost "${s}"`));
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify`. Expected: ✗ "experience order + Daxonet first".

- [ ] **Step 3: Edit entries (merge, never drop)**

- `00-daxonet.json`: company "Daxonet AI", title "AI Solutions Architect", location "Kuala Lumpur, Malaysia", startDate "2026-01", no endDate, `sortOrder: 0`. `description` is the CV's seven Daxonet bullets (Claim Pilot, Trade Pilot, WareBot, Smart HVAC Catalogue, Agentic AI Layer, Agent First Web Audit, AI Enablement). `technologies` come from the CV skills used there.
- `01-ai-engineer.json`: company "Independent Consultant", title "Principal AI Architect", endDate "2025-12", no `companyUrl`. Keep every existing bullet and add the CV's Healthcare Agent Deployment (GKE, Vertex AI, MongoDB Atlas, Private Service Connect) and AI Evaluation (Ragas) bullets.
- DXC: add the CV's "Established code quality gates and design reviews, and mentored three junior developers" bullet.
- Zurich: unchanged unless a CV fact is missing. The existing month dates stay.
- Bump the other `sortOrder` values so they stay unique and newest first.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify`. Expected: all ✓.

- [ ] **Step 5: Commit**

`git commit -m "feat(content): add Daxonet role, merge CV into experience"` (after `git add`).

---

### Task 4: Projects schema, new entries, and the featured order

**Files:**
- Modify: `src/content/config.ts`, `src/content/projects/{talk-to-ai,rag-wtf,telegram-gpt,open-text-embeddings}.md`, `src/pages/projects/index.astro`, `scripts/generate-api.ts`, `public/llms.txt` (Current Projects)
- Create: `src/content/projects/{claim-pilot,trade-pilot,warebot,agentic-ai-layer,project-concord,smart-hvac-catalogue}.md`
- Modify: `scripts/verify-content.ts`

**Interfaces:**
- Produces: project schema fields (all optional): `kind: z.enum(['enterprise','oss']).default('oss')`, `org: z.string().optional()`, `tagline: z.string().optional()`, `stack: z.array(z.string()).max(4).optional()` and `visual: z.enum(['claim','trade','ware','agent','concord','talk','rag']).optional()`.
- Produces: featured order `claim-pilot, trade-pilot, warebot, agentic-ai-layer, project-concord, talk-to-ai, rag-wtf` (`featuredOrder` 1–7).

- [ ] **Step 1: Add failing checks**

```ts
const FEATURED = { 'claim-pilot':'claim', 'trade-pilot':'trade', 'warebot':'ware', 'agentic-ai-layer':'agent', 'project-concord':'concord', 'talk-to-ai':'talk', 'rag-wtf':'rag' };
check('featured order', () => eq(featuredSlugsSortedByFeaturedOrder(), Object.keys(FEATURED)));
check('featured cards complete', () => /* each featured: tagline set, stack length 3-4, visual === FEATURED[slug]; first four kind 'enterprise' & org 'Daxonet AI'; last three kind 'oss' */);
check('demoted + hvac', () => /* telegram-gpt & open-text-embeddings featured false; smart-hvac-catalogue exists, featured false, kind enterprise */);
check('dist: portfolio.json has kind', () => /* every project in dist/api/portfolio.json has kind */ , { dist: true });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify`. Expected: ✗ on all three non-dist checks.

- [ ] **Step 3: Add the schema fields and entries**

Copy the taglines verbatim from the table below. Write each `description` and body from the CV bullet. Enterprise entries get `org: "Daxonet AI"`, `category` "Enterprise AI", and no `githubUrl`, `liveUrl` or `image`.

| slug | tagline | stack |
|---|---|---|
| claim-pilot | Expense claims from Teams and WhatsApp, read by AI, approved by humans, and posted as GL journals. | Gemini, FastAPI, React, ERP |
| trade-pilot | Purchase orders arrive on WhatsApp as photos, PDFs or Excel, and leave as quotations and sales orders. | Gemini, Next.js, AutoCount |
| warebot | Ask the warehouse in plain language. Every write waits for an explicit confirmation. | Local Qwen, SSE, Maestro |
| agentic-ai-layer | Multi-channel agents that reach accounting and business systems through role-restricted MCP tools. | Claude Agent SDK, Pipecat, OAuth PKCE |
| project-concord | An MCP server that lets modern AI agents query legacy database schemas, with permission controls. | MCP, TypeScript, SQL |
| talk-to-ai | Real-time voice AI targeting sub-300 ms responses, with local or cloud speech and models. | FastRTC, WebRTC, LocalAI, Python |
| rag-wtf | Private, personalised knowledge discovery: your documents, your models, your machine. | open-text-embeddings, SurrealDB |

- `project-concord`: `kind: oss`, and `githubUrl` taken from `public/llms.txt`.
- `smart-hvac-catalogue`: enterprise, not featured, written from the CV bullet.
- `generate-api.ts`: add `kind`, `org` and `tagline` to each project in `portfolio.json`.
- `/projects/` page: featured cards without `image` render a plain card (title, tagline or description, stack) with no `<img>`.
- `llms.txt` Current Projects: list the Daxonet projects (no links) and the open-source ones (with links).

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify && npm run build && npm run verify:dist`. Expected: all ✓. `dist/projects/claim-pilot/index.html` exists and contains no broken `<img>`.

- [ ] **Step 5: Commit**

`git commit -m "feat(content): Daxonet projects, Project Concord, card fields, featured order"` (after `git add`).

---

### Task 5: Motion foundation (GSAP module, Lenis, tokens)

**Files:**
- Modify: `package.json`, `tailwind.config.mjs`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`
- Create: `src/lib/gsap.ts`, `src/lib/motion.ts`, `src/components/motion/SmoothScroll.tsx`

**Interfaces:**
- Produces: `src/lib/gsap.ts` exports `{ gsap, useGSAP, ScrollTrigger, SplitText }`, after `gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)` at module level. In dev in the browser, it also sets `window.ScrollTrigger = ScrollTrigger` (guard with `import.meta.env.DEV && typeof window !== 'undefined'`).
- Produces: `src/lib/motion.ts` exports `export const MQ = { reduce: '(prefers-reduced-motion: reduce)', motion: '(prefers-reduced-motion: no-preference)', pin: '(min-width: 768px) and (min-height: 560px)', finePointer: '(pointer: fine)' } as const;`
- Produces: `SmoothScroll` (default export, no props), mounted once in `BaseLayout` as `<SmoothScroll client:load />`. It renders `<ReactLenis root options={{ autoRaf: false, anchors: true }} ref={lenisRef} />`, calls `useLenis(ScrollTrigger.update)`, and runs the guide's ticker bridge in its one `useEffect` (`gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`, remove on cleanup). It also calls `ScrollTrigger.refresh()` once on `window` `load` and once on `document.fonts.ready`, and removes the listener on cleanup. It imports `lenis/dist/lenis.css`. Other islands reach Lenis via `useLenis()` from `lenis/react`.
- Produces: Tailwind color `sky: '#38bdf8'`.

- [ ] **Step 1: Install**

Run: `npm i gsap@^3.15.0 @gsap/react@^2.1.2 lenis@^1.3.27`. Expected: all three appear in `dependencies`.

- [ ] **Step 2: Implement the modules and wire `BaseLayout`**

Remove `scroll-behavior: smooth` from `html` in `global.css`.

- [ ] **Step 3: Verify build and behaviour**

Run: `npm run build && npm run verify:dist`. Expected: ✓.
Run `npm run preview`, then in the browser at `http://localhost:4321/`:
- `document.documentElement.classList.contains('lenis')` returns `true`.
- Wheel scrolling is smoothed.
- Tab to the skip link and press Enter: the view moves to `#main-content`.
- With "prefers-reduced-motion: reduce" emulated and the page reloaded, wheel scrolling is not smoothed.
- No console errors.

- [ ] **Step 4: Commit**

`git commit -am "feat(motion): gsap module, Lenis smooth scroll with ticker bridge, sky token"` (after adding the new files).

---

### Task 6: Site chrome: header, footer, sidebars out, "Writing" label

**Files:**
- Modify: `src/data/site.ts` (`NAV_LINKS`, `FOOTER_TEXT`; delete `SCROLL_NAV_LINKS`), `src/components/Header.astro`, `src/components/Footer.astro`, all `src/pages/**/*.astro`, `src/pages/rss.xml.ts`, `src/layouts/BaseLayout.astro` (RSS link title)
- Delete: `src/components/FixedSidebars.astro`
- Modify: `scripts/verify-content.ts`

**Interfaces:**
- Produces: `NAV_LINKS = [{name:'About',href:'/about/'},{name:'Work',href:'/projects/'},{name:'Writing',href:'/insights/'},{name:'Contact',href:'/contact/'}]`, and `FOOTER_TEXT = \`© ${new Date().getFullYear()} ${ENGINEER_NAME} · Kuala Lumpur, Malaysia\``.

- [ ] **Step 1: Add failing checks**

```ts
const UI = [...walk('src/pages', ['.astro','.ts']), ...walk('src/components', ['.astro','.tsx']), ...walk('src/layouts', ['.astro']), 'src/data/site.ts'];
check('no visible "Insights" label', () => UI.filter(f => /\bInsights\b/.test(readText(f))).map(f => f));
check('nav says Writing', async () => (await import('../src/data/site.ts')).NAV_LINKS.some((l: any) => l.name === 'Writing' && l.href === '/insights/') ? [] : ['NAV_LINKS']);
check('sidebars removed', () => [existsSync('src/components/FixedSidebars.astro') && 'FixedSidebars.astro exists', ...UI.filter(f => readText(f).includes('FixedSidebars'))].filter(Boolean) as string[]);
check('dist: footer + nav', () => { const t = htmlText(readText('dist/index.html')); return [!t.includes('Kuala Lumpur, Malaysia') && 'footer location', !readText('dist/index.html').includes('href="/insights/"') && 'nav link'].filter(Boolean) as string[]; }, { dist: true });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run verify`. Expected: ✗ on the three non-dist checks.

- [ ] **Step 3: Implement**

- **Header:** keep the logo, hide-on-scroll script, numbered nav and Résumé button. Height `h-16 md:h-20`.
- **Footer:**
  - top row: `FOOTER_TEXT` on the left, text links on the right for GitHub, LinkedIn, Medium (from `SOCIAL_LINKS`) and the email;
  - second line: "Source on GitHub" → `https://github.com/limcheekin/portfolio`.
  - Drop "Inspired by Brittany Chiang".
- **Remove `<FixedSidebars />`** and its import from every page.
- **Rename the label to "Writing":**
  - in the `/insights/` index: title `Writing | ${ENGINEER_NAME}`, h1 "Writing", breadcrumb label;
  - in `insights/[slug].astro`: the breadcrumb, the back link and the JSON-LD breadcrumb `name`;
  - the 404 button;
  - the RSS title `Writing by ${ENGINEER_NAME}`, in both `rss.xml.ts` and the `BaseLayout` `<link>`.
- **Home page (temporary):** remove `SCROLL_NAV_LINKS` and set the old `#insights` section heading to "Writing". Task 11 replaces that section.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run verify && npm run build && npm run verify:dist`. Expected: all ✓. In preview, every page shows the new header and footer and no side rails at 1280px.

- [ ] **Step 5: Commit**

`git commit -m "feat(chrome): slim header, new footer, remove side rails, rename Insights to Writing"` (after `git add -A src`).

---

### Task 7: Remove old home sections and Banner; set up the home page shell

**Files:**
- Modify: `src/pages/index.astro`, `src/data/site.ts` (`HERO_CONTENT`, add `CONTACT_CTA`)
- Create: `src/components/home/types.ts`
- Delete: `src/components/Banner.tsx`, `src/data/value-props.ts`, `src/components/SectionWrapper.astro`
- Modify: `scripts/verify-content.ts`

**Interfaces:**
- Produces: `src/components/home/types.ts`:
  ```ts
  export type VisualKey = 'claim' | 'trade' | 'ware' | 'agent' | 'concord' | 'talk' | 'rag';
  export interface VisualProps { active: boolean }
  export interface WorkCard { slug: string; title: string; kind: 'enterprise' | 'oss' | 'more'; label: string; tagline: string; stack: string[]; visual?: VisualKey; href: string }
  export interface CareerEntry { when: string; title: string; org?: string; summary: string; chips?: string[]; condensed?: boolean }
  export interface AgentRunRow { step: string; detail: string } // detail may contain **bold** spans
  export interface AgentRun { name: 'trade-pilot' | 'claim-pilot' | 'warebot'; rows: AgentRunRow[] }
  ```
- Produces: in `site.ts`:
  - `HERO_CONTENT = { eyebrow: 'Lim Chee Kin · AI Solutions Architect', headline: { before: 'I build AI agents that do ', accent: 'real work', after: ' inside business systems.' }, sub: 'From a WhatsApp message to a posted sales order, with a human in the loop.', primaryCta: { label: 'Get in touch', href: '/contact/' }, resumeCta: { label: 'Résumé ↗', href: '/resume.pdf' } }`
  - `CONTACT_CTA = { eyebrow: '04 · Contact', headline: { before: 'Have a workflow that should ', accent: 'run itself?' }, paragraph: 'I design and ship AI agents that plug into the systems you already run. Tell me about yours.', button: { label: 'Get in touch', href: '/contact/' } }`
  - `CONTACT_CONTENT` stays, because `/contact/` uses it.
- Produces: `index.astro` with `<main id="main-content">` full-width (no max-w container). It holds the section slots `#hero`, `#work`, `#career`, `#writing` and `#contact`, which Tasks 8–12 fill. Until then each slot is a plain server-rendered placeholder using the new copy. `WorkCard[]` is built in frontmatter from the featured projects plus `{ slug: 'all-projects', title: 'All projects →', kind: 'more', label: 'More', tagline: 'open-text-embeddings, Smart HVAC RAG, Fluwix, Talking Book and more.', stack: [], href: '/projects/' }`. Labels are `'Enterprise · Daxonet AI'` and `'Open source'`, and `href` is `/projects/${slug}/`.

- [ ] **Step 1: Add failing checks**

```ts
check('dist: old home gone', () => { const t = htmlText(readText('dist/index.html')); return ['Hi, my name is', 'Some Things I\'ve Built', 'I help'].filter(s => t.includes(s)); }, { dist: true });
check('dist: home order', () => { const h = readText('dist/index.html'); const idx = ['id="hero"','id="work"','id="career"','id="writing"','id="contact"'].map(s => h.indexOf(s)); return idx.every((v, i) => v > -1 && (i === 0 || v > idx[i-1])) ? [] : ['section order ' + idx]; }, { dist: true });
check('banner removed', () => ['src/components/Banner.tsx','src/data/value-props.ts','src/components/SectionWrapper.astro'].filter(existsSync));
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run verify:dist`. Expected: ✗ "old home gone", "home order" and "banner removed".

- [ ] **Step 3: Implement the shell and delete the dead files**

- [ ] **Step 4: Run to verify it passes**

Run: `npm run build && npm run verify:dist`. Expected: all ✓.

- [ ] **Step 5: Commit**

`git commit -m "refactor(home): five-section shell, drop Banner and old sections"` (after `git add -A src`).

---

### Task 8: Hero with SplitText headline, agent console and dot grid

**Files:**
- Create: `src/components/home/Hero.astro`, `HeroIntro.tsx`, `AgentConsole.tsx`, `DotGrid.tsx`, `src/data/agent-runs.ts`
- Modify: `src/pages/index.astro` (`#hero` slot), `scripts/verify-content.ts`

**Interfaces:**
- Consumes: `HERO_CONTENT`; `gsap`, `useGSAP` and `SplitText` from `src/lib/gsap.ts`; `MQ`; `AgentRun` from `types.ts`.
- Produces:
  - `AGENT_RUNS: AgentRun[]`: three runs in the order trade-pilot, claim-pilot, warebot, about six rows each. Base them on mockup 01's rows, with made-up identifiers only. The last row of each run is the "done" row.
  - `HeroIntro({ content: typeof HERO_CONTENT })`: eyebrow, `<h1>` (with the accent in `<em class="not-italic text-green-accent">`) and the two buttons.
  - `AgentConsole({ runs: AgentRun[] })`
  - `DotGrid({ gap?: number; opacity?: number })`
  - `Hero.astro` lays these out: two columns on desktop, stacked under 768px.
  - Hydration: `HeroIntro client:load`, `AgentConsole client:load`, `DotGrid client:only="react"`.

- [ ] **Step 1: Add failing checks**

```ts
check('dist: hero SSR text', () => { const t = htmlText(readText('dist/index.html')); return ['I build AI agents that do real work inside business systems.', 'From a WhatsApp message to a posted sales order', 'Lim Chee Kin · AI Solutions Architect', 'Résumé'].filter(s => !t.includes(s)); }, { dist: true });
check('dist: console decorative', () => /aria-hidden="true"[^>]*data-agent-console|data-agent-console[^>]*aria-hidden="true"/.test(readText('dist/index.html')) ? [] : ['console must have data-agent-console + aria-hidden'], { dist: true });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run verify:dist`. Expected: ✗ on both.

- [ ] **Step 3: Implement**

- **HeroIntro**
  - Inside `gsap.matchMedia(scope)`, when `MQ.motion` matches: `SplitText.create(h1, { type: 'lines, words', mask: 'lines', autoSplit: true, onSplit: self => gsap.from(self.words, { yPercent: 100, opacity: 0, stagger: 0.04, duration: 0.8, ease: 'power3.out' }) })`.
  - Under `MQ.reduce`: `gsap.from(h1, { opacity: 0, duration: 0.2 })`.
  - Eyebrow, sub and buttons fade up after the words (opacity + `y: 12`, but no `y` under reduce).
- **AgentConsole**
  - The root has `data-agent-console` and `aria-hidden="true"`.
  - SSR renders the **finished first run**, so no-JS and reduced-motion visitors see a complete run.
  - Under `MQ.motion`: a gsap timeline reveals the rows one by one (about 0.65s apart; opacity + `y: 6`), holds about 2.6s, then swaps to the next run. Loop.
  - The tab chips show the current run. `**x**` renders as `<b>`. The cursor blink uses a CSS animation that is disabled under reduced motion.
  - Pause the loop while the console is offscreen (`ScrollTrigger.create({ trigger, onToggle })`).
- **DotGrid**
  - Port mockup 01's algorithm: gap 30, radius 160, spring 0.06, damping 0.82, base dot `slate-text` at 22%, near dots `green-accent` (both from `palette.mjs`), canvas opacity 0.35.
  - Drive frames from `gsap.ticker.add` inside `useGSAP`; remove the ticker callback and listeners in cleanup.
  - Run only while visible (IntersectionObserver) and the tab is visible.
  - Under reduced motion or a coarse pointer, draw once and stop.
  - Canvas `aria-hidden`. Hide it on mobile (`hidden md:block`).
- **Hero.astro** removes the old greeting, tagline and Banner markup.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run build && npm run verify:dist`. Expected: ✓.

- [ ] **Step 5: Check it in the browser (preview)**

- **Desktop 1440×900:** the headline words rise in, the console streams trade-pilot → claim-pilot → warebot and loops, and the dots spring away from the cursor.
- **375×812:** the console sits under the buttons and there's no horizontal scroll (`document.documentElement.scrollWidth === 375`).
- **Reduced motion emulated:** no word movement, the console is static on a finished run, and the dots don't move.
- **Resize 1440 → 900 → 1440:** the headline re-splits cleanly.

- [ ] **Step 6: Commit**

`git commit -m "feat(home): hero with SplitText headline, live agent console, dot grid"` (after `git add`).

---

### Task 9: Selected Work track (pin, active card, mobile, reduced motion)

**Files:**
- Create: `src/components/home/WorkTrack.tsx`, `src/components/home/visuals/useVisualTimeline.ts`, `src/components/home/visuals/index.ts`
- Modify: `src/pages/index.astro` (`#work` slot, `<WorkTrack client:load cards={cards} />`), `scripts/verify-content.ts`

**Interfaces:**
- Consumes: `WorkCard`, `VisualKey` and `VisualProps`; `gsap`, `useGSAP` and `ScrollTrigger`; `MQ`; `useLenis` from `lenis/react`.
- Produces:
  - `useVisualTimeline(scope: React.RefObject<HTMLElement>, active: boolean, build: (tl: gsap.core.Timeline) => void): void`. It builds one paused timeline with `repeat: -1` and a 2s `repeatDelay` inside `gsap.matchMedia(scope)`. Under `MQ.reduce` a non-repeating copy always sits at `progress(1)`. Otherwise, `active` true restarts it from 0 and it loops; `active` false does `pause().progress(1)`. The finished frame is the final state.
  - `VISUALS: Partial<Record<VisualKey, React.ComponentType<VisualProps>>>` in `visuals/index.ts`. It starts empty; Task 10 fills it. Cards whose visual is missing render an empty 170px panel.
  - `WorkTrack({ cards: WorkCard[] })` renders `<section id="work" aria-labelledby="work-title">`.

- [ ] **Step 1: Add failing checks**

```ts
check('dist: work cards SSR', () => { const t = htmlText(readText('dist/index.html')); return ['Selected Work', 'Claim Pilot', 'Trade Pilot', 'WareBot', 'Agentic AI Layer', 'Project Concord', 'Talk To AI', 'RAG.WTF', 'All projects', 'Expense claims from Teams and WhatsApp'].filter(s => !t.includes(s)); }, { dist: true });
check('dist: claim pilot first', () => { const t = htmlText(readText('dist/index.html')); return t.indexOf('Claim Pilot') < t.indexOf('Trade Pilot') ? [] : ['order']; }, { dist: true });
```

The project titles in `talk-to-ai.md` and `rag-wtf.md` may be long ("Talk To AI: Real-time Voice AI"). The card title is the text before the first colon; implement that in the index frontmatter.

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run verify:dist`. Expected: ✗.

- [ ] **Step 3: Implement `WorkTrack`**

- **Markup:**
  - header row: `01` in mono green and an `<h2 id="work-title">Selected Work</h2>`;
  - a counter `<span data-counter>01</span> / 08`;
  - the track (`flex gap-6`), then a 2px progress bar with a green fill (`scaleX`, `transform-origin: left`).
- **Card:** `<a href>` with `w-[min(360px,80vw)] h-[min(470px,72vh)]`. Inside, top to bottom: the visual panel (170px), the label (green, or `text-sky` for oss), the h3 title, the tagline, and the stack in mono 11.5px pinned to the bottom. The `more` card has a dashed border, no panel and a green title.
- **Active styling:**
  - every card: `opacity: 0.9`;
  - active: `opacity: 1`, plus a glow overlay (border `green-accent` at 55%, `shadow-glow-green`; sky equivalents for oss) faded in by opacity;
  - inactive panel: `opacity: .7; filter: saturate(.55)`;
  - transitions 0.4s.
- **Active index:** keep it in a ref. Update React state only when the index changes, and pass `active={i === activeIndex}` to each visual.
- **Pin + motion** (`MQ.pin` and `MQ.motion`; wide and at least 560px tall):
  - the guide's pin tween with `trigger: section`, `pin: true`, `scrub: 1`, `start: 'top top'`, `end: () => '+=' + distance()`, `invalidateOnRefresh: true`, `ease: 'none'`, `refreshPriority: 10`, and `x: () => -distance()` where `distance = () => track.scrollWidth - window.innerWidth`;
  - `onUpdate`: index = `Math.round(self.progress * (n - 1))`, which also writes the counter and the progress fill.
- **Mobile + motion:** no pin. The track gets `overflow-x-auto snap-x snap-mandatory` (each card `snap-center`). An IntersectionObserver with the track as root (threshold 0.6) picks the active card. Disconnect it in cleanup.
- **Reduced motion (any width):** no pin and no observer. The track wraps (`flex-wrap justify-center`), every card is styled active-free at full opacity, and visuals rest on their finished frame (handled by `useVisualTimeline`).
- **Keyboard:**
  - on desktop, `onFocus` of card `i` calls `lenis.scrollTo(st.start + (i / (n - 1)) * (st.end - st.start), { immediate: reduced })`, using the pin trigger's `start`/`end` (keep the trigger in a ref);
  - on mobile, it calls `card.scrollIntoView({ inline: 'center', block: 'nearest' })`.
- Never put `transform` or `will-change` on the section or its ancestors.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run build && npm run verify:dist`. Expected: ✓.

- [ ] **Step 5: Check it in the browser (preview)**

- **1440×900:**
  - the section pins and the cards slide left as you scroll, then release into Career;
  - the counter goes 01→08 in step with the glowing card;
  - **reload while scrolled into Career:** the pin and later sections are positioned correctly.
- **Tab** from the hero buttons into the track: each focused card glows and is fully visible.
- **375×812:** the cards swipe horizontally with snap, the centred card glows, and there's no page-level horizontal scroll.
- **Emulate reduced motion with the page open:** the pin is released, cards wrap, and no card glows or moves. Turn it off: the pin returns.
- **In dev (`npm run dev`):** run `ScrollTrigger.getAll().length` in the console, resize the window three times, run it again. The count is unchanged.

- [ ] **Step 6: Commit**

`git commit -m "feat(home): pinned Selected Work track with active-card logic"` (after `git add`).

---

### Task 10: Card micro-illustrations (seven visuals)

**Files:**
- Create: `src/components/home/visuals/{Claim,Trade,Ware,Agent,Concord,Talk,Rag}Visual.tsx`
- Modify: `src/components/home/visuals/index.ts`

**Interfaces:**
- Consumes: `useVisualTimeline` and `VisualProps`.
- Produces: each component, for example `export default function ClaimVisual({ active }: VisualProps)`, registered in `VISUALS` under its key.

- [ ] **Step 1: Port each visual from mockup 02 (`02-selected-work.html`)**

| Visual | Port from the mockup |
|---|---|
| Claim | Receipt with scan line, three fields, APPROVED stamp |
| Trade | WhatsApp bubble with file, arrow, three table rows, "SO-0412 created ✓" |
| Ware | Four chat messages, Confirm button pressed, "✓ TR-778" |
| Agent | SVG hub-and-spoke |
| Concord | SVG agent → MCP shield → DB, three SQL fragments, result |
| Talk | 30-bar waveform, STT/LLM/TTS pills, "<300 ms" |
| Rag | Three docs, 14-dot cloud, three hits glow sky, question and answer bubbles |

- **Shared rules:**
  - root `<div aria-hidden="true" class="relative h-[170px] rounded-[10px] overflow-hidden border border-light-graphite">` on the dotted background (`bg-dot-pattern`);
  - the stepped visuals (Claim, Trade, Ware, Concord, Rag) build their steps as `tl.from(el, { opacity: 0, y: 5, duration: 0.35 })` in sequence, about 0.7–0.85s apart;
  - the finished frame (`progress(1)`) must equal the mockup's final state;
  - replace SMIL `animateMotion` with GSAP: tween each pulse circle's `x`/`y` along its straight wire, inside the same timeline, repeated within the timeline duration;
  - the Talk waveform bars use `scaleY` tweens inside the timeline;
  - all data is made up, as in the mockup.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run verify:dist`. Expected: ✓.
In preview at 1440×900, scroll through the track:
- only the glowing card's illustration moves;
- the other cards show their finished frames (stamp landed, SO created, answer shown);
- under reduced motion, every card shows its finished frame and nothing moves.

- [ ] **Step 3: Commit**

`git commit -m "feat(home): code-drawn micro-illustrations for Selected Work cards"` (after `git add`).

---

### Task 11: Career timeline

**Files:**
- Create: `src/data/career.ts`, `src/components/home/CareerTimeline.tsx`
- Modify: `src/pages/index.astro` (`#career` slot, `<CareerTimeline client:load entries={CAREER_HIGHLIGHTS} />`), `scripts/verify-content.ts`

**Interfaces:**
- Produces: `getCareerEntries(): Promise<CareerEntry[]>` for the spec's six Career entries: summaries and chips from the spec, titles, orgs and dates from the experience collection (the last two `condensed: true`, with no org).
- Produces: `CareerTimeline({ entries: CareerEntry[] })` renders `<section id="career">`.
  - Left column: `02`, "Career", the spec's intro line, and "Full experience →" `/about/`. It's sticky at `top: 14vh` on desktop.
  - Right column: a timeline with a rail, dots and entries.

- [ ] **Step 1: Add failing checks**

```ts
check('dist: career SSR', () => { const t = htmlText(readText('dist/index.html')); return ['Career', 'AI Solutions Architect', 'Daxonet AI', 'Principal AI Architect', 'DXC Technology', 'Zurich Technology Services', 'Where it started', 'Full experience'].filter(s => !t.includes(s)); }, { dist: true });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run verify:dist`. Expected: ✗.

- [ ] **Step 3: Implement**

- **Under `MQ.motion`:**
  - `gsap.set('.job', { opacity: 0, y: 24, scale: 0.98 })`;
  - `ScrollTrigger.batch('.job', { start: 'top 85%', onEnter: els => gsap.to(els, { opacity: 1, y: 0, scale: 1, stagger: 0.12, overwrite: true }) })`. Each entry's dot turns green on enter (toggle a class in the same callback);
  - rail fill: `gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: timeline, start: 'top 80%', end: 'bottom 80%', scrub: true } })`.
- **Under `MQ.reduce`:** no set or batch. The rail fill is at `scaleY(1)` and the dots are green.
- **Mobile:** single column and the heading isn't sticky.

- [ ] **Step 4: Run to verify it passes**

Run: `npm run build && npm run verify:dist`. Expected: ✓.

- [ ] **Step 5: Check it in the browser**

- **1440×900:** after the Work pin releases, the entries fade up in small batches as they reach the lower part of the viewport, the rail fills with scroll, and the left heading stays put.
- **375px:** one column.
- **Reduced motion:** everything is visible immediately.
- **JS disabled** (Chrome DevTools → Disable JavaScript): every entry is visible.

- [ ] **Step 6: Commit**

`git commit -m "feat(home): batched career timeline with scroll-filled rail"` (after `git add`).

---

### Task 12: Latest Writing rows and the Contact section

**Files:**
- Create: `src/components/motion/RevealGroup.tsx`, `src/components/home/LatestWriting.astro`, `src/components/home/ContactCta.astro`, `src/components/home/MagnetButton.tsx`
- Modify: `src/pages/index.astro` (`#writing` and `#contact` slots), `scripts/verify-content.ts`

**Interfaces:**
- Produces:
  - `RevealGroup({ selector: string; stagger?: number; children })`. Under `MQ.motion` it does `gsap.set(els, { opacity: 0, y: 12 })`, then `ScrollTrigger.batch(els, { start: 'top 90%', onEnter: b => gsap.to(b, { opacity: 1, y: 0, stagger: stagger ?? 0.09, overwrite: true }) })`. It does nothing under reduce. Hydrate with `client:load`; Astro passes children as static slot HTML.
  - `LatestWriting.astro({ articles: CollectionEntry<'articles'>[] })`, given the three newest by `publishDate`.
  - `MagnetButton({ href: string; label: string })`: a pill with a trailing `→`. Under `${MQ.finePointer} and ${MQ.motion}` it uses `gsap.quickTo(btn, 'x' | 'y', { duration: 0.4, ease: 'power3' })` with strength x 0.3, y 0.4, label 0.08 and arrow 0.1 plus 4px. Pointer handlers on the surrounding zone are wrapped in `contextSafe`. On leave it returns to 0. Listeners are removed in cleanup. Hydrate with `client:visible`.
  - `ContactCta.astro` uses `CONTACT_CTA` and `SOCIAL_LINKS`.

- [ ] **Step 1: Add failing checks**

```ts
check('dist: writing rows', () => { const t = htmlText(readText('dist/index.html')); return ['Latest Writing', 'All writing', 'Zero-Trust Security for Autonomous AI Agents', 'Solving the LLM Load Testing Paradox', "Reproducing Karpathy's NanoChat"].filter(s => !t.includes(s)); }, { dist: true });
check('dist: writing links external', () => readText('dist/index.html').includes('href="https://limcheekin.medium.com/zero-trust-security-for-autonomous-ai-agents-691b5cbcec21"') ? [] : ['zero-trust link'], { dist: true });
check('dist: contact', () => { const t = htmlText(readText('dist/index.html')); return ['Have a workflow that should run itself?', 'Tell me about yours.', 'GitHub', 'LinkedIn', 'Medium'].filter(s => !t.includes(s)); }, { dist: true });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run verify:dist`. Expected: ✗ on all three.

- [ ] **Step 3: Implement**

- **LatestWriting**
  - `<section id="writing">` with a header row: `03`, "Latest Writing", and "All writing →" linking to `/insights/`.
  - `<ul>` rows on a grid `90px 1fr auto 24px`: date (`toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })`), title, first two `tags` joined by " · ", and ↗.
  - External links get `target="_blank" rel="noopener noreferrer"`.
  - Hover: the row nudges 14px right (`translate-x`, motion-safe only), a green gradient tint overlay fades in (opacity), green title, arrow moved `translate(3px,-3px)`.
  - Under 768px: title + arrow only.
  - Wrap the rows in `<RevealGroup selector=".reveal">`.
- **ContactCta:** `<section id="contact">` with a centred layout, `min-h-[90vh]`, and a static radial glow `rgba(0,217,146,.10)`. It holds:
  - the eyebrow;
  - the h2 (`text-[clamp(36px,6vw,76px)]`, accent in green);
  - the paragraph;
  - `<MagnetButton client:visible href=… label=… />` inside a padded zone;
  - mono text links (GitHub · LinkedIn · Medium · Résumé ↗).

- [ ] **Step 4: Run to verify it passes**

Run: `npm run build && npm run verify:dist && npm run verify`. Expected: all ✓.

- [ ] **Step 5: Check it in the browser**

- Writing rows fade in and the hover effect works.
- Clicking a row opens Medium in a new tab.
- The Contact button leans toward the cursor within its zone and settles back when the cursor leaves.
- At 375px or with reduced motion, the button doesn't move.
- Keyboard focus on the button shows the dashed green outline.

- [ ] **Step 6: Commit**

`git commit -m "feat(home): Latest Writing rows and magnetic Contact section"` (after `git add`).

---

### Task 13: CLAUDE.md rewrite and the final verification pass

**Files:**
- Modify: `CLAUDE.md`
- Modify: `scripts/verify-content.ts` (add `CLAUDE.md` to `SCAN`)

- [ ] **Step 1: Rewrite `CLAUDE.md`**

Describe the real codebase:
- Astro 5 + React islands + Tailwind config file;
- `src/content` collections (projects with `kind/org/tagline/stack/visual`; articles synced to Medium; experience);
- `src/data/*`;
- the home sections and their islands;
- the agent-first files and `scripts/generate-api.ts`;
- the Docker/nginx deploy and the CI artifact checks;
- `npm run dev | build | preview | verify | verify:dist | verify:links`.

Add an "Animation rules" section: the guide's rules translated to Astro, i.e. the Global Constraints above plus the guide-to-Astro table from the spec. Add a "Content rules" section: no years-of-experience figure; "Writing" label with the `/insights/` URL; merge, never drop, experience detail.

- [ ] **Step 2: Run the automated checks**

Run: `npm run build && npm run verify && npm run verify:dist && npm run verify:links`. Expected: all ✓. Also confirm the CI artifact list: `ls dist/index.html dist/404.html dist/api/portfolio.json dist/api/openapi.json dist/llms-full.txt dist/llms.txt dist/ai-plugin.json dist/robots.txt`.

- [ ] **Step 3: Run the spec's manual checklist in the browser (preview)**

Run items 3–10 of the spec's checklist and record a pass or fail line for each in the PR description:
- JS-disabled render;
- reduced motion;
- desktop pin/scrub and the one-card-animating rule;
- resize and mid-page reload;
- 375px;
- keyboard;
- the `ScrollTrigger.getAll().length` leak check (in dev);
- Lighthouse on `/` (CLS ≈ 0; record the performance score next to `main`'s).

- [ ] **Step 4: Commit**

`git commit -am "docs: rewrite CLAUDE.md for the Astro codebase with animation and content rules"`
