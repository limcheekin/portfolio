# Brainstorming Session: SSG Migration — Agent-First Rewrite

**Date:** 2026-04-13
**Participants:** Lim Chee Kin, Claude (Opus 4.6)

## Context

The portfolio site at `https://limcheekin.github.io/portfolio/` was audited by the Agent-First Web Auditor on 2026-04-12. The audit scored the site **5.5/10** ("Mostly Agent-Ready") with the critical finding that the site is 100% client-side rendered — the HTML body contains only `<div id="root"></div>`, making all content invisible to non-JavaScript agents and crawlers.

The audit report is stored in `limcheekin-portfolio-review-audit.json`.

### Audit Score Breakdown (Pre-Migration)

| Dimension | Score | Key Issue |
|-----------|-------|-----------|
| S1 Discovery & Crawlability | 7/10 | Hash routing, missing llms-full.txt |
| S2 Machine Readability | 2/10 | CSR body — all content requires JavaScript |
| S3 Semantic Structure | 8/10 | Already strong |
| S4 Content Extraction | 7/10 | Missing CreativeWork schemas for projects |
| S5 DOM Stability | 8/10 | Already strong |
| T1 Navigation | 5/10 | Hash-based routing prevents URL fetching |
| T2 Forms | 3/10 | No HTML form, only mailto link |
| T3 Error Handling | 3/10 | No custom 404 page |
| T4 Auth | 7/10 | Fully public (no issue) |
| T5 Anti-Bot | 9/10 | No barriers (no issue) |
| T6 API Exposure | 2/10 | No structured API endpoint |
| T7 Observability | 4/10 | Hash routing limits URL-based verification |
| T8 Consistency | 7/10 | Deterministic content (no issue) |
| T9 GEO Alignment | 7/10 | FAQPage + Person schemas working |

## Clarifying Questions & Decisions

### Q1: Primary motivation for SSG migration?
**Answer: All of the above (D)**
- SEO / Agent readiness (S2 at 2/10)
- Performance (faster initial page loads)
- Developer experience (better framework for content sites)

### Q2: Routing model after migration?
**Answer: Hybrid (C)**
- Landing page keeps the scroll experience
- Key sections also have dedicated pages (`/about/`, `/projects/`, `/projects/[slug]/`, etc.)
- Best of both worlds: preserves UX while enabling agent fetchability

### Q3: SSG framework choice?
**Answer: Help me decide (C) — then confirmed Astro**

Analysis showed Astro is the better fit for this specific project:
- ~1,600 lines of mostly static content — Astro's sweet spot
- Only a few interactive pieces need JS (Banner carousel, mobile menu)
- Zero JS by default vs. Next.js shipping ~80-100KB React runtime
- Islands architecture: hydrate only what needs interactivity
- Can reuse existing React components as Astro islands
- Build-time Tailwind via `@astrojs/tailwind`

The agent-first audit improvements are framework-agnostic (both produce pre-rendered HTML), but Astro edges out because less JavaScript in output means faster, cleaner page loads for browser-based agents.

### Q4: WebMCP support with Astro?
**Research finding:** WebMCP works well with Astro.
- WebMCP is a client-side JavaScript API (`navigator.modelContext.registerTool()`)
- Framework-agnostic — works the same regardless of build tool
- Astro's islands model is ideal: ship zero JS for static content, add WebMCP as a tiny client island
- `@mcp-b/global` package provides the runtime
- Tools can be registered per-page using `client:load` islands
- Astro View Transitions need cleanup handler for tool unregistration

### Q5: Tailwind CSS handling?
**Answer: Proper build-time Tailwind (A)**
- Move from CDN (`<script src="https://cdn.tailwindcss.com">`) to `@astrojs/tailwind`
- Migrate inline theme config to `tailwind.config.mjs`
- Production-grade purged CSS, no CDN dependency

### Q6: Content/data layer approach?
**Answer: Astro Content Collections (B)**
- All content moved to `src/content/` with Zod schema validation
- Projects: `.md` files with frontmatter
- Articles: `.md` files with frontmatter
- Experience: `.json` files (structured data, no Markdown body)
- Enables per-item pages via `getStaticPaths()`

### Q7: Contact form implementation?
**Answer: Formspree/Formsubmit (A)**
- Static HTML form posting to third-party service
- No backend needed
- Agents can submit programmatically via standard HTTP POST
- Free tier sufficient for portfolio

### Q8: Hybrid routing — which pages get dedicated routes?
**Answer: Full section pages (C)**
- Landing scroll page (all sections)
- `/about/` — full experience timeline
- `/projects/` — all projects listing
- `/projects/[slug]/` — individual project detail
- `/insights/` — all articles listing
- `/insights/[slug]/` — individual article detail
- `/contact/` — contact form page
- `/404/` — custom error page
- Maximum agent readability, directly addresses T1 audit gap

