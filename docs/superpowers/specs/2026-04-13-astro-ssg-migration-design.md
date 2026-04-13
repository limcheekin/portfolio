# Astro SSG Migration — Agent-First Rewrite

**Date:** 2026-04-13
**Status:** Draft
**Approach:** Agent-First Rewrite (Audit-Driven)

## Objective

Migrate the portfolio site from a React 19 + Vite client-side rendered SPA to an Astro static site, driven by the Agent-First Web Auditor report (2026-04-12). Every architectural decision targets a specific audit dimension improvement. The projected overall score moves from 5.5/10 to ~7.8/10.

## Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Astro | Zero JS by default, islands for interactivity, Content Collections, ideal for static content sites |
| Tailwind CSS | Build-time via `@astrojs/tailwind` | Replace CDN with production-grade purged CSS |
| Content layer | Astro Content Collections | Zod-validated schemas, per-item pages, type-safe querying |
| Contact form | Formspree/Formsubmit | Static HTML form, no backend, agents can submit programmatically |
| Routing | Hybrid — landing scroll + section pages + detail pages | Maximum agent fetchability while preserving scroll UX |
| Hosting | Self-hosted VPS with Coolify | Replacing GitHub Pages, full control, custom redirects |
| Base path | Root domain (no subpath) | Clean URLs, no `/portfolio/` prefix |
| CI | GitHub Actions for build validation only | Coolify handles deployment |
| WebMCP | Client island with `navigator.modelContext.registerTool()` | Emerging standard, Astro islands are ideal fit |

## Project Structure

```
portfolio/
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── Dockerfile
│
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro       # HTML shell: <head>, meta, JSON-LD, Tailwind, WebMCP
│   │
│   ├── components/
│   │   ├── Header.astro           # Static header markup
│   │   ├── MobileMenu.tsx         # React island (client:load) — hamburger toggle
│   │   ├── Banner.tsx             # React island (client:load) — rotating value props
│   │   ├── ContactForm.astro      # Static HTML form → Formspree
│   │   ├── Footer.astro
│   │   ├── FixedSidebars.astro
│   │   ├── SectionWrapper.astro
│   │   ├── Card.astro
│   │   └── Button.astro
│   │
│   ├── pages/
│   │   ├── index.astro            # Landing scroll page (all sections)
│   │   ├── about.astro            # Standalone /about/
│   │   ├── projects/
│   │   │   ├── index.astro        # /projects/ listing
│   │   │   └── [slug].astro       # /projects/[slug]/ detail
│   │   ├── insights/
│   │   │   ├── index.astro        # /insights/ listing
│   │   │   └── [slug].astro       # /insights/[slug]/ detail
│   │   ├── contact.astro          # Standalone /contact/
│   │   └── 404.astro              # Custom 404 page
│   │
│   ├── content/
│   │   ├── config.ts              # Content Collection schemas (Zod)
│   │   ├── projects/              # One .md per project
│   │   ├── articles/              # One .md per article
│   │   └── experience/            # One .json per role
│   │
│   ├── data/
│   │   ├── site.ts                # Site metadata, nav links, social links
│   │   └── value-props.ts         # Banner rotation data
│   │
│   └── styles/
│       └── global.css             # Base styles, scrollbar, focus states
│
├── public/
│   ├── images/
│   ├── robots.txt
│   ├── llms.txt
│   ├── resume.pdf
│   ├── favicon.svg, favicon.ico, etc.
│   └── site.webmanifest
│
├── scripts/
│   └── generate-api.ts            # Post-build script: reads dist/ Content Collection output
│                                  #   → generates dist/api/portfolio.json + dist/llms-full.txt
│                                  #   Integrated via package.json: "build": "astro build && tsx scripts/generate-api.ts"
│
└── .github/workflows/
    └── ci.yaml                    # Build validation only (no deploy)
```

## Page Architecture & Routing

### Landing Page (`index.astro`)

Single scroll page rendering all sections inline: Hero, About, Projects (featured only), Insights (recent), Contact. Each section has an `id` for hash scrolling. "View all" links point to `/projects/` and `/insights/`.

### Section & Detail Pages

| Page | URL | Content | Audit Fix |
|------|-----|---------|-----------|
| About | `/about/` | About + full experience timeline | S2 |
| Projects listing | `/projects/` | All projects (featured + others) | S2 |
| Project detail | `/projects/[slug]/` | Single project with full description | S2, T1 |
| Insights listing | `/insights/` | All articles | S2 |
| Insight detail | `/insights/[slug]/` | Single article detail | S2, T1 |
| Contact | `/contact/` | Contact form + info | T2 |
| 404 | `/404/` | Custom error page with nav links | T3 |

### Routing Details

