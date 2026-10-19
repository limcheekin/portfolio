# Motion Redesign of kin.rag.wtf

**Status:** Approved 2026-10-18; amended 2026-10-19 after the branch review (see *Amendments*)
**Date:** 2026-10-18
**Inputs:** `docs/Website_Redesign_Guide_Development_v2.md` (the guide), `docs/Resume-202610.pdf` (the CV), the brainstorm session of 2026-10-18
**Approved mockups:** `docs/superpowers/specs/mockups/2026-10-18-motion-redesign/` (open each `.html` in a browser; they are plain-JS approximations of the target feel, not code to port verbatim)

## Intent

The owner's verdict on the current site: it **lacks wow factor that pulls a visitor in to find out more, and it feels too crowded**. The home page tries to say everything at once: a five-part hero with a rotating three-line pitch, fixed side rails, an "About" block that holds bio + skills + timeline + photo, zig-zag project cards, an article list, and contact.

The redesign follows the guide's motion stack (GSAP + ScrollTrigger + SplitText, Lenis, React Bits patterns, `useGSAP`, `gsap.matchMedia`) **on the existing Astro 5 codebase**, and restructures the home page to **one idea per screen, with motion doing the talking**. It also brings the content up to date with the October 2026 CV: the owner is now an **AI Solutions Architect at Daxonet AI**, and his strongest material (Claim Pilot, Trade Pilot, WareBot, the Agentic AI Layer) is not on the site at all.

The guiding theme, which the owner chose: **show, don't tell**. The visitor should see proof of real, shipped AI work in the first second, not read claims about it.

## Goals

- A home page with five calm, distinct sections: **Hero → Selected Work → Career → Latest Writing → Contact**.
- A signature hero moment: a live "agent run" console beside the headline.
- A pinned, sideways-scrolling Selected Work track with a code-drawn illustration per card, where **only the active card animates**.
- Content aligned to the CV across the site *and* every machine-readable surface (JSON-LD, `llms.txt`, generated API, plugin manifests).
- Accessible by default: full `prefers-reduced-motion` support, keyboard and screen-reader friendly, and all meaningful text present in server-rendered HTML.

## Non-goals

