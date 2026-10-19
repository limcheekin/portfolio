# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: hiring managers and recruiters** evaluating Lim Chee Kin for a senior AI architecture role. They arrive from LinkedIn, a CV, GitHub or a Medium article, skim quickly, and need to judge seniority and real shipped AI work in under a minute.
- **Secondary: prospective clients**: business owners and IT leads with a workflow they want automated (expense claims, trade documents, warehouse operations), looking for someone who can plug AI agents into the systems they already run.
- **Secondary: technical peers** following the open-source projects and the writing.
- **AI agents and crawlers** are a first-class audience: the site is deliberately agent-first and must be fully legible without JavaScript.

## Product Purpose

A personal portfolio at `https://kin.rag.wtf` that proves, rather than claims, that the owner designs and ships enterprise AI agents that do real work inside business systems. **Success is a résumé download** (`/resume.pdf`); an email inquiry is the secondary action.

## Positioning

An AI Solutions Architect (Daxonet AI, Kuala Lumpur) whose agents run end to end inside real business systems, from a WhatsApp message to a posted sales order or GL journal, with a human approving every write. The work combines enterprise integration (accounting, WMS, Teams, WhatsApp) with safety by design (role-restricted MCP tools, explicit confirmation before writes, self-hosted models where data sovereignty matters), backed by a long enterprise-delivery career before AI. Guiding theme, chosen by the owner: **show, don't tell**.

## Operating Context

- Visitors land on the home page or a deep link (project, article) from LinkedIn, GitHub, Medium or a shared CV.
- Agents read `llms.txt`, `llms-full.txt`, `/api/portfolio.json`, `/api/openapi.json`, `.well-known/*`, JSON-LD and WebMCP tools; every surface must stay consistent with the pages.
- Articles live on Medium (https://limcheekin.medium.com/); `/insights/` pages exist for agents and SEO and link out.

## Capabilities and Constraints

- Static Astro 5 site with React islands, served by nginx in Docker; CI requires the agent-surface files listed in `CLAUDE.md`.
- Sections: About, Work (`/projects/`), Writing (`/insights/`; the visible label is "Writing", URLs and keys stay `insights`), Contact; home is Hero → Selected Work → Career → Latest Writing → Contact.
- Meaningful text is server-rendered; no content may exist only after JavaScript runs.
- Dark only; no theme toggle.
- When the title, role, projects or articles change, every agent surface is updated too.

## Brand Commitments

- Name: Lim Chee Kin. Title: **AI Solutions Architect at Daxonet AI**. The old multi-part title must not appear.
- **No explicit years-of-experience figure anywhere** (copy, meta, JSON-LD, llms files, manifests, API, PDF). Convey seniority through roles, dates and outcomes.
- Voice: plain, concrete and first person; describes flows and outcomes, not adjectives ("I build AI agents that do real work inside business systems").
- Experience detail is merged, never dropped, when new CV facts arrive.
- The owner rejects crowded pages and "too many things moving at once"; one idea per section.

## Evidence on Hand

- Enterprise projects at Daxonet AI: Claim Pilot, Trade Pilot, WareBot, Agentic AI Layer, Smart HVAC Catalogue (`src/content/projects/`). Client names and real outcome metrics **may be used once the owner supplies them**; none are in the repo yet, so none may be invented.
- Open source: Project Concord, Talk To AI, RAG.WTF, TelegramGPT, open-text-embeddings, Fluwix, Grails plugins.
- Ten Medium articles (`src/content/articles/`); career history in `src/content/experience/`; CV at `docs/Resume-202610.pdf` and `public/resume.pdf`.
- Images: `public/images/profile.png`, `logo.png` and screenshots for some open-source projects. Enterprise projects have no screenshots; they are shown through code-drawn illustrations.
- No testimonials, press or client logos exist. Do not fabricate them.

## Product Principles

1. **Show, don't tell.** Proof of shipped work (flows, artifacts, running agents) comes before claims.
2. **Seniority through specifics.** Roles, dates, systems and outcomes, never a years figure or inflated adjectives.
3. **Agent-first parity.** Every human-visible fact is also present in HTML and machine-readable surfaces.
4. **One idea per screen.** Calm and uncrowded; motion supports meaning and never competes with it.
5. **Path to the résumé.** A hiring manager is never more than one obvious action away from `/resume.pdf`.

## Accessibility & Inclusion

Full `prefers-reduced-motion` support (no movement, loops, pins or scrub under it), keyboard and screen-reader friendly navigation, decorative visuals marked `aria-hidden`, and all meaningful text present in server-rendered HTML.