### Q9: Hosting platform?
**Answer: Self-hosted VPS with Coolify (B)**
- Replacing GitHub Pages
- Full control over redirects, headers, server config
- Coolify manages deployment from Git repository
- Docker-based deployment (multi-stage: Node build + Nginx serve)

### Q10: Base path?
**Answer: Root domain (A)**
- No more `/portfolio/` subpath
- Clean URLs like `limcheekin.com/projects/rag-wtf/`
- Simplifies configuration

### Q11: GitHub Actions?
**Answer: Keep as CI check**
- Build validation only (no deploy step)
- Coolify handles actual deployment

## Approaches Considered

### Approach A: Big Bang — Full Rewrite
Rebuild from scratch in Astro. Everything changes at once in one PR.
- **Pro:** Clean architecture from day one, no legacy compromises
- **Con:** Harder to review, higher regression risk, site down until complete

### Approach B: Phased Migration — 3 Stages
Phase 1: Astro scaffold. Phase 2: Content Collections + pages. Phase 3: Agent-first features.
- **Pro:** Each phase is reviewable and testable
- **Con:** Intermediate rough edges, agent-first benefits delayed until Phase 3

### Approach C: Agent-First Rewrite — Audit-Driven (SELECTED)
Same scope as Big Bang, but every decision driven by audit remediation roadmap. Build order follows audit impact. Atomic commits per audit dimension.
- **Pro:** Every commit directly improves audit score, agent-first is the architecture not an afterthought, atomic commits make review tractable
- **Con:** Requires commit discipline, still a full rewrite

**Selected: Approach C** — because the primary objective is agent-readiness, not just framework migration.

## Design Summary

### Architecture
- **Framework:** Astro 5 with islands architecture
- **React islands:** Banner (carousel), MobileMenu (hamburger toggle), WebMCPTools (tool registration)
- **Static components:** Header, Footer, FixedSidebars, SectionWrapper, Card, Button, ContactForm — all Astro
- **Content:** Astro Content Collections with Zod schemas
- **Styling:** Build-time Tailwind CSS via `@astrojs/tailwind`
- **Deployment:** Docker (multi-stage: Node + Nginx) on Coolify VPS
- **CI:** GitHub Actions for build validation only

### Projected Audit Score Improvement

| Dimension | Current | Projected | Delta |
|-----------|---------|-----------|-------|
| S1 Discovery | 7 | 9 | +2 |
| S2 Machine Readability | 2 | 8 | +6 |
| S3 Semantic Structure | 8 | 8 | 0 |
| S4 Content Extraction | 7 | 9 | +2 |
| S5 DOM Stability | 8 | 8 | 0 |
| T1 Navigation | 5 | 9 | +4 |
| T2 Forms | 3 | 7 | +4 |
| T3 Error Handling | 3 | 7 | +4 |
| T4 Auth | 7 | 7 | 0 |
| T5 Anti-Bot | 9 | 9 | 0 |
| T6 API Exposure | 2 | 7 | +5 |
| T7 Observability | 4 | 7 | +3 |
| T8 Consistency | 7 | 7 | 0 |
| T9 GEO | 7 | 8 | +1 |
| **Overall** | **5.5** | **~7.8** | **+2.3** |

## Artifacts Produced

| Artifact | Path |
|----------|------|
| Design Spec | `docs/superpowers/specs/2026-04-13-astro-ssg-migration-design.md` |
| Implementation Plan | `docs/superpowers/plans/2026-04-13-astro-ssg-migration.md` |
| Brainstorming Summary | `docs/brainstorming.md` (this file) |
| Audit Report | `limcheekin-portfolio-review-audit.json` |

## Implementation Plan Overview

15 tasks, ordered by audit impact, with atomic commits per dimension:

1. Astro scaffold + package setup
2. Tailwind config + global styles
3. Data layer (site config + value props)
4. Content Collections + schemas (7 projects, 5 articles, 10 experience entries)
5. BaseLayout + primitive Astro components
6. Header + Footer + Sidebars + React islands (Banner, MobileMenu)
7. Landing page — **S2 fix** (pre-rendered HTML)
8. Section pages — **T1 fix** (/about/, /projects/, /insights/, /contact/) + **T2 fix** (contact form)
9. Detail pages — **T1 complete** + **S4 fix** (per-page JSON-LD)
10. 404 page — **T3 fix**
11. Build-time API + llms-full.txt — **T6 fix**, **S1 fix**
12. WebMCP island — emerging standards readiness
13. Dockerfile + nginx config — deployment infrastructure
14. CI workflow update — build validation only
15. Cleanup — remove old React SPA files

Full implementation details with exact code for every step are in the implementation plan.