- **Migrating to Next.js.** The owner explicitly chose to keep Astro 5. The guide's Next.js-specific rules are translated to Astro equivalents below.
- A full visual redesign of sub-pages (`/about/`, `/projects/`, `/insights/`, `/contact/`, detail pages, `/404`). They get the shared chrome changes and content updates only (see *Sub-pages*).
- Light mode or a theme toggle. The site stays dark-only.
- A manual in-page "disable animations" toggle (the guide's `matchMediaRefresh()` pattern). The OS setting is honoured. *(my call)*
- ESLint rules or Claude Code hooks that mechanically enforce the animation rules. The rules go into `CLAUDE.md` only. *(my call; the project has no linting today)*
- Cursor effects (Splash, Target or Blob cursor) and the guide's separate "Real-Time Applications" and "Data Transformation" sections. Those were folded into the single Work track to avoid re-crowding.
- Flip-based technology filtering on the home page. *(my call; it could later be added to `/projects/`)*

## Anti-goals (a failure even if it technically works)

- **Many things moving at once.** The owner rejected a version where every card animated: "too many things moving on screen". At any moment, at most the hero console plus one active Work card may be animating. The active card's illustration plays only while the Work section is on screen; the decorative hero dot grid moves only in response to the pointer and stops once settled.
- **Over-dimming.** The owner rejected inactive cards that were "too dark and dim". De-emphasis must keep inactive cards readable (see Selected Work).
- **Stating "over 25 years" / "25+ years"** or any explicit years-of-experience figure anywhere: copy, meta, JSON-LD, `llms.txt`, manifests or the generated API. The owner forbade it. Convey seniority through roles, dates and outcomes.
- **Re-crowding.** Each section keeps to its one idea. No side rails, no paragraphs of bio on the home page, no extra card grids.
- **Hiding content from agents.** This site is deliberately agent-first (`llms.txt`, `/api/portfolio.json`, `.well-known/*`, WebMCP tools, JSON-LD). No meaningful text may exist only after JavaScript runs.

## Constraints

- **Stack:** Astro 5, `@astrojs/react` (React 19 islands), `@astrojs/tailwind` (Tailwind 3, config in `tailwind.config.mjs`), static output, served by nginx in Docker (`Dockerfile`, `nginx.conf`). CI (`.github/workflows/ci.yaml`) runs `npm run build` and checks for `dist/index.html`, `404.html`, `api/portfolio.json`, `api/openapi.json`, `llms-full.txt`, `llms.txt`, `ai-plugin.json` and `robots.txt`. All of these must still be produced.
- **New dependencies:** `gsap` (3.13+; SplitText needs `onSplit`), `@gsap/react`, `lenis`. All GSAP plugins are free and ship in `gsap`.
- **Palette** stays as in `DESIGN.md` and `tailwind.config.mjs` (`#050507` canvas, `#00d992` green accent, warm neutrals). New tokens are added: **sky `#38bdf8`**, used only to mark open-source work, plus the home surface and illustration tint tokens listed in `DESIGN.md` (*Portfolio tokens*). Components use tokens, never raw hex.
- **No tests or linting exist.** Verification is `npm run build`, the content and build-output checks in `scripts/verify-content.ts` (`npm run verify`, `verify:dist`, `verify:links`), plus the manual checklist at the end.
- **`CLAUDE.md` is stale:** it describes the old Vite/HashRouter SPA. It must be rewritten for the Astro codebase as part of this work.

## Design: the home page

Approved section order and numbering: **Hero (unnumbered) · 01 Selected Work · 02 Career · 03 Latest Writing · 04 Contact**, then the footer.

### Global chrome

- **Header:** keep the existing fixed, hide-on-scroll header, slimmed down. Logo mark at left. Nav links at right keep the existing page routes: About `/about/`, Work `/projects/`, **Writing** `/insights/`, Contact `/contact/`, plus a Résumé button. The owner renamed the "Insights" label to **"Writing"**. The URL stays `/insights/` so links, RSS and the agent surfaces keep working. *(The rename applies to every visible label: the nav, the home section, the `/insights/` page heading and titles, and breadcrumbs. Routes, slugs, the collection name and machine-readable keys are unchanged; that scope is my call.)* Keep the existing mobile menu island.
- **Remove `FixedSidebars`** (left social rail and right email rail) site-wide. Socials (GitHub, LinkedIn, Medium) and the email move into the Contact section and the footer.
- **Footer:** minimal. "© 2026 Lim Chee Kin · Kuala Lumpur, Malaysia", social links, and the existing source-repo link. The text "Inspired by Brittany Chiang" can go, since the design no longer derives from it. *(my call)*
- **Smooth scrolling (Lenis)** on every page, wired as in the guide: one provider, `autoRaf: false`, driven from `gsap.ticker` with `lagSmoothing(0)`, `ScrollTrigger.update` on every Lenis scroll event, and cleanup on unmount. Import `lenis/dist/lenis.css`. Remove `scroll-behavior: smooth` from `html` in `global.css`, because it fights Lenis. Hash links (`#main-content` skip link, any in-page anchors) must still work via `lenis.scrollTo()` or Lenis's anchor handling. Leave `syncTouch` at its default (`false`) and `respectReducedMotion` on.

### Hero: "show, don't tell" (mockup 01, option C)

- **Left: headline block.**
  - Eyebrow: "Lim Chee Kin · AI Solutions Architect".
  - Headline (working copy): **"I build AI agents that do *real work* inside business systems."** "real work" is in the green accent. It is revealed word by word with GSAP SplitText (`type: "lines, words"`, `mask: "lines"`, `autoSplit: true`, animation returned from `onSplit`). The headline contains no links.
  - One supporting line (working copy): "From a WhatsApp message to a posted sales order, with a human in the loop."
  - Two buttons: **Get in touch** (primary, mailto or `/contact/`) and **Résumé ↗** (`/resume.pdf`).
- **Right: agent console.** A terminal-style panel that streams one "agent run" line by line, then loops through three runs: **trade-pilot**, **claim-pilot** and **warebot**. Each run is about six rows of `step · detail` (for example `whatsapp → extract → match → draft → review → post`), ending on a highlighted "done" row and a blinking cursor. Tabs under the panel show which run is playing. The rows in the mockup are illustrative. Final rows must be written from real but **non-confidential** flows, using made-up document numbers, amounts and SKUs.
- **Background:** a faint interactive dot grid (canvas, about 35% strength) that springs away from the cursor. It pauses when offscreen.
- **Mobile (< 768px):** the console stacks under the headline block. The dot grid is static or omitted.
- **Reduced motion:** the headline appears with a short fade and no movement. The console shows one completed run, with no streaming or loop. The dot grid is static (drawn once) or not mounted.
- **Accessibility:** the console and dot grid are decorative (`aria-hidden="true"`). The headline and supporting line carry the meaning.
- **Removed from the hero:** the "Hi, my name is" greeting, the separate tagline line, and the rotating `Banner.tsx` value-prop pitch (the component and `src/data/value-props.ts` can be deleted if nothing else uses them).

### 01 Selected Work: pinned sideways track (mockup 02)

- **Mechanics (desktop, ≥ 768px wide and ≥ 560px tall):** the section pins at the top of the viewport, and vertical scroll translates an inner track horizontally, then releases. Follow the guide exactly: pin the outer section, translate the inner track with `ease: "none"`, `scrub: 1`, distance computed from `track.scrollWidth - window.innerWidth`, `end: () => "+=" + distance()` and `invalidateOnRefresh: true`. No drag or inertia on the track.
- **Header row:** "01 Selected Work" at left. A counter "`01 / 08`" at right always matches the active card. A thin green progress line runs along the bottom.
- **Cards** are compact (about 360px wide). The owner chose compact over large. Each card, top to bottom:
  1. a code-drawn micro-illustration panel (about 170px tall),
  2. a label: "Enterprise · Daxonet AI" (green) or "Open source" (sky),
  3. the project name,
  4. a one-line outcome,
  5. a short stack line of 3–4 technologies.
  The whole card links to the project's detail page.
- **Order (owner-specified):**

  | # | Card | Kind | Illustration (what it acts out) |
  |---|---|---|---|
  | 1 | **Claim Pilot** | Enterprise | A receipt is scanned; merchant, category and total fields fill in; an "APPROVED" stamp lands |
  | 2 | **Trade Pilot** | Enterprise | A WhatsApp bubble with a PO PDF turns into a line-item table, then "SO created ✓" |
  | 3 | **WareBot** | Enterprise | A stock question, an answer, a move request, a "Confirm" button pressed, then a transfer reference |
  | 4 | **Agentic AI Layer** | Enterprise | Telegram, WhatsApp and Voice pulse into an agent hub, which reaches locked ERP, GL and M365 tools via MCP |
  | 5 | **Project Concord** | Open source | Agent → MCP shield → legacy DB cylinder, with a SQL query typing out and a "1 row · allowed by role" result |
  | 6 | **Talk To AI** | Open source | A live voice waveform; STT → LLM → TTS pills light in turn; "<300 ms" |
  | 7 | **RAG.WTF** | Open source | Documents become a dot cloud, the three nearest dots light up, then a cited answer bubble appears |
  | 8 | **All projects →** | — | No illustration. A dashed outline card linking to `/projects/` that names a few more projects |

- **Only the active card animates** (an owner requirement). The active card is the one matching the counter: `round(progress × (n − 1))`.
  - **Active card:** full opacity, a soft glowing border (green, or sky for open source), and its illustration plays from the start and loops.
  - **Inactive cards:** card at about 90% opacity, illustration at about 70% opacity and desaturated (about 55% saturation), **frozen on its finished frame** so it still reads at a glance. The owner approved exactly this level (mockup 02). Earlier, darker dimming was rejected.
  - Implement each illustration as a GSAP timeline (`repeat: -1`) that is played when active and set to `progress(1)` then paused when inactive. Keep pointer- or time-created tweens inside `contextSafe`. Track the active index outside React state, or update state only when the index changes (never per frame).
- **Mobile (< 768px) and short viewports (< 560px tall, such as landscape phones, where a pinned 470px card would not fit):** no pinning. The track becomes a native horizontal swipe row with scroll-snap. The active card is the one most in view (IntersectionObserver within the row), with the same play/freeze rule. Make sure Lenis does not hijack the horizontal swipe.
- **Reduced motion:** no pin or scrub. Cards show as a static row or grid, every illustration rests on its finished frame, and nothing loops.
- **Accessibility:** illustrations are `aria-hidden`. Card text carries the meaning. Cards are focusable links, and keyboard focus on a card makes it active (and scrolls it into view).

### 02 Career: batched timeline (mockup 03, top half)

- Two columns on desktop. **Left (sticky):** "02 Career", one line (*"From enterprise Java and banking systems to agentic AI. The same job throughout: make complex systems work for the business."*), and a "Full experience →" link to `/about/`. **Right:** a vertical timeline.
- **Entries** (from the CV; titles, organisations and dates are read from the experience collection):
  - **2026 — Present · AI Solutions Architect · Daxonet AI.** Enterprise agents for expense claims, trade documents and warehouse operations, plus company-wide AI enablement. Chips: Claude Agent SDK, MCP, Gemini, FastAPI.
  - **2021 — 2025 · Principal AI Architect · Independent Consultant.** MCP for enterprise databases, real-time voice AI, self-hosted RAG, and a healthcare agent on GKE. Chips: RAG, Voice AI, GKE, Ragas.
  - **2013 — 2020 · Senior Java Tech Lead · DXC Technology.** Led 6+ engineers across China, Europe and Malaysia on an enterprise analytics console. Chips: Spring Boot, AWS, Microservices.
  - **2012 — 2013 · Senior Java Tech Lead · Zurich Technology Services Malaysia.** Resolved 60+ cross-service production issues in claims systems.
  - **2005 — 2012 (condensed) · Open source, banking and healthcare delivery.** 10+ open-source Grails plugins · RM6M and RM2M banking tenders at Penril · RM2M hospital inventory system at CMG Online.
  - **1999 — 2005 (condensed) · Where it started.** Siemens Multimedia, Media Trend, Online One and Tee Yam Holding.
- **Motion:** entries reveal with `ScrollTrigger.batch()` (opacity plus a small `y`/`scale`, staggered), created inside `gsap.matchMedia()`. A rail on the timeline fills top to bottom as you scroll (a scrubbed `scaleY` transform). Entry dots turn green as they reveal.
- **Hidden state is set by JS (`gsap.set`), never by CSS,** so no-JS visitors and agents always see the entries.
- **Mobile:** single column, heading not sticky. **Reduced motion:** entries appear with a short fade (or immediately), and the rail is static and full.

### 03 Latest Writing: plain rows (mockup 04, option A)

- The owner asked where the Insights (now "Writing") section went. The **slim rows** option was recommended and approved.
- A header row with "03 Latest Writing" and "All writing →" (`/insights/`).
- The **three newest articles** by `publishDate` from the `articles` collection, as full-width rows: `date (Mon YYYY) · title · platform/topic · ↗`. Hover nudges the row right, tints it green and moves the arrow. External articles open in a new tab; internal ones go to `/insights/<slug>/`.
- Motion is limited to a short batched fade-in. No cards, no images.
- Mobile: title + arrow only.

### 04 Contact: big line, magnetic button (mockup 03, bottom half)

- Eyebrow "04 · Contact". Large headline: **"Have a workflow that should *run itself?*"** ("run itself?" in green). One line: "I design and ship AI agents that plug into the systems you already run. Tell me about yours."
- One primary pill button, **Get in touch →** (to `/contact/` or mailto). It is **magnetic**: it eases toward the cursor within a surrounding zone, implemented with `gsap.quickTo` (or by vendoring React Bits Magnet and reviewing it against the rules). Magnetism is enabled only for `(pointer: fine)` and no reduced motion.
- Quiet links underneath: GitHub · LinkedIn · Medium · Email · Résumé ↗.
- A soft radial green glow behind the section (static CSS).

### What leaves the home page

The "About Me" block (three bio paragraphs, skills list, three-job timeline and photo), the zig-zag featured-project layout, and the side rails. **The profile photo remains on `/about/` only.** *(my call)*

## Design: content updates (from the CV)

### Positioning

- `ENGINEER_TITLE` → **"AI Solutions Architect"**. The CV subtitle "Enterprise AI and Business Systems" can be used in meta descriptions. This flows into `SITE_TITLE`, page titles, JSON-LD and the generated API.
- `HERO_CONTENT`, `ABOUT_CONTENT` and `CONTACT_CONTENT` in `src/data/site.ts` are rewritten to match the sections above. The `/about/` intro paragraphs are rewritten from the CV's professional summary, with no years figure.
- JSON-LD `worksFor` → Daxonet AI Sdn. Bhd. Remove "over 25 years" from the Person description and the FAQ answers. Rewrite the "How long has Lim Chee Kin been working…" FAQ entry to describe the career arc without a figure, or drop it.

### Projects collection

- **Schema additions** (`src/content/config.ts`), all optional so existing entries still validate:
  - `kind: 'enterprise' | 'oss'` (default `'oss'`)
  - `org` (for example "Daxonet AI")
  - `tagline` (the one-line card outcome)
  - `stack` (a 3–4 item short list for the card)
  - `visual` (the key of the micro-illustration component)
- **New entries:**
  - `claim-pilot`, `trade-pilot`, `warebot` and `agentic-ai-layer`: enterprise, Daxonet AI, written from the CV bullets, with no repo or live links.
  - `project-concord`: open source. It has no project file today, although the FAQ links to it. Use the GitHub repo URL from `llms.txt`.
  - `smart-hvac-catalogue`: enterprise, not featured, named on the "All projects" card.
- **`featured` / `featuredOrder`** produce the track order above: claim-pilot 1, trade-pilot 2, warebot 3, agentic-ai-layer 4, project-concord 5, talk-to-ai 6, rag-wtf 7. `telegram-gpt` and `open-text-embeddings` become non-featured.
- Enterprise detail pages have no screenshot. The detail page template must render cleanly without `image`, `githubUrl` or `liveUrl`.

### Experience collection

- **Add `00-daxonet.json`** (AI Solutions Architect, Daxonet AI, 2026-present), with its description from the CV bullets.
- **Rewrite `01-ai-engineer.json`** as Principal AI Architect, Independent Consultant, 2021-01 to 2025-12, from the CV. Keep the open-source bullets that the CV omits (RAG.WTF, open-text-embeddings, Talking Book, Fluwix) if they are still true. *(my call)*
- **Merge, don't replace** (owner decision). Existing detail the CV trimmed stays online: the DXC revenue, EPIC Configurator and DnA dashboard bullets, Zurich's team size, the earlier-role entries, and the open-source bullets on the 2021–2025 role (RAG.WTF, open-text-embeddings, Talking Book, Fluwix). The owner confirmed these are still true and wants them kept. New CV facts are *added* to DXC and Zurich where they aren't already present. Fix `sortOrder` values so the order is newest first. For the Zurich/DXC date overlap, keep the site's existing month-level dates. *(my call)*

### Résumé PDF

Copy `docs/Resume-202610.pdf` over `public/resume.pdf` (owner decision). Every Résumé link keeps pointing at `/resume.pdf`. The new PDF has no years figure. It does include the owner's phone number, which the owner has accepted.

### Articles collection: sync with Medium

The owner asked for every article link to be checked against https://limcheekin.medium.com/. The Medium feed (checked 2026-10-18) shows the site's article data is out of date:

- The two "coming soon" pieces **are published** and need their `externalUrl`.
- **All five existing `publishDate`s are wrong.**
- **Five published articles are missing.**

Sync the collection to this table. Titles and dates follow Medium.

| Slug (existing or new) | Medium title | Published | URL |
|---|---|---|---|
| *new* `zero-trust-ai-agents` | Zero-Trust Security for Autonomous AI Agents | 2026-03-13 | https://limcheekin.medium.com/zero-trust-security-for-autonomous-ai-agents-691b5cbcec21 |
| *new* `llm-load-testing-gke` | Solving the LLM Load Testing Paradox: A Reference Architecture on GKE Autopilot | 2026-02-16 | https://limcheekin.medium.com/solving-the-llm-load-testing-paradox-a-reference-architecture-on-gke-autopilot-c8c2271f5cfb |
| *new* `nanochat-single-gpu` | Reproducing Karpathy's NanoChat on a Single GPU — Step by Step with AI Tools | 2025-10-15 | https://limcheekin.medium.com/reproducing-karpathys-nanochat-on-a-single-gpu-step-by-step-with-ai-tools-e9420aaee912 |
| `legacy-database-ai` | AI is Ready. Your Legacy Database Isn't. Let's Fix That. | 2025-08-18 *(site: 2026-04-01)* | https://limcheekin.medium.com/ai-is-ready-your-legacy-database-isnt-let-s-fix-that-f28013a2f833 |
| `no-code-mcp-server` | Building Your First No-Code MCP Server: The Fabric Integration Story | 2025-06-20 *(site: 2026-03-15)* | https://limcheekin.medium.com/building-your-first-no-code-mcp-server-the-fabric-integration-story-90da58cdbe1f |
| `talking-book` | Introducing Talking Book | 2025-05-19 *(site: 2025-10-01)* | https://limcheekin.medium.com/introducing-talking-book-487f6e3bc2c2 |
| `beyond-the-cloud` | Beyond the Cloud: How I Built My Own AI Server (and Why) | 2025-04-23 *(site: 2025-08-15)* | https://limcheekin.medium.com/beyond-the-cloud-how-i-built-my-own-ai-server-and-why-68b7235117f3 |
| `own-your-ai-data` | Would you pay $1/month to Own Your AI Data? | 2025-04-19 *(site: 2025-07-01)* | https://limcheekin.medium.com/would-you-pay-1-month-to-own-your-ai-data-6dbb0db1eeaf |
| *new* `talk-to-ai-fastrtc` | Talk To AI with FastRTC: Real-Time Voice Conversations with AI | 2025-03-10 | https://limcheekin.medium.com/talk-to-ai-with-fastrtc-real-time-voice-conversations-with-ai-5cf35f9691d8 |
| *new* `open-text-embeddings-intro` | Unleashing the Power of Open Source Text Embeddings with open-text-embeddings | 2023-11-13 | https://limcheekin.medium.com/unleashing-the-power-of-open-source-text-embeddings-with-open-text-embeddings-e8fc684aa2cd |

- **Adding the five missing articles** is *my call*. "Latest Writing" should show the newest real writing, and every listed piece is a published article on the owner's own Medium.
- Medium's feed returns only the 10 most recent posts. Older posts, if any, are out of scope.
- New entries take `description` and `tags` from the Medium article. Every entry gets `platform: "Medium"`, or keeps its current topical platform string. *(builder's choice; be consistent)*
- Since every article now has an `externalUrl`, all home-page and `/insights/` links go to Medium. `/insights/<slug>/` pages still build for agents and SEO.
- Update the Articles section of `public/llms.txt` to match, removing the "(coming soon)" markers.
- **The resulting Latest Writing rows** are: Zero-Trust Security for Autonomous AI Agents (Mar 2026), Solving the LLM Load Testing Paradox (Feb 2026), Reproducing Karpathy's NanoChat on a Single GPU (Oct 2025).

### Machine-readable surfaces

All of these must drop "25+ years" and the old title, and reflect the new role and projects:

- `public/llms.txt`
- `scripts/generate-api.ts` (the `portfolio.json` title and the `llms-full.txt` header)
- `public/ai-plugin.json`
- `public/.well-known/ai-plugin.json`
- `public/.well-known/agent.json` (check it)
- `public/.well-known/mcp.json`
- `public/api/openapi.json`
- `public/site.webmanifest`
- `README.md` (it also says "25+ years")
- the FAQ / JSON-LD blocks in `index.astro` and `about.astro`
- the `/about/` page meta description

`src/pages/projects/[slug].astro` already renders cleanly without an image, GitHub link or live link, so enterprise detail pages need no template change for that. The Project Concord repo URL in `llms.txt` points to a public repo that exists.

## Design: sub-pages

All sub-pages:

- get the new header and footer, lose `FixedSidebars`, and get Lenis.
- are otherwise **visually unchanged** except where content changes require it: `/about/` shows the updated experience, and `/projects/` lists the new entries.
- **Featured-card images on `/projects/`:** enterprise projects have no image, so they use their micro-illustration on its finished frame, or a plain card. *(builder's choice)*

## How the guide maps onto Astro

The guide is written for Next.js 16. Its rules carry over with these translations:

| Guide (Next.js) | This project (Astro 5) |
|---|---|
| Client Components with `"use client"` | React islands (`.tsx`) hydrated with a `client:*` directive. Islands are still server-rendered at build time, so no top-level `window`/`document` access in module bodies. |
| `next/dynamic` with `{ ssr: false }` for heavy canvas/WebGL | `client:only="react"` (no SSR) for purely decorative canvases like the dot grid, or a lazily mounted canvas inside an SSR'd island |
| `SmoothScroll` provider in `app/layout.tsx` | A `SmoothScroll` island mounted once in `src/layouts/BaseLayout.astro` with `client:load` |
| `lib/gsap.ts` registering plugins | `src/lib/gsap.ts`, imported by every animating island. Islands share the same module instance, so plugins register once. |
| `next/image` / `next/font` | Explicit `width`/`height` on every `<img>` (or Astro `<Image>`); fonts unchanged |

**Rules from the guide that apply unchanged:**

- Animate only transforms and opacity in our own code. CSS hover/focus colour transitions are the one exception; layout properties, `filter` and `box-shadow` never transition.
- Use `useGSAP()` with `{ scope }`, never bare `useEffect`, for GSAP. The only exception is the Lenis ↔ ticker bridge.
- Wrap event-created tweens in `contextSafe()`, and remove manually added listeners in cleanup.
- Never keep tweens in `useState`.
- Respect reduced motion with `gsap.matchMedia(scope)`.
- Avoid `content-visibility` on animated sections.
- Do not put `transform`/`will-change` on ancestors of pinned sections.
- Call `ScrollTrigger.refresh()` after layout settles.

**ScrollTrigger ordering across islands:** the Work pin changes the page height for everything below it. Islands that create ScrollTriggers must either all hydrate eagerly in page order, or use `refreshPriority` / `ScrollTrigger.sort()` plus a `refresh()` once all have mounted. *(builder's choice of mechanism; the requirement is that Career/Writing triggers are correct after the Work pin is created)*

**React Bits:** its components are optional sources. If one is vendored (for example Dot Grid or Magnet), copy it into `src/components/`, install its exact dependencies, and review it against the rules above (cleanup, reduced motion, transforms only). The shadcn CLI path assumes a shadcn setup this project doesn't have, so copying the source is acceptable.

**`CLAUDE.md`:** rewrite it to describe the Astro codebase accurately (structure, content collections, agent-first files, Docker/nginx deploy, CI checks). Add the guide's animation rules, adapted to Astro as in the table above, and the "no explicit years of experience" content rule.

## Left to the builder

- Component decomposition and file names. Whether static parts of sections stay `.astro` with small islands, or each section is one island. *(Constraint: section text must be in the SSR'd HTML.)*
- Exact easing, durations and stagger values, as long as they feel like the mockups.
- The dot-grid and magnet implementation (custom or vendored React Bits).
- The final console run copy (realistic, non-confidential, made-up identifiers).
- Exact copy of new project and experience entries, drawn from the CV.
- How the inactive "finished frame" is produced for each illustration.

## Verification checklist

1. `npm run build` succeeds, and every file CI checks for exists in `dist/`.
2. No "25" years phrasing remains: `grep -rniE "25\+? ?years|over 25" src public scripts dist README.md` returns nothing, and `public/resume.pdf` is byte-identical to `docs/Resume-202610.pdf`.
2a. Every article `externalUrl` returns HTTP 200 (follow redirects), and the home page's three Latest Writing rows are the three newest Medium articles.
3. **With JS disabled,** the home page still shows the headline, all card names and one-liners, all career entries, the insight titles and the contact links.
4. **Reduced motion** (emulated in dev tools): no x/y movement, no pin or scrub, no looping console, dot grid or illustrations.
5. **Desktop scroll:** the Work section pins and releases cleanly with no jitter. The counter, active glow and playing illustration always agree, and at most one card animates. Career and Writing reveals fire at the right scroll positions after the pin.
6. **Resize and reload mid-page:** the track distance and trigger points realign, and the split headline re-splits.
7. **At 375px width:** no horizontal page scroll, the console stacks, the Work row swipes natively, and Career is one column.
8. **Keyboard:** the skip link works with Lenis, focus is visible throughout, and tabbing through Work cards makes each active and scrolls it into view.
9. **Leaks:** `ScrollTrigger.getAll().length` is stable after resizes. In dev, no duplicated animations from island re-mounts.
10. **Lighthouse on the home page:** CLS ≈ 0, and no large regression in performance score versus the current site.
11. **Agent surfaces:** `/api/portfolio.json`, `llms.txt`, `llms-full.txt` and the JSON-LD reflect the new title, role and projects.

## Amendments (2026-10-19)

Made after the two-axis review of the branch. Each one records a deliberate implementation choice or closes a gap the review found:

- **Pin breakpoint:** the Work pin also needs a viewport at least 560px tall. Shorter viewports get the swipe row (see *01 Selected Work*).
- **Palette:** the home surfaces and illustration tints are named tokens documented in `DESIGN.md`, alongside `sky`.
- **Verification:** `scripts/verify-content.ts` automates the content and build-output parts of the checklist.
- **Animated properties:** CSS hover/focus colour transitions (`color`, `background-color`, `border-color`) are allowed and stay on buttons and links. Transitions of anything else moved to transforms or an overlay's opacity: the Writing row's `padding` nudge and gradient tint, the Work card's border-and-shadow glow, and the `filter` and `box-shadow` hover changes.
- **Concurrency:** the active Work illustration pauses while the section is off screen. The dot grid only reacts to the pointer.
- **Career entries:** titles, organisations and dates come from the experience collection, so Zurich shows its full company name.
- **Contact links:** the quiet links include the email (as *Global chrome* asks), between Medium and Résumé.
