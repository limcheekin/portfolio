# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

Personal portfolio for Lim Chee Kin (AI Solutions Architect, Daxonet AI), live at `https://kin.rag.wtf`. Astro 5 static site with React 19 islands, built to `dist/` and served by nginx in Docker. The site is deliberately agent-first: all meaningful text is in server-rendered HTML.

## Commands

```bash
npm run dev           # astro dev
npm run build         # astro build, then tsx scripts/generate-api.ts, then build:mcp (bundles mcp/server.ts to build/mcp/server.mjs)
npm run mcp:dev       # run the MCP server from source against dist/ (http://127.0.0.1:3001/mcp; build first)
npm run mcp:smoke     # end-to-end MCP checks against an endpoint (default http://127.0.0.1:3001/mcp; CI runs it)
npm run preview       # serve dist/
npm run images        # write .webp next to page PNGs in public/images (after adding or replacing one)
npm test              # unit tests (node:test via tsx) for the HIRE scoring module
npm run verify        # content/source checks (scripts/verify-content.ts)
npm run verify:dist   # same plus checks on built dist/ (run after build)
npm run verify:links  # same plus HTTP checks of article externalUrls (network)
```

Unit tests: `npm test` (node:test via tsx) for the HIRE scoring module. There is no linter. Verification is `build` plus the three `verify` commands, `mcp:smoke`, plus manual browser checks.

## Stack and layout

