# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

Personal portfolio for Lim Chee Kin (AI Solutions Architect, Daxonet AI), live at `https://kin.rag.wtf`. Astro 5 static site with React 19 islands, built to `dist/` and served by nginx in Docker. The site is deliberately agent-first: all meaningful text is in server-rendered HTML.

## Commands

```bash
npm run dev           # astro dev
npm run build         # astro build, then tsx scripts/generate-api.ts
npm run preview       # serve dist/
npm run verify        # content/source checks (scripts/verify-content.ts)
npm run verify:dist   # same plus checks on built dist/ (run after build)
npm run verify:links  # same plus HTTP checks of article externalUrls (network)
```

There is no test runner and no linter. Verification is `build` plus the three `verify` commands plus manual browser checks.

## Stack and layout

- Astro 5, `@astrojs/react` (React islands), `@astrojs/tailwind` (Tailwind 3, config in `tailwind.config.mjs`), `@astrojs/sitemap`. `trailingSlash: 'always'`. Dark only.
- Motion: `gsap` (ScrollTrigger, SplitText), `@gsap/react`, `lenis`.
- `src/pages/` — `index`, `about`, `contact`, `projects/` (index + `[slug]`), `insights/` (index + `[slug]`), `404`, `rss.xml.ts`.
- `src/layouts/BaseLayout.astro` — head/meta/JSON-LD, Header, Footer, `<SmoothScroll client:load />` (once), `WebMCPTools`.
- `src/components/` — shared `.astro` pieces (Header, Footer, Button, Card, Breadcrumb, ContactForm, ExperienceTimeline), `MobileMenu.tsx`, `WebMCPTools.tsx`.
- `src/components/motion/` — `SmoothScroll.tsx` (Lenis, the only place a bare `useEffect` touches GSAP), `RevealGroup.tsx`.
- `src/lib/gsap.ts` — registers `useGSAP` and `ScrollTrigger` once and re-exports them with `gsap`. In dev only, `window.ScrollTrigger` is exposed for leak checks. `src/lib/gsap-split.ts` registers and re-exports `SplitText`; import it only where text is split (the hero headline), so other pages don't ship it. `src/lib/motion.ts` exports `MQ` media queries; `MQ.pin` is the Work pin breakpoint, mirrored by the Tailwind `pin` / `nopin` screens in `tailwind.config.mjs`. `src/lib/button-styles.ts` holds the shared button classes, `src/lib/layout.ts` the shared page gutter (`GUTTER`), `src/lib/palette.mjs` the colour tokens (read by `tailwind.config.mjs` and by canvas code), and `src/lib/image-size.ts` the build-time `<img>` size lookup.
- `src/data/` — `site.ts` (name, title, nav, hero/about/contact copy, links), `career.ts` (home Career copy; `getCareerEntries()` takes titles, orgs and dates from the `experience` collection), `agent-runs.ts` (hero console runs).
- `src/styles/global.css`, `DESIGN.md` (palette; "Portfolio tokens" lists the tokens in `palette.mjs`).
- `src/components/home/SectionHeading.tsx` renders the "NN Title" heading of every numbered home section.

### Home page sections (`src/pages/index.astro`)

Hero (unnumbered), 01 Selected Work, 02 Career, 03 Latest Writing, 04 Contact.

| Section | Files | Islands |
|---|---|---|
| Hero | `home/Hero.astro` | `HeroIntro` (SplitText headline), `AgentConsole` (looping runs), `DotGrid` (`client:only`, decorative) |
| Work | `home/WorkTrack.tsx`, `home/visuals/*` | `WorkTrack` (`client:load`): pinned horizontal track on desktop, native swipe row on mobile; one code-drawn illustration per card via `VizFrame` (runs `useVisualTimeline`) |
| Career | `home/CareerTimeline.tsx` | `client:load`: `ScrollTrigger.batch` reveal, scroll-filled rail |
| Writing | `home/LatestWriting.astro` | `RevealGroup` (three newest articles by `publishDate`) |
| Contact | `home/ContactCta.astro` | `MagnetButton` (`client:visible`, `gsap.quickTo`) |

### Content collections (`src/content/config.ts`)

- `projects` (md): `title`, `description`, `featured`, `featuredOrder`, `technologies`, `category`, optional `githubUrl/liveUrl/articleUrl/image/dateStarted`, plus card fields `kind` (`enterprise` | `oss`, default `oss`), `org`, `tagline`, `stack` (max 4), `visual` (`claim|trade|ware|agent|concord|talk|rag`, selects the illustration). `featuredOrder` sets the Work track order. Enterprise entries have no image or links; detail pages render without them.
- `articles` (md): `title`, `description`, `publishDate`, `tags`, `externalUrl`, `platform`. Synced to https://limcheekin.medium.com/; all have an `externalUrl`. `/insights/<slug>/` pages still build for agents and SEO.
- `experience` (json): `company`, `title`, `startDate`, `endDate`, `description[]`, `technologies`, `sortOrder` (newest first).

