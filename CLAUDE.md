# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Lim Chee Kin (AI Engineer & Solution Architect). Single-page React app deployed to GitHub Pages at `https://limcheekin.github.io/portfolio/`.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

There are no tests or linting configured in this project.

## Architecture

**Runtime:** React 19 + TypeScript, bundled with Vite. Tailwind CSS is loaded via CDN (`<script src="https://cdn.tailwindcss.com">`) with theme config defined inline in `index.html`, not via a `tailwind.config.js` file. Tailwind classes reference custom colors like `navy`, `green-accent`, `slate-text`, etc. defined in that inline config.

**Routing:** Uses `react-router-dom` with `HashRouter`. The entire site renders as one route (`/*`) with sections scrolled to via hash links (`#about`, `#projects`, etc.).

**Data layer:** All content (experience, projects, articles, value props, nav links) lives in `constants.ts` as typed exported constants. Types are defined in `types.ts`. There is no CMS, API, or database.

**Key files:**
- `App.tsx` — Root component with scroll handling, header visibility, intersection observer for active section highlighting
- `constants.ts` — All site content data (experience timeline, projects, articles, contact info, value propositions)
- `types.ts` — TypeScript interfaces for all data structures
- `index.html` — Contains Tailwind CDN config, JSON-LD structured data, import maps for ESM dependencies, and meta tags

**Components** (`components/`):
- `Header.tsx` — Fixed header with numbered nav links, mobile hamburger menu
- `HomePage.tsx` — Hero section with animated Banner and About section with work experience timeline
- `Banner.tsx` — Rotating value proposition display (cycles through `VALUE_PROPS` from constants)
- `PortfolioPage.tsx` — Featured and other projects grid
- `InsightsPage.tsx` — Articles/blog section
- `ConnectPage.tsx` — Contact section
- `FixedSidebars.tsx` — Left social links sidebar, right email sidebar (desktop only)
- `Layout.tsx` — Shared components: `SectionWrapper`, `Button`, `Card`, `Footer`, icon re-exports

**Theme:** Dark-mode-first design inspired by Brittany Chiang's portfolio (v4). `ThemeContext` exists but only dark mode is actively used. Color palette: navy background (`#0a192f`), green accent (`#64ffda`), slate text variants.

## Deployment

CI/CD via `.github/workflows/deploy.yaml`. On push to `main`, it builds and deploys the `dist/` folder to the `gh-pages` branch using `JamesIves/github-pages-deploy-action`. The workflow also copies `resume.pdf`, `images/`, and `infographic*.html` into `dist/` before deploying.

**Base path:** Vite is configured with `base: '/portfolio/'` — all asset paths must account for this subdirectory.

## Agent-First Web Features

The site includes SEO and AI-agent discoverability features:
- `public/llms.txt` — LLM-readable site description
- `public/robots.txt` and `public/sitemap.xml`
- `public/api/portfolio.json` — Structured portfolio data for API consumers
- JSON-LD structured data blocks in `index.html` (Person, WebSite, FAQPage schemas)

## Vite Config Notes

- Path alias `@/*` maps to the project root (not `src/`)
- `GEMINI_API_KEY` env var is injected as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time