- Astro 5, `@astrojs/react` (React islands), `@astrojs/tailwind` (Tailwind 3, config in `tailwind.config.mjs`), `@astrojs/sitemap`. `trailingSlash: 'always'`. Dark only.
- Motion: `gsap` (ScrollTrigger, SplitText), `@gsap/react`, `lenis`.
- `src/pages/` — `index`, `about`, `contact` (+ `contact/thanks`, the no-JS form confirmation), `projects/` (index + `[slug]`), `insights/` (index + `[slug]`), `hire/` (the HIRE check tool), `404`, `rss.xml.ts`.
- `src/layouts/BaseLayout.astro` — head/meta/JSON-LD, Header, Footer, `<SmoothScroll client:load />` (home page only, via the `smoothScroll` prop; inner pages scroll natively and ship no GSAP, except `/hire/`, whose tool uses it for its score gauge and step transitions), `WebMCPTools`.
- `src/components/` — shared `.astro` pieces (Header, Footer, Button, `Link` (every link that may open a new tab: target, rel and the screen-reader hint, derived from the URL or `newTab`; Button renders its anchors through it), Breadcrumb (also emits the page's BreadcrumbList JSON-LD), ContactForm, ExperienceTimeline, `ProjectCard` for `/projects/`, `ArticleRow` for Latest Writing and `/insights/`, `Img` for content images), `MobileMenu.tsx` (drawer is `inert` while closed; while open, `#main-content` and the footer are `inert`), `WebMCPTools.tsx`.
- Inner pages (About, Projects, a project, Writing, an article, Contact) share `PAGE_MAIN` (`src/lib/layout.ts`), `PAGE_TITLE`, `CHIP`, `MEASURE` (reading measure for prose and leads) and `TAP_LINK` (44px tap area for small text links) (`src/lib/text-styles.ts`) and the `Breadcrumb` component, and use the same card, chip and rail language as the home page. The skip link lives in `BaseLayout`.
- Fonts: body text is Inter Variable, self-hosted from `@fontsource-variable/inter` (imported in `BaseLayout`, which also preloads the latin file). The hero h1 uses the `font-display` (system-ui) stack.
- `src/components/motion/` — `SmoothScroll.tsx` (Lenis, the only place a bare `useEffect` touches GSAP; under reduced motion it turns Lenis wheel smoothing off), `RevealGroup.tsx`.
- `src/lib/gsap.ts` — registers `useGSAP` and `ScrollTrigger` once and re-exports them with `gsap`. In dev only, `window.ScrollTrigger` is exposed for leak checks. `src/lib/gsap-split.ts` registers and re-exports `SplitText`; import it only where text is split (the hero headline), so other pages don't ship it. `src/lib/motion.ts` exports `MQ` media queries; `MQ.pin` is the Work pin breakpoint, mirrored by the Tailwind `pin` / `nopin` screens in `tailwind.config.mjs` (`tall` is its height half). `src/lib/button-styles.ts` holds the shared button classes, `src/lib/layout.ts` the shared page gutter (`GUTTER`, sized by the `--gutter` variable in `global.css`), `src/lib/palette.mjs` the colour tokens (read by `tailwind.config.mjs` and by canvas code), `src/lib/image-size.ts` the build-time `<img>` size lookup (used by `Img.astro`, which serves the `.webp` sibling of a local PNG and fails the build if it is missing), `src/lib/reveal.ts` the shared scroll reveal (`batchReveal`), `src/lib/project-jsonld.ts` the per-project JSON-LD (enterprise → `SoftwareApplication`, open source with a repository → `SoftwareSourceCode`, open work without code → `CreativeWork`), `src/lib/jsonld.ts` the shared JSON-LD node ids (`PERSON_ID`, `WEBSITE_ID`, `PERSON_REF`; every author/publisher references the one Person) plus `webPageJsonLd` and `breadcrumbJsonLd` (Home is `SITE_URL/` with the slash), `src/lib/person-jsonld.ts` the Person node on home and About (employer names come from the `experience` collection), `src/lib/meta.ts` `clip` (BaseLayout clips every meta description to 160 characters), `src/lib/paths.ts` page paths and slugs (`projectPath`, `articlePath`, `markdownPath`, `roleSlug`, `rolePath`; no Astro imports, so generate-api uses them too), `src/lib/links.ts` the new-tab rule and hint text, and `src/lib/project-kind.ts` the project kinds shared by the schema and `generate-api.ts`.
- `src/data/` — `site.ts` (name, title, nav, hero/about/contact copy, links), `career.ts` (home Career copy; `getCareerEntries()` takes titles, orgs and dates from the `experience` collection; entries carry `data-slug`, and roles on About have the anchor `#role-<slug>`), `faq.ts` (the FAQ shown on About and its FAQPage JSON-LD; the schema only ever repeats what the page shows), `agent-runs.ts` (hero console runs), `mcp-servers.ts` (the MCP Servers console: connect commands and fixed sample transcripts; the portfolio result line summarises a real `search_portfolio` call).
- `src/styles/global.css`, `DESIGN.md` (palette; "Portfolio tokens" lists the tokens in `palette.mjs`).
- `src/components/home/SectionHeading.tsx` renders the "NN Title" heading of every numbered home section.

### Home page sections (`src/pages/index.astro`)

Hero (unnumbered), 01 Selected Work, 02 Career, 03 Latest Writing, 04 MCP Servers, 05 Contact.

| Section | Files | Islands |
|---|---|---|
| Hero | `home/Hero.astro` | `HeroIntro` (SplitText headline), `AgentConsole` (looping runs), `DotGrid` (`client:only`, decorative) |
| Work | `home/WorkTrack.tsx`, `home/visuals/*` | `WorkTrack` (`client:load`): pinned horizontal track on desktop, native swipe row on mobile; one code-drawn illustration per card via `VizFrame` (drawn on a 312×170 canvas scaled to fit the frame; runs `useVisualTimeline`) |
| Career | `home/CareerTimeline.tsx` | `client:load`: `ScrollTrigger.batch` reveal, scroll-filled rail |
| Writing | `home/LatestWriting.astro` | `RevealGroup` (three newest articles by `publishDate`) |
| MCP Servers | `home/McpServers.astro`, `home/McpConsole.tsx`, `src/data/mcp-servers.ts` | `McpConsole` (`client:visible` with a 600px `rootMargin`, so it hydrates before it is seen): ARIA tabs (HIRE, then Portfolio), every transcript server-rendered (inactive panels `hidden`); each tab's rows fade and rise once on its first view while its ScrollTrigger is active (never loops; the hero console is offscreen by then); copy button with an `aria-live` "Copied" |
| Contact | `home/ContactCta.astro` | `MagnetButton` (`client:visible`, `gsap.quickTo`) |

### Content collections (`src/content/config.ts`)

- `projects` (md): `title`, `description`, `summary` (meta description: one sentence naming the project, at most 160 characters; the schema enforces the length), `featured`, `featuredOrder`, `technologies`, `category`, optional `githubUrl/liveUrl/articleUrl/image/dateStarted`, `languages` (open-source projects: programming languages, used for JSON-LD `programmingLanguage`), plus card fields `kind` (`enterprise` | `oss`, default `oss`), `org`, `tagline`, `stack` (3–4 items), `visual` (`claim|trade|ware|agent|concord|talk|rag`, selects the illustration). `featuredOrder` sets the Work track order. Enterprise entries have no image or links; detail pages render without them.
- `articles` (md): `title`, `description`, `publishDate`, `tags`, `externalUrl`, `platform`. Synced to https://limcheekin.medium.com/; all have an `externalUrl`. `/insights/<slug>/` pages still build for agents and SEO.
- `experience` (json): `company`, `title`, `startDate`, `endDate`, `description[]`, `technologies`, `sortOrder` (newest first).

## Agent-first surfaces

- `public/llms.txt` (hand-written except its project list: generate-api replaces the `<!-- projects: ... -->` line with every project from the collection), `robots.txt`, `site.webmanifest`, `ai-plugin.json`, `api/openapi.json`, `.well-known/{agent.json,agent-policy}` (hand-written).
- `scripts/generate-api.ts` runs after `astro build` and writes, from the content collections: `dist/api/portfolio.json` (plus `projects.json`, `experience.json`, `articles.json`; shape `PortfolioSchema` in `src/lib/portfolio-schema.ts`, with a page `url` per project and article; `metadata.version` is `info.version` of `public/api/openapi.json`), `api/search.json` (flat GET search index), `api/index.json` (served at `/api/`; it and `mcp.json` share one `HTTP_RESOURCES` list; `mcp` stays the portfolio URL, `mcpServers` lists both servers with their manifests), a Markdown version of each project, article and About page at `<page>/index.md` (linked from the page head via BaseLayout's `markdownUrl`), `dist/llms-full.txt` (with each entry's page URL), and the derived `.well-known` files: `agent-card.json` (copy of `agent.json`), `ai-plugin.json` (copy of the root one), `mcp.json` (from `src/lib/portfolio-tools.ts`), `mcp-hire.json` (from `src/lib/hire-tools.ts`) and `security.txt` (`Expires` about 11 months after the build). Keep `public/api/openapi.json` in step with the fields it writes. `verify:dist` checks the JSON against the schema, that every kin.rag.wtf link in the discovery files resolves to a built file, that llms.txt and the agent card name every MCP tool (portfolio and HIRE), that `mcp-hire.json` has the `/mcp/hire` URL and the "never stores or logs" privacy line, the Markdown files and the search index.
- `scripts/sitemap-lastmod.mjs` gives the sitemap real per-page `lastmod` dates (article `publishDate`, else the last git commit touching the page's sources; none if unknown). History comes from the local checkout, or, where it is missing or shallow (Coolify's Docker build gets no `.git`), from a blobless clone of the GitHub repo made during the build; the Docker build stage installs git for this. CI checks out full history (`fetch-depth: 0`) so it needs no clone.
- Contact form (`ContactForm.astro`): with JavaScript it submits to Formspree with `fetch` (`Accept: application/json`) and shows success only after Formspree accepts the message, errors in place otherwise; without JavaScript the browser validates, and Formspree's `_next` redirect goes to the noindex `/contact/thanks/` page (left out of the sitemap). Never show a success state from a URL alone.
- JSON-LD: Person (`personJsonLd`), WebSite and the home WebPage in `index.astro`; Person, ProfilePage and FAQPage in `about.astro`; projects carry an `@id` (`<page>#project`) wherever they appear. WebMCP tools in `WebMCPTools.tsx`, which fetches `/.well-known/mcp.json` for the tool list only in browsers with `document.modelContext` (the WebMCP draft; `navigator.modelContext` in older builds) and unregisters through an `AbortSignal`.
- MCP server `mcp/server.ts` at `https://kin.rag.wtf/mcp`: read-only, Streamable HTTP in stateless mode (POST only, JSON responses, no auth), reading `api/portfolio.json` and `llms-full.txt` from the build it ships with. Tools and resources are defined once in `src/lib/portfolio-tools.ts` (`MCP_TOOLS`: names, descriptions, zod input/output schemas) and answered by `TOOL_HANDLERS` in `src/lib/portfolio-query.ts`; `mcp.json` carries their JSON Schemas, which is where the WebMCP island reads them, so zod stays out of the browser. The server answers 403 to a request whose `Origin` is present and is neither the site nor localhost (the transport spec's DNS-rebinding rule; server-side clients send none), declares `listChanged: false` (stateless, no notifications) and wraps the SDK's handlers for the spec error codes (unknown tool -32602, unknown resource -32002); `mcp:smoke` checks both codes and the Origin rule. Add a tool in those two files, then name it in `llms.txt` and the agent card (verify checks).
- HIRE check: decides whether an AI agent should be built or, once live, kept, with the H.I.R.E. checklist by Inês Bolaños (MIT; vendored text and its source in `src/lib/hire/checklist.ts`). One scoring module, `src/lib/hire/` (checklist, score, helpers, live, reasons, assess, validate, link, example, pdf, copy), serves the page `src/pages/hire/index.astro` (island `src/components/hire/`, Guided and Focus modes, result with PDF and share link, WebMCP via `HireWebMCP.tsx` and `src/lib/webmcp.ts`) and the MCP server; unit tests in `tests/hire/` (`npm test`). The second MCP server `mcp/hire-server.ts` is routed by `mcp/server.ts` at `/mcp/hire` (same process, same Origin rule and spec error codes as `/mcp`; shared `mcp/request-handlers.ts`); tools (`get_hire_checklist`, `assess_agent`) are defined in `src/lib/hire-tools.ts` (`HIRE_TOOLS`, `hireManifest()`) and answered by `runHireTool` in `src/lib/hire/tools-runtime.ts`; `validateAnswers` is the single rule source and runs before the SDK. Privacy: answers are never stored or logged, including in error logs (name-only error logging). Add a HIRE tool in `hire-tools.ts` and `tools-runtime.ts`, then name it in `llms.txt` and the agent card (verify checks).
- When changing the title, role, projects or articles, update all of these surfaces, not just the pages.

## Deploy and CI

- `Dockerfile`: node:20-alpine runs `npm ci && npm run build`; nginx:alpine (plus `nodejs`) serves `dist/` with `nginx.conf`: relative redirects (`absolute_redirect off`), trailing slash enforced inside `location /`, `/sitemap.xml` -> `/sitemap-index.xml`, cache headers, `charset=utf-8` on text types, `server_tokens off`, JSON 404 under `/api/`, custom 404 that also covers directories without an index. Security headers live in `nginx-security-headers.conf` (copied to `/etc/nginx/snippets/`) and must be `include`d in every `location` that has its own `add_header`, because nginx drops inherited headers there. `nginx-agent-file-headers.conf` (security headers plus a 1 h `Cache-Control` and CORS) covers the unfingerprinted agent files (`.txt`, `.xml`, `.json`, `.webmanifest`, `.pdf`, `.md` as `text/markdown` with a `Link: rel=canonical` header pointing at its HTML page, the agent policy). `/_astro/` (hashed build output) is cached a year as immutable; other static files (favicons, `/images/`) a day, then stale-while-revalidate, since they keep their names when replaced. `/api/` is `^~` so those regex locations never take it; it serves `index.json` at `/api/`. OPTIONS gets a 204 with `Allow` on pages (`location /`) and on everything that includes the agent-file snippet (which also makes it the `/api/` CORS preflight answer).
- The same image runs the MCP server on `127.0.0.1:3001`, started with a restart loop by `docker/40-mcp-server.sh` (the image's entrypoint runs it before nginx). nginx proxies `location = /mcp` and `location = /mcp/hire` to it (the same server routes by path) with an enforced rate limit shared by both (one zone) of 60/min per client (keyed on `CF-Connecting-IP`, mirrored in `MCP_RATE_LIMIT`), a 64 KB body limit and JSON-RPC 413/429/503 errors.
- `.github/workflows/ci.yaml` (push/PR to `main`): `npm ci`, `npm run build`, then requires in `dist/`: `index.html`, `404.html`, `api/portfolio.json`, `api/openapi.json`, `llms-full.txt`, `llms.txt`, `ai-plugin.json`, `robots.txt`, `.well-known/mcp-hire.json`, `hire/index.html`, `hire/index.md`, plus `build/mcp/server.mjs`, runs `npm test` before the build, and runs `mcp:smoke` (both servers) against the bundled server. Do not break any of them.
- Deployed `public/resume.pdf` is linked as `/resume.pdf` everywhere.

## Animation rules

Translated from the redesign guide (Next.js) to Astro. Binary rules; follow them exactly.

- Animate only `x`, `y`, `xPercent`, `yPercent`, `scale`, `scaleX`, `scaleY`, `rotation`, `opacity` in our own code, in GSAP and in CSS transitions alike. The one exception is CSS hover/focus colour transitions (`color`, `background-color`, `border-color`, e.g. `transition-colors`). Never transition layout properties (`width`, `height`, `top`, `padding`, `margin`), `filter` or `box-shadow`, and never use `transition-all` or `transition-shadow`: fade an overlay's `opacity` instead, or switch the value instantly.
- Every GSAP call lives in `useGSAP(fn, { scope })` imported from `src/lib/gsap.ts`, or in `useMatchMedia` (`src/lib/use-match-media.ts`), which wraps it. Never a bare `useEffect` (sole exception: the Lenis/ticker bridge in `SmoothScroll`).
- Tweens created from events or timers are wrapped in `contextSafe`. Manual listeners are removed in cleanup.
- Never store tweens in `useState`. Never update React state per frame.
- Every animating island branches with `gsap.matchMedia(scope)` using `MQ`, through `useMatchMedia(scopeRef, (mm, el, contextSafe) => …)`, which also reverts it. Under reduced motion: no x/y movement (CSS hover nudges use `motion-safe:`), no pin or scrub, no loops. Looping and scrubbed pieces rest on their finished frame; reveals are immediate or a short opacity fade.
- Meaningful text is server-rendered. Hidden-before-reveal states are set with `gsap.set` in JS, never CSS.
- No top-level `window`/`document` in island module bodies (islands render at build time). Purely decorative canvases use `client:only="react"`.
- At most the hero console plus one active Work card animate at once. The active card's illustration plays once (5 s at most; `useVisualTimeline` warns in dev) each time it becomes active while the Work section is on screen; it never loops. The decorative hero dot grid moves only in response to the pointer and stops once settled or offscreen. Inactive cards: card opacity 0.9; illustration opacity 0.7 with `saturate(0.55)`, frozen on its finished frame. The illustration frame (`VizFrame`) is `aria-hidden` and `inert`: its labels are part of a picture, so contrast checkers skip them and clicks fall through to the card link.
- Do not put `transform` or `will-change` on ancestors of a pinned section. Do not use `content-visibility` on animated sections.
- Pinned section: `scrub: 1`, `ease: "none"`, `invalidateOnRefresh: true`, distance from `scrollWidth - innerWidth`. The Work pin has `refreshPriority: 10` so later triggers measure after it; call `ScrollTrigger.refresh()` after layout settles.
- Lenis (home page only): one provider, `autoRaf: false`, driven by `gsap.ticker` with `lagSmoothing(0)`. No `scroll-behavior: smooth` in CSS.
- Explicit `width`/`height` on every `<img>`; render content images through `Img.astro`.
- Any loop that runs alongside reading content needs a pause control (the hero console has one, outside its `aria-hidden` region) and holds while hovered.
- CSS transitions on moving chrome (header, mobile drawer, hamburger bars) carry `motion-reduce:transition-none`.
- No effect that makes the page crowded: one idea per section, no side rails. The one exception is the `/hire/` tool's score rail (Guided mode).

## Content rules

- No explicit years-of-experience figure anywhere (copy, meta, JSON-LD, llms files, manifests, generated API, README, this file, PDF). Convey seniority with roles, dates and outcomes. `npm run verify` scans for it, including this file.
- Title is "AI Solutions Architect" at Daxonet AI. The old multi-part title must not appear.
- The visible label is "Writing"; the URL stays `/insights/`, and slugs, the `articles` collection and JSON keys keep their names.
- Palette per `DESIGN.md`; `sky` (`#38bdf8`) is used only for open-source work. Components use Tailwind colour, shadow and gradient tokens (from `palette.mjs` via `tailwind.config.mjs`), never raw hex or `rgba()`.
- Merge, never drop, experience detail: add new CV facts to existing entries.
- Resume PDF must not state a years figure.
- A project `image` is a real screenshot under `/images/` (PNG plus its `.webp`), never a placeholder or stock photo; `npm run verify` checks the path.