- Astro generates static HTML for every route at build time
- `[slug].astro` pages use `getStaticPaths()` from Content Collections
- No client-side router — standard `<a href>` navigation, full page loads
- Clean URLs with trailing slash: `/projects/rag-wtf/`

## Component Architecture

### Static Astro Components (zero JS)

- **Header.astro** — Fixed header with desktop nav links, logo. Renders full markup server-side.
- **Footer.astro** — Attribution, social links.
- **FixedSidebars.astro** — Left social sidebar, right email sidebar (desktop only).
- **SectionWrapper.astro** — Reusable section with heading, id, data-testid.
- **Card.astro** — Project/article card with structured markup.
- **Button.astro** — Styled anchor/button element.
- **ContactForm.astro** — HTML `<form>` posting to Formspree. Labels, HTML5 validation, no JS.

### React Islands (minimal JS, `client:load`)

- **MobileMenu.tsx** — Hamburger toggle, mobile nav overlay. Only interactive piece in the header.
- **Banner.tsx** — Rotating value proposition carousel (7s auto-rotate with fade/blur). Reused from current codebase with minimal changes.

### Rationale

The current site has ~1,600 lines with only 3 interactive features (Banner carousel, mobile menu, header scroll-hide). Everything else is static content. Astro's islands architecture ships zero JS for the 90%+ static content while hydrating only the interactive pieces.

Header scroll-hide behavior (hide on scroll down, show on scroll up) can be handled with a small inline `<script>` in `BaseLayout.astro` — no React needed for this.

## Content Collections Schema

### Projects (`src/content/projects/*.md`)

Frontmatter schema (Zod):

```
title: string
slug: string (optional, derived from filename)
description: string (short, for cards/listings)
featured: boolean
featuredOrder: number (optional, for ordering featured projects)
technologies: string[]
githubUrl: string (optional)
liveUrl: string (optional)
articleUrl: string (optional)
image: string (optional, path relative to /images/)
dateStarted: date (optional)
```

Body: extended project description in Markdown (rendered on detail page).

### Articles (`src/content/articles/*.md`)

Frontmatter schema (Zod):

```
title: string
slug: string (optional, derived from filename)
description: string (short summary)
externalUrl: string (Medium link)
publishDate: date
tags: string[]
image: string (optional)
```

Body: article summary or full content in Markdown (rendered on detail page).

### Experience (`src/content/experience/*.json`)

JSON schema (Zod):

```
company: string
title: string
location: string
startDate: string (YYYY-MM format)
endDate: string (optional, YYYY-MM format, null = current)
description: string[] (bullet points)
technologies: string[]
sortOrder: number
```

No Markdown body — experience entries are structured data only.

### Simple Data (`src/data/`)

Not in Content Collections — plain TypeScript exports:

- **site.ts** — `ENGINEER_NAME`, `SITE_TITLE`, `EMAIL_ADDRESS`, `NAV_LINKS`, `SOCIAL_LINKS`, `HERO_CONTENT`, `ABOUT_CONTENT` (intro paragraph, skills list, photo URL)
- **value-props.ts** — `VALUE_PROPS` array for Banner rotation

## Per-Page JSON-LD Structured Data

| Page | Schemas | Audit Fix |
|------|---------|-----------|
| Landing (`/`) | Person, WebSite, FAQPage, BreadcrumbList, ItemList (featured projects) | S4, T9 |
| About (`/about/`) | Person, BreadcrumbList | S4 |
| Projects listing (`/projects/`) | ItemList, BreadcrumbList | S4 |
| Project detail (`/projects/[slug]/`) | CreativeWork or SoftwareApplication, BreadcrumbList | S4 (new) |
| Insights listing (`/insights/`) | ItemList, BreadcrumbList | S4 |
| Insight detail (`/insights/[slug]/`) | Article, BreadcrumbList | S4 (new) |
| Contact (`/contact/`) | ContactPage, BreadcrumbList | S4 |
| 404 | BreadcrumbList only | T3 |

Every page gets:
- Unique `<title>` and `<meta name="description">`
- OG and Twitter Card meta tags with page-specific content
- Canonical URL
- BreadcrumbList JSON-LD

All generated from Content Collection frontmatter and site config in `BaseLayout.astro`.

## Agent-First Features — Mapped to Audit

### S2: Machine Readability (2 → 8)

Every page is pre-rendered HTML. All content exists in the DOM without JavaScript. No empty `<div id="root">`.

### S1: Discovery & Crawlability (7 → 9)

- `@astrojs/sitemap` integration auto-generates `sitemap.xml` into `dist/` at build time (not in `public/`) with real lastmod dates
- `llms-full.txt` generated at build time from all collections (full experience, all projects, all article summaries)
- `robots.txt` updated with new domain URL

### S4: Content Extraction (7 → 9)