## Agent-first surfaces

- `public/llms.txt`, `robots.txt`, `site.webmanifest`, `ai-plugin.json`, `api/openapi.json`, `.well-known/{agent.json,ai-plugin.json,mcp.json,agent-policy,security.txt}`.
- `scripts/generate-api.ts` runs after `astro build` and writes `dist/api/portfolio.json` and `dist/llms-full.txt` from the content collections.
- JSON-LD (Person, WebSite, FAQPage) in `index.astro` and `about.astro`; WebMCP tools in `WebMCPTools.tsx`.
- When changing the title, role, projects or articles, update all of these surfaces, not just the pages.

## Deploy and CI

- `Dockerfile`: node:20-alpine runs `npm ci && npm run build`; nginx:alpine serves `dist/` with `nginx.conf` (trailing-slash redirect, `/sitemap.xml` -> `/sitemap-index.xml`, cache and security headers, custom 404).
- `.github/workflows/ci.yaml` (push/PR to `main`): `npm ci`, `npm run build`, then requires in `dist/`: `index.html`, `404.html`, `api/portfolio.json`, `api/openapi.json`, `llms-full.txt`, `llms.txt`, `ai-plugin.json`, `robots.txt`. Do not break any of them.
- Deployed `public/resume.pdf` is linked as `/resume.pdf` everywhere.

## Animation rules

Translated from the redesign guide (Next.js) to Astro. Binary rules; follow them exactly.

- Animate only `x`, `y`, `xPercent`, `yPercent`, `scale`, `scaleX`, `scaleY`, `rotation`, `opacity` in our own code, in GSAP and in CSS transitions alike. The one exception is CSS hover/focus colour transitions (`color`, `background-color`, `border-color`, e.g. `transition-colors`). Never transition layout properties (`width`, `height`, `top`, `padding`, `margin`), `filter` or `box-shadow`, and never use `transition-all` or `transition-shadow`: fade an overlay's `opacity` instead, or switch the value instantly.
- Every GSAP call lives in `useGSAP(fn, { scope })` imported from `src/lib/gsap.ts`. Never a bare `useEffect` (sole exception: the Lenis/ticker bridge in `SmoothScroll`).
- Tweens created from events or timers are wrapped in `contextSafe`. Manual listeners are removed in cleanup.
- Never store tweens in `useState`. Never update React state per frame.
- Every animating island branches with `gsap.matchMedia(scope)` using `MQ`. Under reduced motion: no x/y movement (CSS hover nudges use `motion-safe:`), no pin or scrub, no loops. Looping and scrubbed pieces rest on their finished frame; reveals are immediate or a short opacity fade.
- Meaningful text is server-rendered. Hidden-before-reveal states are set with `gsap.set` in JS, never CSS.
- No top-level `window`/`document` in island module bodies (islands render at build time). Purely decorative canvases use `client:only="react"`.
- At most the hero console plus one active Work card animate at once. The active card's illustration plays only while the Work section is on screen. The decorative hero dot grid moves only in response to the pointer and stops once settled or offscreen. Inactive cards: card opacity 0.9; illustration opacity 0.7 with `saturate(0.55)`, frozen on its finished frame.
- Do not put `transform` or `will-change` on ancestors of a pinned section. Do not use `content-visibility` on animated sections.
- Pinned section: `scrub: 1`, `ease: "none"`, `invalidateOnRefresh: true`, distance from `scrollWidth - innerWidth`. The Work pin has `refreshPriority: 10` so later triggers measure after it; call `ScrollTrigger.refresh()` after layout settles.
- Lenis: one provider, `autoRaf: false`, driven by `gsap.ticker` with `lagSmoothing(0)`. No `scroll-behavior: smooth` in CSS.
- Explicit `width`/`height` on every `<img>`.
- No effect that makes the page crowded: one idea per section, no side rails.

## Content rules

- No explicit years-of-experience figure anywhere (copy, meta, JSON-LD, llms files, manifests, generated API, README, this file, PDF). Convey seniority with roles, dates and outcomes. `npm run verify` scans for it, including this file.
- Title is "AI Solutions Architect" at Daxonet AI. The old multi-part title must not appear.
- The visible label is "Writing"; the URL stays `/insights/`, and slugs, the `articles` collection and JSON keys keep their names.
- Palette per `DESIGN.md`; `sky` (`#38bdf8`) is used only for open-source work. Components use Tailwind colour, shadow and gradient tokens (from `palette.mjs` via `tailwind.config.mjs`), never raw hex or `rgba()`.
- Merge, never drop, experience detail: add new CV facts to existing entries.
- Resume PDF must not state a years figure.