- CreativeWork JSON-LD on every project detail page
- Article JSON-LD on every insight detail page
- BreadcrumbList on all pages
- Per-page unique OG/Twitter meta tags

### T1: Navigation (5 → 9)

- Every section is a real URL, independently fetchable via HTTP GET
- Path-based routing, no hash fragments for section navigation
- BreadcrumbList schema on all pages
- Semantic `<nav>` with aria-labels preserved from current site

### T2: Form & Workflow (3 → 7)

- HTML `<form>` with `<label>`, `<input type="text">`, `<input type="email">`, `<textarea>`
- `action` attribute points to Formspree endpoint
- `method="POST"` — agents can submit via standard HTTP POST
- HTML5 validation: `required`, `type="email"`
- Success/error handling via Formspree redirect URLs (no JS-dependent state)

### T3: Error Handling (3 → 7)

- Custom `404.astro` page with navigation links to all main sections
- Helpful content: "Page not found" message with suggested destinations
- Nginx configured to serve `404.html` for unmatched routes

### T6: API Exposure (2 → 7)

- `/api/portfolio.json` generated at build time from Content Collections
- Contains all projects, articles, experience entries as structured JSON
- Served with `Content-Type: application/json`
- Schema documented in `llms.txt`

### T7: Observability (4 → 7)

- URL reflects actual page (no hash ambiguity)
- Each page has unique canonical URL
- data-testid attributes preserved on all interactive elements

### T9: GEO Alignment (7 → 8)

- Expanded FAQPage schema with additional Q&A pairs
- CreativeWork schemas improve entity relationships
- Pre-rendered content is directly indexable by generative engines

### WebMCP (emerging standards: false → true)

- Small Astro client island (`client:load`) on relevant pages
- Registers tools via `navigator.modelContext.registerTool()`:
  - `get_projects` — returns structured project data
  - `get_experience` — returns career timeline
  - `get_contact_info` — returns contact details
  - `search_portfolio` — keyword search across all content
- Uses `@mcp-b/global` package
- Unregisters tools on page navigation

## Tailwind CSS Migration

### From CDN to Build-Time

Current: `<script src="https://cdn.tailwindcss.com">` with inline config in `index.html`.

After: `@astrojs/tailwind` integration with `tailwind.config.mjs`.

### Theme Config Migration

Move inline theme config to `tailwind.config.mjs`:

```
colors:
  navy: '#0a192f'
  green-accent: '#64ffda'
  slate-text: existing slate variants
  light-navy, lightest-navy, etc.

fonts:
  sans: Inter stack
  mono: monospace stack

dark mode: 'class'
```

### Verification

All existing Tailwind classes (`bg-navy`, `text-green-accent`, `text-slate-text`, etc.) must resolve correctly after migration. The class names stay the same — only the compilation method changes.

## Deployment — Coolify on VPS

### Build

```
astro build → dist/ (static HTML/CSS/JS/assets)
```

### Dockerfile (multi-stage)

```
Stage 1 (build):
  - Node 20 alpine
  - npm install
  - npm run build (includes generate-api.ts)

Stage 2 (serve):
  - nginx:alpine
  - Copy dist/ to /usr/share/nginx/html/
  - Custom nginx.conf
```

### Nginx Configuration

- Trailing slash enforcement for clean URLs
- `404.html` served for unmatched routes
- Cache headers: long-lived for hashed assets, short for HTML
- `Content-Type: application/json` for `/api/portfolio.json`
- Gzip/Brotli compression
- Security headers (X-Frame-Options, CSP, etc.)

### Coolify Setup

- Git repository as source
- Dockerfile build mode
- Auto-deploy on push to `main`
- Root domain pointed to Coolify app
- SSL via Let's Encrypt (managed by Coolify)

### GitHub Actions (CI only)

```yaml
on: [push, pull_request]
jobs:
  build:
    - Checkout
    - Setup Node 20
    - npm install
    - npm run build
    # No deploy step — Coolify handles this
```

## Projected Audit Score

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

## Commit Strategy

Atomic commits ordered by audit impact:

1. **Astro scaffold + BaseLayout + Tailwind config** — foundation
2. **Content Collections + schemas** — data layer (S2 prerequisite)
3. **Landing page with all sections** — S2 fix (pre-rendered HTML)
4. **Section pages (/about/, /projects/, /insights/, /contact/)** — T1 fix
5. **Detail pages ([slug].astro)** — T1 complete
6. **Per-page JSON-LD schemas** — S4 fix
7. **Contact form with Formspree** — T2 fix
8. **404 page** — T3 fix
9. **Build-time API + llms-full.txt generation** — T6, S1 fix
10. **WebMCP island** — emerging standards
11. **Dockerfile + nginx config** — deployment
12. **CI workflow update** — build validation only
13. **Cleanup: remove Vite config, old React entry points** — housekeeping
