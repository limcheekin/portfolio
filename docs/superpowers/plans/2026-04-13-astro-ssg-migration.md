# Astro SSG Migration — Agent-First Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the portfolio from a React 19 + Vite CSR SPA to an Astro static site, maximizing the agent-first web audit score from 5.5 to ~7.8.

**Architecture:** Astro with islands architecture. Static Astro components for all content, React islands only for Banner carousel and MobileMenu. Content Collections (Zod-validated) for projects, articles, experience. Hybrid routing: landing scroll page + dedicated section/detail pages. Deployed via Docker/Nginx on Coolify VPS at root domain.

**Tech Stack:** Astro 5, React 19, TypeScript, Tailwind CSS (build-time via @astrojs/tailwind), @astrojs/sitemap, @mcp-b/global (WebMCP), Formspree, Docker/Nginx

**Note:** This project has no test framework configured. Verification steps use `npm run build` and dev server visual checks instead of unit tests.

---

## File Map

### New Files (create)

| File | Responsibility |
|------|---------------|
| `astro.config.mjs` | Astro config: site URL, React + Tailwind + Sitemap integrations |
| `tailwind.config.mjs` | Tailwind theme migrated from inline CDN config |
| `src/layouts/BaseLayout.astro` | HTML shell: `<head>` with meta, JSON-LD, styles |
| `src/components/Header.astro` | Static header with desktop nav |
| `src/components/MobileMenu.tsx` | React island: hamburger toggle + mobile nav overlay |
| `src/components/Banner.tsx` | React island: rotating value prop carousel (adapted from current) |
| `src/components/Footer.astro` | Static footer |
| `src/components/FixedSidebars.astro` | Static left social + right email sidebars |
| `src/components/SectionWrapper.astro` | Reusable numbered section with heading + line |
| `src/components/Card.astro` | Project/article card |
| `src/components/Button.astro` | Styled anchor/button |
| `src/components/ContactForm.astro` | Static HTML form posting to Formspree |
| `src/components/WebMCPTools.tsx` | React island: WebMCP tool registration |
| `src/components/ScrollManager.astro` | Inline script for header scroll-hide + active section |
| `src/pages/index.astro` | Landing scroll page (all sections) |
| `src/pages/about.astro` | Standalone /about/ |
| `src/pages/projects/index.astro` | /projects/ listing |
| `src/pages/projects/[slug].astro` | /projects/[slug]/ detail |
| `src/pages/insights/index.astro` | /insights/ listing |
| `src/pages/insights/[slug].astro` | /insights/[slug]/ detail |
| `src/pages/contact.astro` | Standalone /contact/ |
| `src/pages/404.astro` | Custom 404 page |
| `src/content/config.ts` | Content Collection schemas (Zod) |
| `src/content/projects/*.md` | One per project (7 files) |
| `src/content/articles/*.md` | One per article (5 files) |
| `src/content/experience/*.json` | One per role (10 files) |
| `src/data/site.ts` | Site metadata, nav links, social links, hero content |
| `src/data/value-props.ts` | VALUE_PROPS array for Banner |
| `src/styles/global.css` | Base styles, scrollbar, focus, animations |
| `scripts/generate-api.ts` | Post-build: generates portfolio.json + llms-full.txt |
| `Dockerfile` | Multi-stage: Node build + Nginx serve |
| `nginx.conf` | Custom Nginx config for static serving |

### Files to Delete (cleanup, last task)

| File | Reason |
|------|--------|
| `App.tsx` | Replaced by Astro pages |
| `index.tsx` | Replaced by Astro entry |
| `index.html` | Replaced by BaseLayout.astro |
| `constants.ts` | Split into Content Collections + src/data/ |
| `types.ts` | Replaced by Zod schemas in content/config.ts |
| `vite.config.ts` | Replaced by astro.config.mjs |
| `components/Header.tsx` | Replaced by Header.astro + MobileMenu.tsx |
| `components/HomePage.tsx` | Replaced by index.astro sections |
| `components/PortfolioPage.tsx` | Replaced by projects pages |
| `components/InsightsPage.tsx` | Replaced by insights pages |
| `components/ConnectPage.tsx` | Replaced by ContactForm.astro |
| `components/Banner.tsx` | Replaced by src/components/Banner.tsx |
| `components/FixedSidebars.tsx` | Replaced by FixedSidebars.astro |
| `components/Layout.tsx` | Split into individual Astro components |
| `contexts/ThemeContext.tsx` | No longer needed (dark-only, handled by CSS) |

### Files to Modify

| File | Change |
|------|--------|
| `package.json` | Replace Vite deps with Astro deps, update scripts |
| `tsconfig.json` | Update for Astro |
| `.github/workflows/deploy.yaml` | Convert to CI-only (no deploy) |
| `public/robots.txt` | Update sitemap URL for new domain |
| `public/llms.txt` | Update URLs for new domain |

---

## Task 1: Astro Scaffold + Package Setup

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `astro.config.mjs`

- [ ] **Step 1: Update package.json**

Replace the current package.json with Astro dependencies:

```json
{
  "name": "portfolio",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && tsx scripts/generate-api.ts",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/react": "^4.2.0",
    "@astrojs/sitemap": "^3.3.0",
    "@astrojs/tailwind": "^6.0.0",
    "@mcp-b/global": "^0.1.0",
    "astro": "^5.7.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-icons": "5.2.1"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.19.0",
    "typescript": "~5.7.2"
  }
}
```

- [ ] **Step 2: Create astro.config.mjs**

```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://limcheekin.com',
  integrations: [
    react(),
    tailwind(),
    sitemap(),
  ],
  trailingSlash: 'always',
});
```

Note: `site` URL is a placeholder. Update when the actual domain is configured.

- [ ] **Step 3: Update tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `rm -rf node_modules package-lock.json && npm install`

Expected: Clean install with Astro and all dependencies resolved.

- [ ] **Step 5: Verify Astro runs**

Run: `npx astro check`

Expected: No errors (may warn about missing pages, that's fine).

- [ ] **Step 6: Commit**

```bash
rtk git add package.json tsconfig.json astro.config.mjs
rtk git commit -m "feat: scaffold Astro project with React, Tailwind, Sitemap integrations"
```

---

## Task 2: Tailwind Config + Global Styles

**Files:**
- Create: `tailwind.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create tailwind.config.mjs**

Migrate the inline CDN config from `index.html` lines 65-141:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'navy': '#0a192f',
        'light-navy': '#112240',
        'lightest-navy': '#233554',
        'slate-text': '#8892b0',
        'light-slate': '#a8b2d1',
        'lightest-slate': '#ccd6f6',
        'white-text': '#e6f1ff',
        'green-accent': '#64ffda',
        'green-tint': 'rgba(100, 255, 218, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      },
      transitionTimingFunction: {
        'custom-ease': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      },
      transitionDuration: {
        '250': '250ms',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Create src/styles/global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
  background-color: #0a192f;
}

body {
  font-family: 'Inter', sans-serif;
  color: #ccd6f6;
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #0a192f;
}

::-webkit-scrollbar-thumb {
  background: #233554;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8b2d1;
}

*:focus-visible {
  outline: 2px dashed #64ffda;
  outline-offset: 2px;
}

/* Custom list bullet for prose-like content */
.custom-bullet {
  position: relative;
  padding-left: 1.75rem;
}

.custom-bullet::before {
  content: "▹";
  position: absolute;
  left: 0;
  color: #64ffda;
  font-size: 1.125rem;
  line-height: 1.75;
}
```

- [ ] **Step 3: Commit**

```bash
rtk git add tailwind.config.mjs src/styles/global.css
rtk git commit -m "feat: add build-time Tailwind config and global styles"
```

---

## Task 3: Data Layer — Site Config + Value Props

**Files:**
- Create: `src/data/site.ts`
- Create: `src/data/value-props.ts`

- [ ] **Step 1: Create src/data/site.ts**

Extract metadata and simple data from `constants.ts`:

```typescript
export const ENGINEER_NAME = "Lim Chee Kin";
export const ENGINEER_TITLE = "Senior Tech Lead, AI Engineer, and Solution Architect";
export const SITE_TITLE = `${ENGINEER_NAME} | ${ENGINEER_TITLE}`;
export const GITHUB_USERNAME = "limcheekin";
export const EMAIL_ADDRESS = "limcheekin@vobject.com";
export const SITE_URL = "https://limcheekin.com";

export interface NavLink {
  name: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { name: "About", href: "/about/" },
  { name: "Work", href: "/projects/" },
  { name: "Insights", href: "/insights/" },
  { name: "Contact", href: "/contact/" },
];

export const SCROLL_NAV_LINKS: NavLink[] = [
  { name: "About", href: "#about" },
  { name: "Work", href: "#projects" },
  { name: "Insights", href: "#insights" },
  { name: "Contact", href: "#contact" },
];

export interface ContactLink {
  name: string;
  url: string;
  iconName: string;
}

export const SOCIAL_LINKS: ContactLink[] = [
  { name: "GitHub", url: `https://github.com/${GITHUB_USERNAME}`, iconName: "FiGithub" },
  { name: "LinkedIn", url: "https://linkedin.com/in/limcheekin", iconName: "FiLinkedin" },
  { name: "Medium", url: "https://medium.com/@limcheekin", iconName: "SiMedium" },
];

export const HERO_CONTENT = {
  greeting: "Hi, my name is",
  name: ENGINEER_NAME + ".",
  tagline: "AI Engineer & Solution Architect.",
  introduction: `I'm a ${ENGINEER_TITLE} with over 25 years of experience, currently focusing intensively on AI engineering.`,
  ctaButton: "Get In Touch",
};

export const ABOUT_CONTENT = {
  introductionParagraphs: [
    `Hello! I'm ${ENGINEER_NAME}, a ${ENGINEER_TITLE} with a deep passion for AI engineering. I bring over 25 years of experience delivering advance software solutions by aligning business needs with technical design and implementation.`,
    `My expertise lies in architecting and implementing open-source AI, local AI infrastructure, and data sovereignty solutions, particularly for mobile-first web applications. I'm dedicated to building and leading teams to innovate with privacy-preserving and democratized AI.`,
    `I am committed to standardizing processes, driving innovation in the AI space, and continuously exploring new frontiers in technology.`,
  ],
  skills: ["AI Engineering", "RAG Systems", "LLM Integration", "Python", "Java", "Gemini API", "Docker", "AWS"],
  professionalPhotoUrl: "/images/profile.png",
};

export const CONTACT_CONTENT = {
  title: "What's Next?",
  subtext: "Get In Touch",
  paragraph: `My inbox is always open for AI discussions, collaborations, or just to connect. Whether you have a question about RAG, local AI, open-source initiatives, or AI engineering in general, I'll do my best to get back to you!`,
  buttonText: "Say Hello",
};

export const FOOTER_TEXT = `Designed & Built by ${ENGINEER_NAME}. Inspired by Brittany Chiang.`;
```

- [ ] **Step 2: Create src/data/value-props.ts**

```typescript
export interface ValueProp {
  target: string;
  benefit: string;
  negative: string;
}

export const VALUE_PROPS: ValueProp[] = [
  {
    target: "privacy-conscious enterprises",
    benefit: "deploy local LLMs for trustworthy knowledge discovery",
    negative: "exposing sensitive data to third-party"
  },
  {
    target: "businesses",
    benefit: "implement Retrieval-Augmented Generation (RAG) systems that provide accurate, contextual answers",
    negative: "hallucinations"
  },
  {
    target: "product teams",
    benefit: "add voice-first, low-latency AI interactions to web apps",
    negative: "ballooning infrastructure costs"
  },
  {
    target: "organizations",
    benefit: "run resilient hybrid AI (local + cloud) workloads at scale",
    negative: "sacrificing data sovereignty"
  },
  {
    target: "engineering leaders",
    benefit: "integrate legacy databases with AI agents to unlock enterprise knowledge",
    negative: "costly, risky migrations"
  },
  {
    target: "engineering leaders",
    benefit: "build high-performing multinational development teams",
    negative: "cultural friction"
  },
];
```

- [ ] **Step 3: Commit**

```bash
rtk git add src/data/site.ts src/data/value-props.ts
rtk git commit -m "feat: add site config and value props data layer"
```

---

## Task 4: Content Collections + Schemas

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/projects/rag-wtf.md`
- Create: `src/content/projects/telegram-gpt.md`
- Create: `src/content/projects/open-text-embeddings.md`
- Create: `src/content/projects/talk-to-ai.md`
- Create: `src/content/projects/talking-book.md`
- Create: `src/content/projects/self-hosted-ai-infra.md`
- Create: `src/content/projects/fluwix.md`
- Create: `src/content/articles/legacy-database-ai.md`
- Create: `src/content/articles/no-code-mcp-server.md`
- Create: `src/content/articles/talking-book.md`
- Create: `src/content/articles/beyond-the-cloud.md`
- Create: `src/content/articles/own-your-ai-data.md`
- Create: `src/content/experience/01-ai-engineer.json`
- Create: `src/content/experience/02-dxc-tech-lead.json`
- Create: `src/content/experience/03-zurich-tech-lead.json`
- Create: `src/content/experience/04-independent.json`
- Create: `src/content/experience/05-penril-consultant.json`
- Create: `src/content/experience/06-cmg-tech-lead.json`
- Create: `src/content/experience/07-media-trend.json`
- Create: `src/content/experience/08-siemens.json`
- Create: `src/content/experience/09-online-one.json`
- Create: `src/content/experience/10-tee-yam.json`

- [ ] **Step 1: Create src/content/config.ts**

```typescript
import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    featuredOrder: z.number().optional(),
    technologies: z.array(z.string()),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    articleUrl: z.string().url().optional(),
    image: z.string().optional(),
    category: z.string(),
    dateStarted: z.string().optional(),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    externalUrl: z.string().url().optional(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()),
    image: z.string().optional(),
    platform: z.string().optional(),
    type: z.enum(["Article", "Talk", "Slides"]).default("Article"),
  }),
});

const experience = defineCollection({
  type: 'data',
  schema: z.object({
    company: z.string(),
    title: z.string(),
    location: z.string().optional(),
    companyUrl: z.string().url().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.array(z.string()),
    technologies: z.array(z.string()),
    sortOrder: z.number(),
  }),
});

export const collections = { projects, articles, experience };
```

- [ ] **Step 2: Create project content files**

Create `src/content/projects/rag-wtf.md`:

```markdown
---
title: "RAG.WTF: Private Knowledge Platform"
description: "Architected and built RAG.WTF, an open-source platform for private, personalized knowledge discovery and management. Focuses on data ownership, privacy, and efficient local AI processing, integrating SurrealDB.wasm for data sovereignty."
featured: true
featuredOrder: 1
technologies: ["Open Source", "RAG", "Data Privacy", "Local AI", "Cloud AI", "surrealdb.wasm", "Flutter", "Dart"]
image: "/images/rag-wtf.png"
githubUrl: "https://github.com/rag-wtf"
category: "RAG"
---

RAG.WTF is an open-source platform for private, personalized knowledge discovery and management using Retrieval-Augmented Generation (RAG) systems. It focuses on data ownership, privacy, and efficient local AI processing, integrating SurrealDB.wasm for complete data sovereignty on the client side.

The platform enables users to build personal knowledge bases that stay under their control, combining the power of large language models with private document collections for accurate, contextual answers without sending sensitive data to third-party services.
```

Create `src/content/projects/telegram-gpt.md`:

```markdown
---
title: "TelegramGPT: AI Telegram Bot"
description: "A Telegram bot powered by Google Gemini's API (Vertex AI / Google AI Studio). This bot leverages PostgreSQL for persistent conversation history and can integrate with self-hosted Speech-to-Text (STT) and Text-to-Speech (TTS) services."
featured: true
featuredOrder: 2
technologies: ["Open Source", "Telegram Bot", "Local AI", "Cloud AI", "Python", "Gemini API", "PostgreSQL", "TTS", "STT"]
image: "/images/telegram-bot.png"
githubUrl: "https://github.com/limcheekin/TelegramGPT"
liveUrl: "https://t.me/think_and_grow_rich_bot"
category: "RAG"
---

TelegramGPT is a Telegram bot powered by Google Gemini's API with PostgreSQL for persistent conversation history. It integrates with self-hosted Speech-to-Text and Text-to-Speech services, enabling natural voice-based AI interactions directly within Telegram.
```

Create `src/content/projects/open-text-embeddings.md`:

```markdown
---
title: "open-text-embeddings Python Library"
description: "Engineered 'open-text-embeddings', a Python library providing an OpenAI-compatible API for diverse open-source sentence transformer models (e.g., BGE, E5). Enables significant cost reduction and eliminates vendor lock-in for embedding generation."
featured: true
featuredOrder: 3
technologies: ["Open Source", "Python", "Text Embeddings", "Sentence Transformers", "OpenAI-compatible API", "NLP"]
image: "/images/open-text-embeddings.png"
githubUrl: "https://github.com/limcheekin/open-text-embeddings"
liveUrl: "https://pypi.org/project/open-text-embeddings/"
category: "AI Library"
---

open-text-embeddings is a Python library providing an OpenAI-compatible API for diverse open-source sentence transformer models such as BGE and E5. It enables significant cost reduction and eliminates vendor lock-in for text embedding generation in RAG and NLP applications.
```

Create `src/content/projects/talk-to-ai.md`:

```markdown
---
title: "Talk To AI: Real-time Voice AI"
description: "Developed 'Talk To AI', an application integrating HuggingFace's FastRTC for low-latency (<300ms) real-time voice AI interactions. Features a flexible backend supporting local (LocalAI, Whisper.cpp, Llama.cpp) and cloud-based STT, LLM, and TTS APIs (Groq, Microsoft Edge)."
featured: true
featuredOrder: 4
technologies: ["Open Source", "Voice AI", "FastRTC", "HuggingFace", "STT", "LLM", "TTS", "LocalAI", "Groq API", "Python", "FastAPI"]
image: "/images/talk-to-ai.png"
githubUrl: "https://github.com/limcheekin/talk-to-ai"
category: "Voice AI"
---

Talk To AI is an application integrating HuggingFace's FastRTC for low-latency (<300ms) real-time voice AI interactions. It features a flexible backend supporting local (LocalAI, Whisper.cpp, Llama.cpp) and cloud-based STT, LLM, and TTS APIs (Groq, Microsoft Edge), enabling natural voice conversations with AI.
```

Create `src/content/projects/talking-book.md`:

```markdown
---
title: "Talking Book"
description: "Launched the Talking Book YouTube channel, focus primarily on insightful non-fiction, business, and self-improvement books, transforming key concepts into accessible and engaging formats such as engaging conversations, summaries, songs, and AI chats."
featured: false
technologies: ["Python", "Podcastfy", "LocalAI", "Kokoro-FASTAPI", "Google Slides"]
image: "https://picsum.photos/seed/grailsactiviti/700/450"
githubUrl: "https://github.com/limcheekin/talking-book"
liveUrl: "https://limcheekin.github.io/talking-book/"
category: "AI Content Generation"
---

Talking Book is a YouTube channel focused on insightful non-fiction, business, and self-improvement books. It transforms key concepts into accessible formats including engaging conversations, summaries, songs, and AI chats using Python-based AI pipelines.
```

Create `src/content/projects/self-hosted-ai-infra.md`:

```markdown
---
title: "Self-Hosted AI Infrastructure"
description: "Pioneered and operationalized a self-hosted AI infrastructure using a dedicated local AI server (Coolify, Docker, OrangePi 5 Max). Successfully runs multiple local LLMs (Llama 3.2, DeepSeek-R1, Qwen3, etc.), embeddings, reranking, and STT/TTS services for complete data privacy and operational control."
featured: false
technologies: ["Docker", "Coolify", "LocalAI", "Self-Hosting", "AI Infrastructure", "Open LLMs", "Open WebUI"]
image: "https://picsum.photos/seed/selfhostai/700/450"
category: "AI Infrastructure"
---

A self-hosted AI infrastructure using a dedicated local AI server powered by Coolify, Docker, and OrangePi 5 Max. Successfully runs multiple local LLMs (Llama 3.2, DeepSeek-R1, Qwen3, etc.), embeddings, reranking, and STT/TTS services for complete data privacy and operational control.
```

Create `src/content/projects/fluwix.md`:

```markdown
---
title: "Fluwix: Flutter Showcases"
description: "A project dedicated to showcasing various Flutter applications and exploring mobile development capabilities with the Flutter framework."
featured: false
technologies: ["Open Source", "Flutter", "Dart", "Mobile Development", "Web Development", "UI/UX"]
image: "https://picsum.photos/seed/apaconsole/700/450"
githubUrl: "https://github.com/limcheekin/fluwix"
liveUrl: "https://fluwix.com/"
category: "Web and Mobile Platform"
---

Fluwix is a project dedicated to showcasing various Flutter applications and exploring mobile development capabilities with the Flutter framework. It serves as a portfolio of Flutter experiments and production-ready components.
```

- [ ] **Step 3: Create article content files**

Create `src/content/articles/legacy-database-ai.md`:

```markdown
---
title: "AI is Ready. Your Legacy Database Isn't. Let's Fix That."
description: "Project Concord is a high-performance, TypeScript-based MCP server designed to help AI systems work smoothly with older business databases by turning messy and unclear data into clean, reliable information."
publishDate: 2026-04-01
tags: ["Legacy Modernization", "Enterprise AI", "Data Strategy", "Digital Transformation"]
image: "https://picsum.photos/seed/project-concord/400/200"
platform: "MCP, Legacy Systems"
type: "Article"
---

Project Concord is a high-performance, TypeScript-based MCP server designed to help AI systems work smoothly with older business databases by turning messy and unclear data into clean, reliable information. It focuses on safety, accuracy, and speed, with built-in checks, smart monitoring, and protective guards, all packaged for easy deployment in real-world environments.
```

Create `src/content/articles/no-code-mcp-server.md`:

```markdown
---
title: "Building Your First No-Code MCP Server: The Fabric Integration Story"
description: "How I created a Model Context Protocol (MCP) server for Fabric REST API without writing a single line of code"
publishDate: 2026-03-15
tags: ["Mcp Server", "MCP", "No Code", "Fabric", "Prompt Library"]
image: "https://picsum.photos/seed/no-code-mcp/400/200"
platform: "MCP, Fabric"
type: "Article"
---

How I created a Model Context Protocol (MCP) server for Fabric REST API without writing a single line of code. This article walks through the no-code approach to building MCP servers for enterprise API integration.
```

Create `src/content/articles/talking-book.md`:

```markdown
---
title: "Talking Book: Making Books Less Boring"
description: "I created Talking Book to make reading more engaging and accessible, especially for my 9-year-old son with dyslexia."
externalUrl: "https://medium.com/@limcheekin/introducing-talking-book-487f6e3bc2c2"
publishDate: 2025-10-01
tags: ["AI", "Content Generation", "YouTube", "Telegram Bot", "NLP"]
image: "https://picsum.photos/seed/talkingbook/400/200"
platform: "YouTube, Telegram"
type: "Article"
---

I created Talking Book to make reading more engaging and accessible, especially for my 9-year-old son with dyslexia. The platform offers quick summaries, chapter deep dives, and even catchy songs to help key concepts stick. We've also launched an AI chatbot on Telegram that lets you interact with books directly, making it easier to understand and remember their content.
```

Create `src/content/articles/beyond-the-cloud.md`:

```markdown
---
title: "Beyond the Cloud: How I Built My Own AI Server (and Why)"
description: "I built my own AI server using an Orange Pi 5 Max, Ubuntu 24.04, Docker, and LocalAI, enabling me to run various open-source models locally."
externalUrl: "https://medium.com/@limcheekin/beyond-the-cloud-how-i-built-my-own-ai-server-and-why-68b7235117f3"
publishDate: 2025-08-15
tags: ["Local AI", "Private AI", "Self Hosted AI", "DIY AI"]
image: "https://picsum.photos/seed/fluwix/400/200"
platform: "OrangePi 5 Max, LocalAI"
type: "Article"
---

I built my own AI server using an Orange Pi 5 Max, Ubuntu 24.04, Docker, and LocalAI, enabling me to run various open-source models like Llama 3.2 and Phi-3.5 locally. This setup not only grants me privacy and control over my digital interactions but also lays the foundation for creating a digital twin that truly understands and mirrors my thought processes.
```

Create `src/content/articles/own-your-ai-data.md`:

```markdown
---
title: "Would you pay $1/month to Own Your AI Data?"
description: "Our AI conversations are valuable assets that shouldn't be surrendered to Big Tech without control or ownership."
externalUrl: "https://medium.com/@limcheekin/would-you-pay-1-month-to-own-your-ai-data-6dbb0db1eeaf"
publishDate: 2025-07-01
tags: ["Open WebUI", "Private AI", "Self Hosted AI", "Prompt Library"]
image: "https://picsum.photos/seed/fluwix/400/200"
platform: "Open WebUI"
type: "Article"
---

In this article, I argue that our AI conversations — filled with ideas, solutions, and creativity — are valuable assets that shouldn't be surrendered to Big Tech without control or ownership. To address this, I've set up a secure, personal Open WebUI instance that, for $1/month, offers users complete data sovereignty, access to a curated library of over 200 expert prompts, and the flexibility to connect preferred AI models using personal API keys.
```

- [ ] **Step 4: Create experience data files**

Create `src/content/experience/01-ai-engineer.json`:

```json
{
  "company": "RAG.WTF & AI Initiatives",
  "title": "AI Engineer & Solution Architect",
  "companyUrl": "https://www.rag.wtf",
  "startDate": "2021-01",
  "description": [
    "Launched the Project Concord, a TypeScript-based, Dockerized Model Context Protocol (MCP) server that bridges modern AI agents with legacy databases by translating ambiguous schemas into clear, AI-friendly interfaces.",
    "Championed and developed open-source AI solutions focusing on data ownership, privacy, and efficient local AI processing; architecting and building RAG.WTF as a platform for secure, personalized knowledge discovery and management.",
    "Engineered 'open-text-embeddings', a Python library providing an OpenAI-compatible API for diverse open-source sentence transformer models, enabling significant cost reduction and eliminating vendor lock-in.",
    "Developed 'Talk To AI' application, integrating HuggingFace's FastRTC for low-latency real-time voice AI interactions; engineered a flexible backend supporting local and cloud-based STT, LLM, and TTS APIs.",
    "Pioneered and operationalized a self-hosted AI infrastructure (Coolify, Docker), running multiple local LLMs (Llama 3.2, DeepSeek-R1, etc.) and STT/TTS for data privacy and operational control.",
    "Advocated for and implemented robust data sovereignty by integrating embedded database solutions like SurrealDB.wasm with RAG.WTF.",
    "Strategically utilized TensorDock and Modal for scalable cloud GPU servers and serverless execution AI/ML workloads, complementing local AI capabilities.",
    "Previously initiated Talking Book YouTube channel (AI-powered summaries and Telegram bot) and Fluwix (Flutter showcases)."
  ],
  "technologies": ["Open-Source AI", "RAG", "MCP", "Python", "Text Embeddings", "FastRTC", "Docker", "Local LLMs", "SurrealDB.wasm", "Modal.com", "FastAPI", "Flutter", "Voice AI", "Solution Architecture"],
  "sortOrder": 1
}
```

Create `src/content/experience/02-dxc-tech-lead.json`:

```json
{
  "company": "DXC Technology",
  "title": "Senior Java Tech Lead",
  "companyUrl": "https://dxc.com/my/en",
  "startDate": "2013-01",
  "endDate": "2020-12",
  "description": [
    "Led a 6-developer international team (China, Europe, Malaysia) to deliver the Analytic Console for the Agile Process Automation (APA) platform (VueJS, Spring Boot, GoLang, MongoDB, AWS), contributing millions to company revenue.",
    "Headed a 5-developer international team (US, Malaysia) to create the EPIC Configurator for internal Enterprise Invoice Processing (JQuery UI, Grails Framework, Oracle DB), significantly streamlining configuration processes.",
    "Implemented a Divestiture and Acquisition (DnA) dashboard (AngularJS, Jersey, Spring, MongoDB, AWS) for critical real-time data insights supporting strategic executive decision-making.",
    "Prototyped an Intelligent Voice Agent (Conversational AI) leveraging Amazon Connect, AWS Lambda, Amazon Lex, Dialogflow, and Micronaut Framework."
  ],
  "technologies": ["Java", "Spring Boot", "VueJS", "GoLang", "MongoDB", "AWS", "JQuery UI", "Grails Framework", "Oracle DB", "AngularJS", "Micronaut", "Conversational AI", "Team Leadership"],
  "sortOrder": 2
}
```

Create `src/content/experience/03-zurich-tech-lead.json`:

```json
{
  "company": "Zurich Technology Services Malaysia",
  "title": "Senior Java Tech Lead",
  "companyUrl": "https://www.zurich.com.my/",
  "startDate": "2012-01",
  "endDate": "2013-12",
  "description": [
    "Led a 5-member production support and development team for motor and property claims systems (IBM WebSphere, FileNet, DB2, Spring, GWT, Hibernate/JPA).",
    "Resolved over 60 critical production issues within weeks, dramatically improving system stability and user satisfaction."
  ],
  "technologies": ["Java", "IBM WebSphere", "FileNet", "DB2", "Spring", "GWT", "Hibernate/JPA", "Production Support", "Team Leadership"],
  "sortOrder": 3
}
```

Create `src/content/experience/04-independent.json`:

```json
{
  "company": "Self-Employed",
  "title": "Independent Software Professional",
  "startDate": "2010-01",
  "endDate": "2012-12",
  "description": [
    "Developed and maintained impactful open-source Grails Framework projects, including BPM workflow, form builder, and validation components.",
    "Grails Activiti Plugin: BPM workflow system; grew the forum to 100+ members, addressed 100+ queries.",
    "Grails Form Builder Plugin: Empowered non-programmers to create online forms.",
    "JQuery Validation UI Plugin: Enhanced developer productivity with client-side validation.",
    "Explore all 10+ projects at limcheekin.blogspot.com/p/my-grails-plugins.html."
  ],
  "technologies": ["Grails Framework", "Activiti BPM", "JQuery", "Open Source Development", "Plugin Development", "Groovy", "Java"],
  "sortOrder": 4
}
```

Create `src/content/experience/05-penril-consultant.json`:

```json
{
  "company": "Penril Datability (M) Sdn. Bhd.",
  "title": "Senior Solution Consultant",
  "companyUrl": "https://penril.net/",
  "startDate": "2008-04",
  "endDate": "2010-07",
  "description": [
    "Led the successful tender for a RM6 million Internet Banking System (IBS) for Kuwait Finance House (KFH).",
    "Designed and proposed comprehensive IBS solutions, covering 24x7 web layers, external integrations (Payment Gateway, SMS, Email), application platform, 2-Factor Authentication (2FA), Enterprise Service Bus (ESB) for backend integration, and High-Availability infrastructure.",
    "Led a 3-member team to develop KFH's information website using BroadVision 8.1 Business Agility Suites and Oracle 10g, including JSR168 compliant portlets like Prayer Times and Currency Converter.",
    "Secured a RM2 million eCustody System tender from Malayan Banking Berhad.",
    "Provided pre-sales support, product demonstrations, solution consultation, and Proof-Of-Concepts (POCs) to major financial and corporate clients (e.g., Maybank, BSN, BNM, Agrobank, ING, Bank Islam)."
  ],
  "technologies": ["Solution Consulting", "Tender Management", "Banking Systems", "Solution Architecture", "BroadVision", "Oracle 10g", "JSR168 Portlets", "BPMN", "Requirements Analysis", "Pre-Sales", "Team Leadership"],
  "sortOrder": 5
}
```

Create `src/content/experience/06-cmg-tech-lead.json`:

```json
{
  "company": "CMG Online Sdn. Bhd.",
  "title": "Technical Lead",
  "companyUrl": "https://www.cmg.com.my/",
  "startDate": "2005-04",
  "endDate": "2007-12",
  "description": [
    "Led an 8-member international team (China, India, Malaysia) to deliver a RM2 million Integrated Hospital Inventory System (IHIS4) for government hospitals, using AIX UNIX, JBoss 4.0, Oracle 10g, J2EE, Struts, and JasperReports.",
    "Drove Quality Management Systems (QMS): introduced a Standard Development Environment (Eclipse, Subversion, JUnit, Ant), improving team productivity by 20%.",
    "Actively participated in the CMMI Committee to define and implement CMMI Level 3 compliant organizational standards and processes.",
    "Architected and developed a common technical foundation for the Integrated Hospital Information Systems (IHIS5) on AppFuse (J2EE, Spring Framework, Hibernate, JUnit, JMock), including reusable logging and auditing modules with Spring AOP."
  ],
  "technologies": ["Technical Leadership", "J2EE", "JBoss", "Oracle 10g", "Struts", "JasperReports", "Spring Framework", "Hibernate", "Spring AOP", "AppFuse", "CMMI Level 3", "QMS", "SDLC", "Team Management"],
  "sortOrder": 6
}
```

Create `src/content/experience/07-media-trend.json`:

```json
{
  "company": "Media Trend",
  "title": "Founder and Senior Consultant",
  "startDate": "2004-05",
  "endDate": "2005-03",
  "description": [
    "As Founder, led a startup providing web design, website development, web application development, and printing services.",
    "Designed and developed websites for clients including Bright Pancar Enterprise and Marklon Industries Sdn. Bhd.",
    "Provided printing services (name cards, brochures, cash sales receipts) for various companies."
  ],
  "technologies": ["Entrepreneurship", "Web Design", "Web Development", "Client Management", "Software Consulting"],
  "sortOrder": 7
}
```

Create `src/content/experience/08-siemens.json`:

```json
{
  "company": "Siemens Multimedia Sdn. Bhd.",
  "title": "Software Engineer",
  "companyUrl": "https://www.siemens.com/my/en.html",
  "startDate": "2002-10",
  "endDate": "2004-04",
  "description": [
    "Developed the core Voice4Info Portal (News Delivery over Phone), including Call Control Components using Java IDL, CORBA, Parlay API, and VoiceXML, collaborating with German colleagues on the Siemens Next Generation Network (NGN) platform.",
    "Engineered iTalk, a Unified Phone Conferencing system with instant messaging-like features (presence, contact list, buddy list management).",
    "Supervised and coordinated 4 groups of Multimedia University (MMU) final year students on IP telephony projects, ensuring functional prototypes for the Siemens NGN platform."
  ],
  "technologies": ["Java", "J2EE", "CORBA", "Parlay API", "VoiceXML", "Telephony Systems", "Siemens NGN", "Software Development", "Mentorship"],
  "sortOrder": 8
}
```

Create `src/content/experience/09-online-one.json`:

```json
{
  "company": "Online One Corporation Berhad",
  "title": "System Engineer (Web Application Development)",
  "companyUrl": "http://greenoceancorp.com/bizsegments.html",
  "startDate": "2001-08",
  "endDate": "2002-09",
  "description": [
    "Successfully deployed E-Treasury Management Systems to Hitachi Asia Ltd (Singapore) within 2 months, contributing RM1 million in revenue.",
    "Developed Fund Transfer, Bank Reconciliation, and General Ledger modules for the E-Treasury system using Cold Fusion, HTML, JavaScript, JavaBean, JDBC, and Oracle 8i.",
    "Engineered Business-to-Business (B2B) integration of National Panasonic of Malaysia's purchasing system using Active Server Page (ASP), SOAP, XML, IIS Web Server, and Oracle 8i."
  ],
  "technologies": ["Web Application Development", "Cold Fusion", "Oracle 8i", "ASP", "SOAP", "XML", "HTML", "JavaScript", "JDBC", "System Integration"],
  "sortOrder": 9
}
```

Create `src/content/experience/10-tee-yam.json`:

```json
{
  "company": "Tee Yam Holding Sdn. Bhd.",
  "title": "System Engineer",
  "startDate": "1999-06",
  "endDate": "2000-05",
  "description": [
    "Individually designed and developed a comprehensive Touch Screen based Point Of Sale (POS) system, Inventory Control System, and Customer Contact Management system using Visual Basic 6.0, ADO, COM, ActiveX Control, and Microsoft SQL Server 7.0.",
    "Developed multimedia game systems, including a Horse Racing Game and Roulette Game, using Visual Basic 6.0, DirectX 7.0 SDK, ADO, and Microsoft Access 97."
  ],
  "technologies": ["Visual Basic 6.0", "MS SQL Server 7.0", "ADO", "COM", "ActiveX", "DirectX SDK", "POS Systems Development", "Inventory Control Systems", "Game Development"],
  "sortOrder": 10
}
```

- [ ] **Step 5: Verify content collections load**

Run: `npx astro check`

Expected: Content collections recognized, schemas validated, no type errors.

- [ ] **Step 6: Commit**

```bash
rtk git add src/content/
rtk git commit -m "feat: add Content Collections with schemas for projects, articles, experience"
```

---

## Task 5: BaseLayout + Primitive Components

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Button.astro`
- Create: `src/components/SectionWrapper.astro`
- Create: `src/components/Card.astro`

- [ ] **Step 1: Create src/components/Button.astro**

```astro
---
interface Props {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  class?: string;
  target?: string;
  rel?: string;
  type?: string;
  'data-testid'?: string;
}

const {
  href,
  size = 'md',
  variant = 'primary',
  class: className = '',
  target,
  rel,
  type,
  'data-testid': testId,
  ...rest
} = Astro.props;

const baseStyles = `font-mono inline-flex items-center justify-center rounded border border-green-accent text-green-accent hover:bg-green-tint focus:bg-green-tint transition-all duration-250 ease-custom-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-green-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:opacity-50 disabled:cursor-not-allowed`;

const sizeMap: Record<string, string> = {
  sm: 'px-5 py-2.5 text-xs',
  md: 'px-7 py-3.5 text-sm',
  lg: 'px-8 py-4 text-base',
};

const variantMap: Record<string, string> = {
  primary: 'text-green-accent border-green-accent hover:bg-green-tint',
  secondary: 'text-light-slate border-light-slate hover:bg-lightest-navy/10',
};

const classes = `${baseStyles} ${sizeMap[size]} ${variantMap[variant]} ${className}`;

const isExternal = href?.startsWith('http') || href?.startsWith('mailto');
const computedTarget = target || (isExternal ? '_blank' : undefined);
const computedRel = rel || (isExternal ? 'noopener noreferrer' : undefined);
---

{href ? (
  <a href={href} class={classes} target={computedTarget} rel={computedRel} data-testid={testId} {...rest}>
    <slot />
  </a>
) : (
  <button type={type || 'button'} class={classes} data-testid={testId} {...rest}>
    <slot />
  </button>
)}
```

- [ ] **Step 2: Create src/components/SectionWrapper.astro**

```astro
---
interface Props {
  id: string;
  title?: string;
  titleNumber?: string;
  class?: string;
  contentClass?: string;
}

const { id, title, titleNumber, class: className = '', contentClass = '' } = Astro.props;
---

<section id={id} data-testid={`section-${id}`} class={`py-20 md:py-24 lg:py-28 ${className}`}>
  {title && (
    <h2 class="flex items-center text-2xl md:text-3xl font-semibold text-lightest-slate mb-10 md:mb-12 whitespace-nowrap relative w-full">
      {titleNumber && <span class="text-xl md:text-2xl text-green-accent font-mono mr-2.5">{titleNumber}.</span>}
      {title}
      <span class="block h-px bg-lightest-navy/30 ml-5 w-full max-w-xs md:max-w-sm"></span>
    </h2>
  )}
  <div class={contentClass}>
    <slot />
  </div>
</section>
```

- [ ] **Step 3: Create src/components/Card.astro**

```astro
---
interface Props {
  href?: string;
  class?: string;
  'data-testid'?: string;
}

const { href, class: className = '', 'data-testid': testId } = Astro.props;
const Tag = href ? 'a' : 'div';
---

<Tag
  href={href}
  class={`flex flex-col h-full bg-light-navy rounded-md shadow-lg hover:shadow-xl transition-shadow duration-250 ease-custom-ease group p-6 ${className}`}
  data-testid={testId}
  target={href ? '_blank' : undefined}
  rel={href ? 'noopener noreferrer' : undefined}
>
  <slot />
</Tag>
```

- [ ] **Step 4: Create src/layouts/BaseLayout.astro**

```astro
---
import '../styles/global.css';
import { SITE_TITLE, SITE_URL, ENGINEER_NAME, ENGINEER_TITLE } from '../data/site';

interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
  jsonLd?: object[];
}

const {
  title = SITE_TITLE,
  description = `Personal portfolio for ${ENGINEER_NAME}, a ${ENGINEER_TITLE}, showcasing skills, experience, and AI projects.`,
  ogImage = `${SITE_URL}/images/portfolio.png`,
  canonicalUrl = new URL(Astro.url.pathname, SITE_URL).href,
  jsonLd = [],
} = Astro.props;
---

<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="author" content={ENGINEER_NAME} />
  <link rel="canonical" href={canonicalUrl} />

  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:type" content="website" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />

  {jsonLd.map((schema) => (
    <script type="application/ld+json" set:html={JSON.stringify(schema)} />
  ))}
</head>
<body class="bg-navy text-lightest-slate antialiased selection:bg-green-accent/30 selection:text-green-accent">
  <slot />
</body>
</html>
```

- [ ] **Step 5: Verify build**

Run: `npx astro check`

Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
rtk git add src/layouts/ src/components/Button.astro src/components/SectionWrapper.astro src/components/Card.astro
rtk git commit -m "feat: add BaseLayout and primitive Astro components (Button, SectionWrapper, Card)"
```

---

## Task 6: Header + Footer + Sidebars + React Islands

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/MobileMenu.tsx`
- Create: `src/components/Banner.tsx`
- Create: `src/components/Footer.astro`
- Create: `src/components/FixedSidebars.astro`

- [ ] **Step 1: Create src/components/MobileMenu.tsx**

```tsx
import { useState, useEffect } from 'react';

interface NavLink {
  name: string;
  href: string;
}

interface MobileMenuProps {
  navLinks: NavLink[];
}

export default function MobileMenu({ navLinks }: MobileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    const footer = document.querySelector('footer');

    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      mainContent?.classList.add('blur-sm', 'brightness-50', 'pointer-events-none');
      footer?.classList.add('blur-sm', 'brightness-50', 'pointer-events-none');
    } else {
      document.body.style.overflow = 'unset';
      mainContent?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
      footer?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
    }

    const onResize = (e: UIEvent) => {
      if ((e.currentTarget as Window).innerWidth > 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      document.body.style.overflow = 'unset';
      mainContent?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
      footer?.classList.remove('blur-sm', 'brightness-50', 'pointer-events-none');
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="mobile-menu-toggle"
          className="relative z-50 p-4 -mr-4 text-green-accent focus:outline-none"
          aria-label="Menu"
        >
          <div className="w-7 h-6 relative">
            <div
              className={`absolute left-0 w-full h-0.5 bg-green-accent rounded-full transition-all duration-200
              ${menuOpen ? 'rotate-45 w-full' : ''}`}
              style={{
                top: menuOpen ? '50%' : '25%',
                transform: menuOpen ? 'rotate(45deg)' : 'translateY(-50%)',
              }}
            />
            <div
              className={`absolute left-0 w-full h-0.5 bg-green-accent rounded-full transition-all duration-200
              ${menuOpen ? '-rotate-45 w-full' : 'w-5/6'}`}
              style={{
                transform: menuOpen ? 'rotate(-45deg)' : 'translateY(-50%)',
                width: menuOpen ? '100%' : '80%',
                top: menuOpen ? '50%' : '75%',
              }}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <nav
        aria-label="Mobile navigation"
        data-testid="mobile-nav"
        className={`fixed top-0 bottom-0 right-0 h-screen w-3/4 max-w-sm bg-light-navy shadow-lg transform transition-transform duration-300 ease-in-out z-40
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden`}
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <ol className="list-none p-0 m-0 w-full">
            {navLinks.map((link, index) => (
              <li key={link.name} className="relative my-5 mx-auto font-mono text-lightest-slate text-lg">
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block p-4"
                >
                  <span className="text-green-accent block text-sm mb-1">0{index + 1}.</span>
                  {link.name}
                </a>
              </li>
            ))}
          </ol>
          <a href="/resume.pdf" className="font-mono text-lg border border-green-accent text-green-accent rounded py-4 px-12 mt-8">
            Resume
          </a>
        </div>
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Create src/components/Header.astro**

```astro
---
import MobileMenu from './MobileMenu.tsx';
import Button from './Button.astro';
import { NAV_LINKS, ENGINEER_NAME } from '../data/site';

const initials = ENGINEER_NAME.split(' ').map((n: string) => n[0]).join('');
---

<header
  id="site-header"
  class="fixed top-0 z-50 px-6 md:px-12 w-full h-24 flex items-center bg-navy/80 backdrop-blur-md shadow-md transition-transform duration-300 ease-in-out translate-y-0"
>
  <div class="container mx-auto h-full flex items-center justify-between">
    <a
      href="/"
      data-testid="logo-link"
      class="text-2xl font-bold text-green-accent border-2 border-green-accent rounded w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-green-tint transition-colors duration-250"
      aria-label="Homepage"
    >
      {initials[0]}
    </a>

    <nav aria-label="Main navigation" data-testid="desktop-nav" class="hidden md:flex items-center">
      <ol class="flex items-center space-x-6 lg:space-x-8 list-none p-0 m-0">
        {NAV_LINKS.map((link, index) => (
          <li class="relative font-mono text-sm">
            <a
              href={link.href}
              data-testid={`nav-link-${link.name.toLowerCase()}`}
              class="px-2.5 py-2 transition-colors duration-250 text-light-slate hover:text-green-accent"
            >
              <span class="text-green-accent text-xs mr-1">0{index + 1}.</span>
              {link.name}
            </a>
          </li>
        ))}
      </ol>
      <div class="ml-4">
        <Button href="/resume.pdf" size="sm" data-testid="resume-button" target="_blank" rel="noopener noreferrer">
          Resume
        </Button>
      </div>
    </nav>

    <MobileMenu client:load navLinks={NAV_LINKS} />
  </div>
</header>

<script>
  // Header hide-on-scroll behavior
  let lastScrollY = 0;
  const header = document.getElementById('site-header');
  const SCROLL_THRESHOLD = 5;

  function handleScroll() {
    const currentScrollY = window.scrollY;
    if (!header) return;

    if (currentScrollY < SCROLL_THRESHOLD * 2) {
      header.classList.remove('-translate-y-full');
      header.classList.add('translate-y-0');
    } else if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD) {
      header.classList.remove('translate-y-0');
      header.classList.add('-translate-y-full');
    } else if (currentScrollY < lastScrollY) {
      header.classList.remove('-translate-y-full');
      header.classList.add('translate-y-0');
    }
    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', handleScroll);
</script>
```

- [ ] **Step 3: Create src/components/Banner.tsx**

Adapt from current `components/Banner.tsx` — remove React Router dependency, accept props:

```tsx
import { useState, useEffect } from 'react';

interface ValueProp {
  target: string;
  benefit: string;
  negative: string;
}

interface BannerProps {
  valueProps: ValueProp[];
}

export default function Banner({ valueProps }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % valueProps.length);
        setIsExiting(false);
      }, 800);
    }, 7000);

    return () => clearInterval(interval);
  }, [valueProps.length]);

  return (
    <div className="relative w-full h-auto overflow-hidden bg-transparent flex items-start">
      <div className="relative z-10 w-full px-0">
        {valueProps.map((prop, idx) => (
          <div
            key={idx}
            role={idx === currentIndex ? "status" : undefined}
            aria-live={idx === currentIndex ? "polite" : undefined}
            aria-hidden={idx !== currentIndex}
            className={`transition-all duration-700 ease-out transform ${
              idx === currentIndex
                ? (isExiting ? 'opacity-0 translate-x-8 blur-sm' : 'opacity-100 translate-x-0 blur-0')
                : 'absolute inset-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="font-display font-bold leading-[1.1] tracking-tight m-0">
              <div className="text-2xl md:text-3xl lg:text-4xl text-slate-300">
                I help <span className="text-white relative inline-block">
                  {prop.target}
                  <div className="absolute -bottom-1 left-0 w-full h-px bg-blue-500/40" />
                </span>
              </div>

              <div className="text-3xl md:text-4xl lg:text-5xl text-emerald-400 py-0">
                {prop.benefit}
              </div>

              <div className="text-2xl md:text-3xl lg:text-4xl text-slate-300 flex items-baseline flex-wrap gap-x-3">
                <span>without</span>
                <span className="text-rose-400 font-light italic opacity-95">
                  {prop.negative}.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create src/components/Footer.astro**

```astro
---
import { FOOTER_TEXT } from '../data/site';
---

<footer class="text-center py-8 px-6">
  <a
    href="https://github.com/limcheekin/portfolio"
    target="_blank"
    rel="noopener noreferrer"
    class="font-mono text-xs text-slate-text hover:text-green-accent transition-colors duration-250"
  >
    {FOOTER_TEXT}
  </a>
</footer>
```

- [ ] **Step 5: Create src/components/FixedSidebars.astro**

```astro
---
import { SOCIAL_LINKS, EMAIL_ADDRESS } from '../data/site';
---

<!-- Left Social Sidebar -->
<aside aria-label="Social links" class="hidden md:flex fixed bottom-0 left-8 lg:left-10 right-auto z-10 w-10 flex-col items-center animate-fadeInUp" style="animation-delay: 800ms;">
  <ul class="flex flex-col items-center space-y-5 after:content-[''] after:block after:w-px after:h-24 after:bg-slate-text after:mt-5">
    {SOCIAL_LINKS.map((social) => (
      <li>
        <a
          href={social.url}
          data-testid={`social-${social.name.toLowerCase()}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.name}
          title={social.name}
          class="block p-2 text-slate-text hover:text-green-accent hover:scale-110 transform transition-all duration-250 ease-custom-ease"
        >
          {social.iconName === 'FiGithub' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          )}
          {social.iconName === 'FiLinkedin' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          )}
          {social.iconName === 'SiMedium' && (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>
          )}
        </a>
      </li>
    ))}
  </ul>
</aside>

<!-- Right Email Sidebar -->
<aside aria-label="Contact email" class="hidden md:flex fixed bottom-0 right-8 lg:right-10 left-auto z-10 w-10 flex-col items-center animate-fadeInUp" style="animation-delay: 800ms;">
  <div class="flex flex-col items-center space-y-5 after:content-[''] after:block after:w-px after:h-24 after:bg-slate-text after:mt-5">
    <a
      href={`mailto:${EMAIL_ADDRESS}`}
      data-testid="sidebar-email"
      class="font-mono text-xs text-slate-text hover:text-green-accent tracking-wider [writing-mode:vertical-rl] p-2 transform hover:translate-y-[-3px] transition-all duration-250 ease-custom-ease"
    >
      {EMAIL_ADDRESS}
    </a>
  </div>
</aside>
```

- [ ] **Step 6: Commit**

```bash
rtk git add src/components/Header.astro src/components/MobileMenu.tsx src/components/Banner.tsx src/components/Footer.astro src/components/FixedSidebars.astro
rtk git commit -m "feat: add Header, Footer, FixedSidebars, MobileMenu island, Banner island"
```

---

## Task 7: Landing Page (S2 Fix — Pre-rendered HTML)

**Files:**
- Create: `src/pages/index.astro`

This is the critical S2 fix — all content pre-rendered in HTML.

- [ ] **Step 1: Create src/pages/index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import FixedSidebars from '../components/FixedSidebars.astro';
import SectionWrapper from '../components/SectionWrapper.astro';
import Button from '../components/Button.astro';
import Banner from '../components/Banner.tsx';
import { getCollection } from 'astro:content';
import {
  HERO_CONTENT, ABOUT_CONTENT, CONTACT_CONTENT,
  EMAIL_ADDRESS, ENGINEER_NAME, SITE_URL, ENGINEER_TITLE,
  SCROLL_NAV_LINKS,
} from '../data/site';
import { VALUE_PROPS } from '../data/value-props';

const allProjects = await getCollection('projects');
const featuredProjects = allProjects
  .filter((p) => p.data.featured)
  .sort((a, b) => (a.data.featuredOrder ?? 99) - (b.data.featuredOrder ?? 99));
const otherProjects = allProjects.filter((p) => !p.data.featured);

const recentArticles = (await getCollection('articles'))
  .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime())
  .slice(0, 3);

const experience = (await getCollection('experience'))
  .sort((a, b) => a.data.sortOrder - b.data.sortOrder)
  .slice(0, 3);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": ENGINEER_NAME,
    "url": SITE_URL,
    "image": `${SITE_URL}/images/profile.png`,
    "jobTitle": ENGINEER_TITLE,
    "description": `${ENGINEER_TITLE} with over 25 years of experience in the software industry. Passionate about Open-Source AI and Data Sovereignty.`,
    "email": `mailto:${EMAIL_ADDRESS}`,
    "knowsAbout": [
      "Artificial Intelligence", "Machine Learning", "Retrieval-Augmented Generation",
      "LLM Deployment", "Python", "Java", "Spring", "React", "TypeScript",
      "MongoDB", "PostgreSQL", "AWS", "Docker", "Model Context Protocol"
    ],
    "worksFor": { "@type": "Organization", "name": "RAG.WTF & AI Initiatives", "url": "https://www.rag.wtf" },
    "sameAs": [
      "https://github.com/limcheekin",
      "https://linkedin.com/in/limcheekin",
      "https://medium.com/@limcheekin"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": `${ENGINEER_NAME} - Portfolio`,
    "url": SITE_URL,
    "description": `Personal portfolio for ${ENGINEER_NAME}, a ${ENGINEER_TITLE}`,
    "author": { "@type": "Person", "name": ENGINEER_NAME }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does Lim Chee Kin specialize in?",
        "acceptedAnswer": { "@type": "Answer", "text": "Lim Chee Kin specializes in AI engineering, solution architecture, and technical leadership. His current focus areas include Retrieval-Augmented Generation (RAG) systems, LLM deployment, voice AI applications, and bridging legacy infrastructure with modern AI capabilities." }
      },
      {
        "@type": "Question",
        "name": "What is RAG.WTF?",
        "acceptedAnswer": { "@type": "Answer", "text": "RAG.WTF is an open-source platform for private, personalized knowledge discovery and management using Retrieval-Augmented Generation (RAG) systems." }
      },
      {
        "@type": "Question",
        "name": "What is Project Concord?",
        "acceptedAnswer": { "@type": "Answer", "text": "Project Concord is a Model Context Protocol (MCP) server that connects modern AI agents with legacy database schemas." }
      },
      {
        "@type": "Question",
        "name": "How can I contact Lim Chee Kin?",
        "acceptedAnswer": { "@type": "Answer", "text": "You can reach Lim Chee Kin via email at limcheekin@vobject.com, through LinkedIn at linkedin.com/in/limcheekin, or via GitHub at github.com/limcheekin." }
      },
      {
        "@type": "Question",
        "name": "What technologies does Lim Chee Kin work with?",
        "acceptedAnswer": { "@type": "Answer", "text": "Lim Chee Kin works with Python, Java, TypeScript, React, Flutter, and Dart for application development. For AI/ML, he uses RAG frameworks, LLM APIs (Gemini, local LLMs like Llama 3.2 and DeepSeek-R1), sentence transformers, FastRTC for voice AI, and the Model Context Protocol (MCP). His infrastructure stack includes Docker, Coolify, AWS, PostgreSQL, MongoDB, and SurrealDB." }
      },
      {
        "@type": "Question",
        "name": "What is Lim Chee Kin's approach to data sovereignty and private AI?",
        "acceptedAnswer": { "@type": "Answer", "text": "Lim Chee Kin advocates for data ownership and privacy through self-hosted AI infrastructure. He runs local LLMs, embeddings, and STT/TTS services on dedicated hardware (OrangePi 5 Max with Docker and Coolify), and integrates embedded databases like SurrealDB.wasm for client-side data sovereignty." }
      },
      {
        "@type": "Question",
        "name": "What is open-text-embeddings?",
        "acceptedAnswer": { "@type": "Answer", "text": "open-text-embeddings is a Python library created by Lim Chee Kin that provides an OpenAI-compatible API for diverse open-source sentence transformer models such as BGE and E5. It enables significant cost reduction and eliminates vendor lock-in for text embedding generation in RAG and NLP applications." }
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL }
    ]
  }
];
---

<BaseLayout jsonLd={jsonLd}>
  <a href="#main-content" class="absolute left-[-9999px] top-auto w-px h-px overflow-hidden focus:static focus:w-auto focus:h-auto focus:p-3 focus:m-3 focus:block focus:bg-green-accent focus:text-navy rounded-md shadow-lg z-[9999]">
    Skip to main content
  </a>

  <Header />
  <FixedSidebars />

  <main id="main-content" data-testid="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 py-0">

    <!-- Hero Section -->
    <section id="hero" data-testid="hero-section" class="min-h-screen flex flex-col justify-center pt-24 md:pt-32 pb-20">
      <div>
        <p class="font-mono text-base text-green-accent mb-4 md:mb-6 animate-fadeInUp" style="animation-delay: 100ms;">
          {HERO_CONTENT.greeting}
        </p>
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-lightest-slate mb-3 md:mb-4 animate-fadeInUp" style="animation-delay: 200ms;">
          {HERO_CONTENT.name}
        </h1>
        <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-text mb-6 md:mb-8 animate-fadeInUp" style="animation-delay: 300ms;">
          {HERO_CONTENT.tagline}
        </h2>
        <div class="pb-16">
          <Banner client:load valueProps={VALUE_PROPS} />
        </div>
        <div class="animate-fadeInUp" style="animation-delay: 500ms;">
          <Button href={`mailto:${EMAIL_ADDRESS}`} size="lg" data-testid="hero-cta">
            {HERO_CONTENT.ctaButton}
          </Button>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <SectionWrapper id="about" title="About Me" titleNumber="01">
      <div class="grid md:grid-cols-5 gap-10 lg:gap-12 items-start">
        <div class="md:col-span-3">
          <div class="max-w-none mb-8">
            {ABOUT_CONTENT.introductionParagraphs.map((paragraph) => (
              <p class="text-slate-text text-lg leading-relaxed mb-4">{paragraph}</p>
            ))}
          </div>
          <div class="mb-12">
            <p class="text-lightest-slate mb-3">Here are a few technologies I've been working with recently:</p>
            <ul class="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
              {ABOUT_CONTENT.skills.map((skill) => (
                <li class="font-mono custom-bullet">{skill}</li>
              ))}
            </ul>
          </div>

          {experience.length > 0 && (
            <div>
              <h3 class="text-xl font-semibold text-lightest-slate mb-6 flex items-center">
                <span class="text-lg text-green-accent font-mono mr-2.5">▹</span>
                Work Experience
              </h3>
              <div class="space-y-10">
                {experience.map((exp) => (
                  <div class="relative pl-8 group">
                    <div class="absolute left-0 top-1 bottom-0 w-px bg-lightest-navy/50 group-hover:bg-green-accent/50 transition-colors duration-250"></div>
                    <div class="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-navy border-2 border-lightest-navy/80 group-hover:border-green-accent transition-colors duration-250 transform -translate-x-[calc(50%-1px)]">
                      <div class="w-full h-full rounded-full bg-green-accent scale-0 group-hover:scale-100 transition-transform duration-250"></div>
                    </div>
                    <h4 class="text-lg font-medium text-lightest-slate group-hover:text-green-accent transition-colors duration-250 mb-0.5">
                      {exp.data.title}
                      {exp.data.companyUrl ? (
                        <a href={exp.data.companyUrl} target="_blank" rel="noopener noreferrer" class="text-green-accent hover:underline">
                          {' '}@ {exp.data.company}
                        </a>
                      ) : (
                        <span class="text-green-accent"> @ {exp.data.company}</span>
                      )}
                    </h4>
                    <p class="font-mono text-xs text-slate-text mb-3">{exp.data.startDate} - {exp.data.endDate || 'Present'}</p>
                    <ul class="list-none pl-0 space-y-1.5 text-slate-text text-sm">
                      {exp.data.description.map((point) => (
                        <li class="relative pl-5 before:content-['–'] before:absolute before:left-0 before:text-slate-text before:opacity-70">
                          {point}
                        </li>
                      ))}
                    </ul>
                    {exp.data.technologies.length > 0 && (
                      <div class="mt-4 flex flex-wrap gap-2">
                        {exp.data.technologies.map((skill) => (
                          <span class="font-mono text-xs bg-green-tint text-green-accent px-2.5 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div class="mt-10 text-center">
                <Button href="/about/" variant="secondary">View Full Experience</Button>
              </div>
            </div>
          )}
        </div>
        <div class="md:col-span-2 relative group mx-auto md:mx-0 max-w-xs md:max-w-sm">
          <div class="absolute inset-0 rounded-md border-2 border-green-accent transform translate-x-3 translate-y-3 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-250 ease-custom-ease z-0"></div>
          <div class="relative bg-green-accent rounded-md overflow-hidden z-10 shadow-lg">
            <img
              src={ABOUT_CONTENT.professionalPhotoUrl}
              alt={`Professional headshot of ${ENGINEER_NAME}`}
              class="rounded-md w-full h-auto object-cover filter grayscale hover:filter-none transition-all duration-250 ease-custom-ease"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-navy/60 group-hover:bg-transparent transition-colors duration-250 ease-custom-ease"></div>
          </div>
        </div>
      </div>
    </SectionWrapper>

    <!-- Projects Section (featured only) -->
    <SectionWrapper id="projects" title="Some Things I've Built" titleNumber="02">
      <div class="space-y-16 md:space-y-28">
        {featuredProjects.map((project, index) => {
          const isEven = index % 2 === 0;
          return (
            <div data-testid={`featured-project-${project.slug}`} class="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-center mb-20 md:mb-28 group relative">
              <div class={`relative md:col-span-7 ${isEven ? 'md:order-2' : ''}`}>
                <a
                  href={project.data.liveUrl || project.data.githubUrl}
                  target="_blank" rel="noopener noreferrer"
                  class="block rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-250 ease-custom-ease"
                  aria-label={`View project: ${project.data.title}`}
                >
                  {project.data.image && (
                    <img
                      src={project.data.image}
                      alt={`Screenshot of ${project.data.title}`}
                      loading="lazy"
                      class="w-full h-auto object-cover object-top rounded-lg filter grayscale group-hover:filter-none brightness-75 group-hover:brightness-100 transition-all duration-250 ease-custom-ease"
                    />
                  )}
                  <div class="absolute inset-0 bg-navy/50 group-hover:bg-transparent transition-colors duration-250 ease-custom-ease"></div>
                </a>
              </div>
              <div class={`relative md:col-span-5 ${isEven ? 'md:order-1 md:text-left' : 'md:text-right'}`}>
                <p class="font-mono text-sm text-green-accent mb-1.5">Featured Project</p>
                <h3 class="text-2xl font-semibold text-lightest-slate mb-5 hover:text-green-accent transition-colors duration-250">
                  <a href={`/projects/${project.slug}/`}>{project.data.title}</a>
                </h3>
                <div class="bg-light-navy p-6 rounded-md shadow-lg md:relative z-10 text-slate-text text-sm leading-relaxed">
                  <p>{project.data.description}</p>
                </div>
                <ul class={`flex flex-wrap gap-x-3 gap-y-1.5 mt-5 font-mono text-xs text-slate-text ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                  {project.data.technologies.map((tech) => (
                    <li>{tech}</li>
                  ))}
                </ul>
                <div class={`flex items-center gap-3 mt-6 ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                  {project.data.githubUrl && (
                    <a href={project.data.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub repository" class="text-slate-text hover:text-green-accent transition-colors duration-250">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                    </a>
                  )}
                  {project.data.liveUrl && (
                    <a href={project.data.liveUrl} target="_blank" rel="noopener noreferrer" aria-label="Live demo" class="text-slate-text hover:text-green-accent transition-colors duration-250">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div class="mt-12 text-center">
        <Button href="/projects/" variant="secondary">View All Projects</Button>
      </div>
    </SectionWrapper>

    <!-- Insights Section (recent only) -->
    <SectionWrapper id="insights" title="Writing" titleNumber="03" contentClass="max-w-2xl mx-auto">
      <ul class="space-y-1">
        {recentArticles.map((article) => (
          <li class="mb-5 group relative transition-all duration-250 ease-custom-ease">
            <a
              href={article.data.externalUrl || `/insights/${article.slug}/`}
              data-testid={`article-${article.slug}`}
              target={article.data.externalUrl ? '_blank' : undefined}
              rel={article.data.externalUrl ? 'noopener noreferrer' : undefined}
              class="block p-5 rounded-md transition-all duration-250 ease-custom-ease hover:bg-light-navy hover:shadow-xl"
              aria-label={`Read article: ${article.data.title}`}
            >
              <div class="flex justify-between items-center mb-1">
                <h3 class="text-lg font-semibold text-lightest-slate group-hover:text-green-accent transition-colors duration-250">
                  {article.data.title}
                </h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-text group-hover:text-green-accent transition-colors duration-250 flex-shrink-0 ml-2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <p class="text-sm text-slate-text leading-relaxed line-clamp-2 mb-1">
                {article.data.description}
              </p>
              <p class="text-xs font-mono text-green-accent/80">
                {article.data.type}{article.data.platform && ` · ${article.data.platform}`}
              </p>
            </a>
          </li>
        ))}
      </ul>
      <div class="mt-10 text-center">
        <Button href="/insights/" variant="secondary">View All Articles</Button>
      </div>
    </SectionWrapper>

    <!-- Contact Section -->
    <SectionWrapper id="contact" title={CONTACT_CONTENT.subtext} titleNumber="04" class="text-center max-w-xl mx-auto" contentClass="flex flex-col items-center">
      <h3 class="text-3xl md:text-4xl font-semibold text-lightest-slate mb-4 -mt-4">
        {CONTACT_CONTENT.title}
      </h3>
      <div class="max-w-lg mx-auto text-center mb-10">
        <p class="text-slate-text text-lg leading-relaxed">{CONTACT_CONTENT.paragraph}</p>
      </div>
      <Button href="/contact/" size="lg" data-testid="hero-contact-cta">
        {CONTACT_CONTENT.buttonText}
      </Button>
    </SectionWrapper>

  </main>

  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Verify dev server**

Run: `npm run dev`

Expected: Site loads at localhost, all sections render with pre-rendered HTML. View source shows actual content in the DOM (not empty `<div id="root">`).

- [ ] **Step 3: Verify build**

Run: `npm run build` (will fail on generate-api.ts script — that's expected, we'll add it later. For now, temporarily change build to just `astro build`)

Run: `npx astro build`

Expected: Build succeeds, `dist/index.html` contains all content in HTML.

- [ ] **Step 4: Commit**

```bash
rtk git add src/pages/index.astro
rtk git commit -m "feat: add landing page with pre-rendered HTML (fixes S2 Machine Readability)"
```

---

## Task 8: Section Pages (T1 Fix — Independently Fetchable URLs)

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/insights/index.astro`
- Create: `src/pages/contact.astro`
- Create: `src/components/ContactForm.astro`

- [ ] **Step 1: Create src/pages/about.astro**

Full about page with complete experience timeline (all 10 entries):

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import FixedSidebars from '../components/FixedSidebars.astro';
import Button from '../components/Button.astro';
import { getCollection } from 'astro:content';
import { ABOUT_CONTENT, ENGINEER_NAME, ENGINEER_TITLE, SITE_URL, EMAIL_ADDRESS } from '../data/site';

const experience = (await getCollection('experience'))
  .sort((a, b) => a.data.sortOrder - b.data.sortOrder);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": ENGINEER_NAME,
    "url": SITE_URL,
    "image": `${SITE_URL}/images/profile.png`,
    "jobTitle": ENGINEER_TITLE,
    "email": `mailto:${EMAIL_ADDRESS}`,
    "sameAs": ["https://github.com/limcheekin", "https://linkedin.com/in/limcheekin", "https://medium.com/@limcheekin"]
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "About", "item": `${SITE_URL}/about/` }
    ]
  }
];
---

<BaseLayout
  title={`About | ${ENGINEER_NAME}`}
  description={`Learn about ${ENGINEER_NAME}'s 25+ year career in software engineering, AI, and solution architecture.`}
  jsonLd={jsonLd}
>
  <Header />
  <FixedSidebars />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20">
    <h1 class="text-3xl md:text-4xl font-bold text-lightest-slate mb-8">About Me</h1>

    <div class="grid md:grid-cols-5 gap-10 lg:gap-12 items-start mb-16">
      <div class="md:col-span-3">
        {ABOUT_CONTENT.introductionParagraphs.map((paragraph) => (
          <p class="text-slate-text text-lg leading-relaxed mb-4">{paragraph}</p>
        ))}
        <div class="mt-8">
          <p class="text-lightest-slate mb-3">Technologies I work with:</p>
          <ul class="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
            {ABOUT_CONTENT.skills.map((skill) => (
              <li class="font-mono custom-bullet">{skill}</li>
            ))}
          </ul>
        </div>
      </div>
      <div class="md:col-span-2 relative group mx-auto md:mx-0 max-w-xs md:max-w-sm">
        <div class="absolute inset-0 rounded-md border-2 border-green-accent transform translate-x-3 translate-y-3 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-250 ease-custom-ease z-0"></div>
        <div class="relative bg-green-accent rounded-md overflow-hidden z-10 shadow-lg">
          <img src={ABOUT_CONTENT.professionalPhotoUrl} alt={`Professional headshot of ${ENGINEER_NAME}`} class="rounded-md w-full h-auto object-cover filter grayscale hover:filter-none transition-all duration-250 ease-custom-ease" loading="lazy" />
          <div class="absolute inset-0 bg-navy/60 group-hover:bg-transparent transition-colors duration-250 ease-custom-ease"></div>
        </div>
      </div>
    </div>

    <h2 class="text-2xl md:text-3xl font-semibold text-lightest-slate mb-10 flex items-center">
      Work Experience
      <span class="block h-px bg-lightest-navy/30 ml-5 w-full max-w-xs md:max-w-sm"></span>
    </h2>

    <div class="space-y-10">
      {experience.map((exp) => (
        <div class="relative pl-8 group">
          <div class="absolute left-0 top-1 bottom-0 w-px bg-lightest-navy/50 group-hover:bg-green-accent/50 transition-colors duration-250"></div>
          <div class="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-navy border-2 border-lightest-navy/80 group-hover:border-green-accent transition-colors duration-250 transform -translate-x-[calc(50%-1px)]">
            <div class="w-full h-full rounded-full bg-green-accent scale-0 group-hover:scale-100 transition-transform duration-250"></div>
          </div>
          <h3 class="text-lg font-medium text-lightest-slate group-hover:text-green-accent transition-colors duration-250 mb-0.5">
            {exp.data.title}
            {exp.data.companyUrl ? (
              <a href={exp.data.companyUrl} target="_blank" rel="noopener noreferrer" class="text-green-accent hover:underline">
                {' '}@ {exp.data.company}
              </a>
            ) : (
              <span class="text-green-accent"> @ {exp.data.company}</span>
            )}
          </h3>
          <p class="font-mono text-xs text-slate-text mb-3">{exp.data.startDate} - {exp.data.endDate || 'Present'}</p>
          <ul class="list-none pl-0 space-y-1.5 text-slate-text text-sm">
            {exp.data.description.map((point) => (
              <li class="relative pl-5 before:content-['–'] before:absolute before:left-0 before:text-slate-text before:opacity-70">
                {point}
              </li>
            ))}
          </ul>
          {exp.data.technologies.length > 0 && (
            <div class="mt-4 flex flex-wrap gap-2">
              {exp.data.technologies.map((skill) => (
                <span class="font-mono text-xs bg-green-tint text-green-accent px-2.5 py-1 rounded">{skill}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Create src/pages/projects/index.astro**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import FixedSidebars from '../../components/FixedSidebars.astro';
import { getCollection } from 'astro:content';
import { ENGINEER_NAME, SITE_URL } from '../../data/site';

const allProjects = await getCollection('projects');
const featuredProjects = allProjects
  .filter((p) => p.data.featured)
  .sort((a, b) => (a.data.featuredOrder ?? 99) - (b.data.featuredOrder ?? 99));
const otherProjects = allProjects.filter((p) => !p.data.featured);

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Projects by ${ENGINEER_NAME}`,
    "itemListElement": allProjects.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": { "@type": "SoftwareSourceCode", "name": p.data.title, "description": p.data.description, "url": `${SITE_URL}/projects/${p.slug}/` }
    }))
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE_URL}/projects/` }
    ]
  }
];
---

<BaseLayout
  title={`Projects | ${ENGINEER_NAME}`}
  description={`Explore AI engineering projects by ${ENGINEER_NAME}: RAG systems, voice AI, MCP servers, and more.`}
  jsonLd={jsonLd}
>
  <Header />
  <FixedSidebars />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20">
    <h1 class="text-3xl md:text-4xl font-bold text-lightest-slate mb-12">All Projects</h1>

    {featuredProjects.length > 0 && (
      <div class="mb-16">
        <h2 class="text-xl font-semibold text-lightest-slate mb-8">Featured</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredProjects.map((project) => (
            <a href={`/projects/${project.slug}/`} class="block bg-light-navy rounded-md p-6 hover:shadow-xl transition-shadow duration-250 group">
              {project.data.image && (
                <img src={project.data.image} alt={project.data.title} class="w-full h-48 object-cover rounded mb-4 filter grayscale group-hover:filter-none transition-all duration-250" loading="lazy" />
              )}
              <h3 class="text-lg font-semibold text-lightest-slate group-hover:text-green-accent transition-colors duration-250 mb-2">{project.data.title}</h3>
              <p class="text-sm text-slate-text leading-relaxed line-clamp-3 mb-3">{project.data.description}</p>
              <ul class="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-slate-text">
                {project.data.technologies.slice(0, 5).map((tech) => <li>{tech}</li>)}
              </ul>
            </a>
          ))}
        </div>
      </div>
    )}

    {otherProjects.length > 0 && (
      <div>
        <h2 class="text-xl font-semibold text-lightest-slate mb-8">Other Projects</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherProjects.map((project) => (
            <a href={`/projects/${project.slug}/`} class="flex flex-col h-full bg-light-navy rounded-md shadow-lg hover:shadow-xl transition-shadow duration-250 group p-6">
              <h3 class="text-lg font-semibold text-lightest-slate mb-2 group-hover:text-green-accent transition-colors duration-250">{project.data.title}</h3>
              <p class="text-slate-text text-sm leading-relaxed mb-4 flex-grow line-clamp-3">{project.data.description}</p>
              <ul class="flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-xs text-slate-text">
                {project.data.technologies.slice(0, 4).map((tech) => <li>{tech}</li>)}
              </ul>
            </a>
          ))}
        </div>
      </div>
    )}
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Create src/pages/insights/index.astro**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import FixedSidebars from '../../components/FixedSidebars.astro';
import { getCollection } from 'astro:content';
import { ENGINEER_NAME, SITE_URL } from '../../data/site';

const articles = (await getCollection('articles'))
  .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Articles by ${ENGINEER_NAME}`,
    "itemListElement": articles.map((a, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": { "@type": "Article", "name": a.data.title, "description": a.data.description, "url": a.data.externalUrl || `${SITE_URL}/insights/${a.slug}/` }
    }))
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Insights", "item": `${SITE_URL}/insights/` }
    ]
  }
];
---

<BaseLayout
  title={`Insights | ${ENGINEER_NAME}`}
  description={`Articles and insights on AI engineering, RAG systems, and open-source AI by ${ENGINEER_NAME}.`}
  jsonLd={jsonLd}
>
  <Header />
  <FixedSidebars />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20">
    <h1 class="text-3xl md:text-4xl font-bold text-lightest-slate mb-12">Writing & Insights</h1>
    <div class="max-w-2xl mx-auto">
      <ul class="space-y-1">
        {articles.map((article) => (
          <li class="mb-5 group">
            <a
              href={article.data.externalUrl || `/insights/${article.slug}/`}
              target={article.data.externalUrl ? '_blank' : undefined}
              rel={article.data.externalUrl ? 'noopener noreferrer' : undefined}
              class="block p-5 rounded-md transition-all duration-250 ease-custom-ease hover:bg-light-navy hover:shadow-xl"
              aria-label={`Read article: ${article.data.title}`}
            >
              <div class="flex justify-between items-center mb-1">
                <h2 class="text-lg font-semibold text-lightest-slate group-hover:text-green-accent transition-colors duration-250">{article.data.title}</h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-text group-hover:text-green-accent transition-colors duration-250 flex-shrink-0 ml-2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </div>
              <p class="text-sm text-slate-text leading-relaxed line-clamp-2 mb-1">{article.data.description}</p>
              <p class="text-xs font-mono text-green-accent/80">
                {article.data.type}{article.data.platform && ` · ${article.data.platform}`}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 4: Create src/components/ContactForm.astro**

Static HTML form posting to Formspree (T2 fix):

```astro
---
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
---

<form
  action={FORMSPREE_ENDPOINT}
  method="POST"
  data-testid="contact-form"
  class="w-full max-w-lg text-left mb-8 space-y-5"
>
  <div>
    <label for="contact-name" class="block font-mono text-xs text-light-slate mb-1.5">Name</label>
    <input
      type="text"
      id="contact-name"
      name="name"
      required
      autocomplete="name"
      data-testid="contact-field-name"
      class="w-full bg-light-navy border border-lightest-navy rounded px-4 py-3 text-sm text-lightest-slate placeholder-slate-text/50 focus:border-green-accent focus:outline-none transition-colors duration-250"
      placeholder="Your name"
    />
  </div>
  <div>
    <label for="contact-email" class="block font-mono text-xs text-light-slate mb-1.5">Email</label>
    <input
      type="email"
      id="contact-email"
      name="email"
      required
      autocomplete="email"
      data-testid="contact-field-email"
      class="w-full bg-light-navy border border-lightest-navy rounded px-4 py-3 text-sm text-lightest-slate placeholder-slate-text/50 focus:border-green-accent focus:outline-none transition-colors duration-250"
      placeholder="your@email.com"
    />
  </div>
  <div>
    <label for="contact-message" class="block font-mono text-xs text-light-slate mb-1.5">Message</label>
    <textarea
      id="contact-message"
      name="message"
      required
      rows="5"
      data-testid="contact-field-message"
      class="w-full bg-light-navy border border-lightest-navy rounded px-4 py-3 text-sm text-lightest-slate placeholder-slate-text/50 focus:border-green-accent focus:outline-none transition-colors duration-250 resize-y"
      placeholder="What would you like to discuss?"
    ></textarea>
  </div>
  <input type="hidden" name="_next" value="/contact/?submitted=true" />
  <div class="text-center pt-2">
    <button
      type="submit"
      data-testid="contact-form-submit"
      class="font-mono inline-flex items-center justify-center rounded border border-green-accent text-green-accent hover:bg-green-tint transition-all duration-250 ease-custom-ease px-8 py-4 text-base"
    >
      Send Message
    </button>
  </div>
</form>
```

Note: Replace `YOUR_FORM_ID` with actual Formspree form ID when configured.

- [ ] **Step 5: Create src/pages/contact.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import FixedSidebars from '../components/FixedSidebars.astro';
import ContactForm from '../components/ContactForm.astro';
import Button from '../components/Button.astro';
import { CONTACT_CONTENT, EMAIL_ADDRESS, ENGINEER_NAME, SITE_URL } from '../data/site';

const submitted = Astro.url.searchParams.get('submitted') === 'true';

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": `Contact ${ENGINEER_NAME}`,
    "url": `${SITE_URL}/contact/`
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Contact", "item": `${SITE_URL}/contact/` }
    ]
  }
];
---

<BaseLayout
  title={`Contact | ${ENGINEER_NAME}`}
  description={`Get in touch with ${ENGINEER_NAME} for AI discussions, collaborations, or consulting.`}
  jsonLd={jsonLd}
>
  <Header />
  <FixedSidebars />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20">
    <div class="text-center max-w-xl mx-auto">
      <h1 class="text-3xl md:text-4xl font-bold text-lightest-slate mb-4">{CONTACT_CONTENT.title}</h1>
      <p class="text-slate-text text-lg leading-relaxed mb-10">{CONTACT_CONTENT.paragraph}</p>

      {submitted ? (
        <div data-testid="contact-form-success" class="text-green-accent font-mono text-sm mb-8 p-6 bg-light-navy rounded-md">
          Thank you for your message! I'll get back to you as soon as possible.
        </div>
      ) : (
        <ContactForm />
      )}

      <p class="font-mono text-xs text-slate-text mb-4 mt-8">or email directly</p>
      <Button href={`mailto:${EMAIL_ADDRESS}`} size="md" data-testid="contact-cta" variant="secondary">
        {CONTACT_CONTENT.buttonText}
      </Button>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 6: Verify all section pages build**

Run: `npx astro build`

Expected: Build succeeds. Check `dist/about/index.html`, `dist/projects/index.html`, `dist/insights/index.html`, `dist/contact/index.html` all exist with pre-rendered content.

- [ ] **Step 7: Commit**

```bash
rtk git add src/pages/about.astro src/pages/projects/index.astro src/pages/insights/index.astro src/pages/contact.astro src/components/ContactForm.astro
rtk git commit -m "feat: add section pages — /about/, /projects/, /insights/, /contact/ (fixes T1, T2)"
```

---

## Task 9: Detail Pages (T1 Complete — Individual Fetchable URLs)

**Files:**
- Create: `src/pages/projects/[slug].astro`
- Create: `src/pages/insights/[slug].astro`

- [ ] **Step 1: Create src/pages/projects/[slug].astro**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import FixedSidebars from '../../components/FixedSidebars.astro';
import Button from '../../components/Button.astro';
import { getCollection } from 'astro:content';
import { ENGINEER_NAME, SITE_URL } from '../../data/site';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({
    params: { slug: project.slug },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await project.render();

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": project.data.title,
    "description": project.data.description,
    "url": `${SITE_URL}/projects/${project.slug}/`,
    "codeRepository": project.data.githubUrl,
    "author": { "@type": "Person", "name": ENGINEER_NAME },
    "programmingLanguage": project.data.technologies,
    "keywords": project.data.technologies.join(', ')
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Projects", "item": `${SITE_URL}/projects/` },
      { "@type": "ListItem", "position": 3, "name": project.data.title, "item": `${SITE_URL}/projects/${project.slug}/` }
    ]
  }
];
---

<BaseLayout
  title={`${project.data.title} | ${ENGINEER_NAME}`}
  description={project.data.description}
  ogImage={project.data.image ? `${SITE_URL}${project.data.image}` : undefined}
  jsonLd={jsonLd}
>
  <Header />
  <FixedSidebars />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20">
    <nav class="mb-8 font-mono text-sm text-slate-text">
      <a href="/" class="hover:text-green-accent transition-colors">Home</a>
      <span class="mx-2">/</span>
      <a href="/projects/" class="hover:text-green-accent transition-colors">Projects</a>
      <span class="mx-2">/</span>
      <span class="text-green-accent">{project.data.title}</span>
    </nav>

    {project.data.image && (
      <img
        src={project.data.image}
        alt={`Screenshot of ${project.data.title}`}
        class="w-full h-auto max-h-96 object-cover rounded-lg mb-8"
        loading="eager"
      />
    )}

    <h1 class="text-3xl md:text-4xl font-bold text-lightest-slate mb-4">{project.data.title}</h1>

    <p class="text-slate-text text-lg leading-relaxed mb-6">{project.data.description}</p>

    <ul class="flex flex-wrap gap-x-3 gap-y-2 mb-8 font-mono text-xs">
      {project.data.technologies.map((tech) => (
        <li class="bg-green-tint text-green-accent px-2.5 py-1 rounded">{tech}</li>
      ))}
    </ul>

    <div class="flex gap-4 mb-12">
      {project.data.githubUrl && (
        <Button href={project.data.githubUrl} size="sm">View Source</Button>
      )}
      {project.data.liveUrl && (
        <Button href={project.data.liveUrl} size="sm">Live Demo</Button>
      )}
    </div>

    <div class="prose-like text-slate-text text-base leading-relaxed space-y-4">
      <Content />
    </div>

    <div class="mt-16">
      <Button href="/projects/" variant="secondary">&larr; All Projects</Button>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Create src/pages/insights/[slug].astro**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import FixedSidebars from '../../components/FixedSidebars.astro';
import Button from '../../components/Button.astro';
import { getCollection } from 'astro:content';
import { ENGINEER_NAME, SITE_URL } from '../../data/site';

export async function getStaticPaths() {
  const articles = await getCollection('articles');
  return articles.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}

const { article } = Astro.props;
const { Content } = await article.render();

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.data.title,
    "description": article.data.description,
    "url": article.data.externalUrl || `${SITE_URL}/insights/${article.slug}/`,
    "datePublished": article.data.publishDate.toISOString(),
    "author": { "@type": "Person", "name": ENGINEER_NAME },
    "keywords": article.data.tags.join(', ')
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Insights", "item": `${SITE_URL}/insights/` },
      { "@type": "ListItem", "position": 3, "name": article.data.title, "item": `${SITE_URL}/insights/${article.slug}/` }
    ]
  }
];
---

<BaseLayout
  title={`${article.data.title} | ${ENGINEER_NAME}`}
  description={article.data.description}
  jsonLd={jsonLd}
>
  <Header />
  <FixedSidebars />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 pt-32 pb-20">
    <nav class="mb-8 font-mono text-sm text-slate-text">
      <a href="/" class="hover:text-green-accent transition-colors">Home</a>
      <span class="mx-2">/</span>
      <a href="/insights/" class="hover:text-green-accent transition-colors">Insights</a>
      <span class="mx-2">/</span>
      <span class="text-green-accent">{article.data.title}</span>
    </nav>

    <h1 class="text-3xl md:text-4xl font-bold text-lightest-slate mb-4">{article.data.title}</h1>

    <div class="flex items-center gap-4 mb-8 font-mono text-sm text-slate-text">
      <time datetime={article.data.publishDate.toISOString()}>
        {article.data.publishDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      {article.data.platform && <span>· {article.data.platform}</span>}
    </div>

    <ul class="flex flex-wrap gap-x-3 gap-y-2 mb-8 font-mono text-xs">
      {article.data.tags.map((tag) => (
        <li class="bg-green-tint text-green-accent px-2.5 py-1 rounded">{tag}</li>
      ))}
    </ul>

    {article.data.externalUrl && (
      <div class="mb-8 p-4 bg-light-navy rounded-md">
        <p class="text-sm text-slate-text">
          This article was originally published on an external platform.
          <a href={article.data.externalUrl} target="_blank" rel="noopener noreferrer" class="text-green-accent hover:underline ml-1">
            Read the full article &rarr;
          </a>
        </p>
      </div>
    )}

    <div class="prose-like text-slate-text text-base leading-relaxed space-y-4">
      <Content />
    </div>

    <div class="mt-16">
      <Button href="/insights/" variant="secondary">&larr; All Articles</Button>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Verify detail pages build**

Run: `npx astro build`

Expected: Build succeeds. Check `dist/projects/rag-wtf/index.html`, `dist/insights/talking-book/index.html` exist with full content.

- [ ] **Step 4: Commit**

```bash
rtk git add src/pages/projects/\[slug\].astro src/pages/insights/\[slug\].astro
rtk git commit -m "feat: add project and article detail pages with per-page JSON-LD (fixes T1, S4)"
```

---

## Task 10: 404 Page (T3 Fix)

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Create src/pages/404.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import Button from '../components/Button.astro';
import { ENGINEER_NAME, SITE_URL } from '../data/site';

const jsonLd = [{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL }
  ]
}];
---

<BaseLayout title={`Page Not Found | ${ENGINEER_NAME}`} description="The page you're looking for doesn't exist." jsonLd={jsonLd}>
  <Header />
  <main id="main-content" class="mx-auto min-h-screen max-w-screen-lg px-6 sm:px-10 md:px-16 lg:px-24 flex flex-col items-center justify-center text-center">
    <h1 class="text-6xl md:text-8xl font-bold text-green-accent mb-4">404</h1>
    <h2 class="text-2xl md:text-3xl font-semibold text-lightest-slate mb-6">Page Not Found</h2>
    <p class="text-slate-text text-lg mb-10 max-w-md">
      The page you're looking for doesn't exist or has been moved. Here are some places you can go instead:
    </p>
    <div class="flex flex-wrap gap-4 justify-center">
      <Button href="/">Home</Button>
      <Button href="/projects/" variant="secondary">Projects</Button>
      <Button href="/insights/" variant="secondary">Insights</Button>
      <Button href="/contact/" variant="secondary">Contact</Button>
    </div>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Verify 404 builds**

Run: `npx astro build`

Expected: `dist/404.html` exists with navigation links.

- [ ] **Step 3: Commit**

```bash
rtk git add src/pages/404.astro
rtk git commit -m "feat: add custom 404 page with navigation (fixes T3 Error Handling)"
```

---

## Task 11: Build-time API + llms-full.txt Generation (T6, S1 Fix)

**Files:**
- Create: `scripts/generate-api.ts`
- Modify: `public/robots.txt`
- Modify: `public/llms.txt`

- [ ] **Step 1: Create scripts/generate-api.ts**

This script reads the Astro build output content collections and generates `portfolio.json` and `llms-full.txt`:

```typescript
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const contentDir = join(rootDir, 'src', 'content');

// Read content files directly from source (not dist)
function readJsonFiles(dir: string) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')));
  } catch {
    return [];
  }
}

function readMdFrontmatter(dir: string) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const content = readFileSync(join(dir, f), 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!match) return null;
        const frontmatter: Record<string, any> = {};
        match[1].split('\n').forEach((line) => {
          const [key, ...rest] = line.split(':');
          if (key && rest.length) {
            let val = rest.join(':').trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith('[')) {
              try { frontmatter[key.trim()] = JSON.parse(val); } catch { frontmatter[key.trim()] = val; }
            } else if (val === 'true') frontmatter[key.trim()] = true;
            else if (val === 'false') frontmatter[key.trim()] = false;
            else frontmatter[key.trim()] = val;
          }
        });
        frontmatter._body = match[2].trim();
        frontmatter._slug = f.replace('.md', '');
        return frontmatter;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// Read content
const projects = readMdFrontmatter(join(contentDir, 'projects'));
const articles = readMdFrontmatter(join(contentDir, 'articles'));
const experience = readJsonFiles(join(contentDir, 'experience')).sort((a, b) => a.sortOrder - b.sortOrder);

// Generate portfolio.json
const portfolio = {
  name: "Lim Chee Kin",
  title: "Senior Tech Lead, AI Engineer, and Solution Architect",
  email: "limcheekin@vobject.com",
  urls: {
    github: "https://github.com/limcheekin",
    linkedin: "https://linkedin.com/in/limcheekin",
    medium: "https://medium.com/@limcheekin",
  },
  projects: projects.map((p: any) => ({
    title: p.title,
    slug: p._slug,
    description: p.description,
    featured: p.featured,
    technologies: p.technologies || [],
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    category: p.category,
  })),
  articles: articles.map((a: any) => ({
    title: a.title,
    slug: a._slug,
    description: a.description,
    externalUrl: a.externalUrl,
    publishDate: a.publishDate,
    tags: a.tags || [],
  })),
  experience: experience.map((e: any) => ({
    company: e.company,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    technologies: e.technologies || [],
  })),
  metadata: {
    generatedAt: new Date().toISOString(),
    version: "2.0",
  },
};

mkdirSync(join(distDir, 'api'), { recursive: true });
writeFileSync(join(distDir, 'api', 'portfolio.json'), JSON.stringify(portfolio, null, 2));
console.log('Generated: dist/api/portfolio.json');

// Generate llms-full.txt
const lines = [
  `# Lim Chee Kin — Full Portfolio Content`,
  `> Senior Tech Lead, AI Engineer, and Solution Architect with 25+ years of experience.`,
  ``,
  `## Projects`,
  ...projects.map((p: any) => [
    `### ${p.title}`,
    p.description,
    `Technologies: ${(p.technologies || []).join(', ')}`,
    p.githubUrl ? `Repository: ${p.githubUrl}` : '',
    p.liveUrl ? `Live: ${p.liveUrl}` : '',
    p._body ? `\n${p._body}` : '',
    ``,
  ].filter(Boolean).join('\n')),
  ``,
  `## Articles`,
  ...articles.map((a: any) => [
    `### ${a.title}`,
    a.description,
    a.externalUrl ? `URL: ${a.externalUrl}` : '',
    a._body ? `\n${a._body}` : '',
    ``,
  ].filter(Boolean).join('\n')),
  ``,
  `## Work Experience`,
  ...experience.map((e: any) => [
    `### ${e.title} @ ${e.company}`,
    `${e.startDate} - ${e.endDate || 'Present'}`,
    ...e.description.map((d: string) => `- ${d}`),
    `Skills: ${(e.technologies || []).join(', ')}`,
    ``,
  ].join('\n')),
  ``,
  `## Contact`,
  `- Email: limcheekin@vobject.com`,
  `- GitHub: https://github.com/limcheekin`,
  `- LinkedIn: https://linkedin.com/in/limcheekin`,
  `- Medium: https://medium.com/@limcheekin`,
];

writeFileSync(join(distDir, 'llms-full.txt'), lines.join('\n'));
console.log('Generated: dist/llms-full.txt');
```

- [ ] **Step 2: Update public/robots.txt**

```
User-agent: *
Allow: /

Sitemap: https://limcheekin.com/sitemap-index.xml
```

Note: `@astrojs/sitemap` generates `sitemap-index.xml` by default.

- [ ] **Step 3: Update public/llms.txt**

Update all URLs from `limcheekin.github.io/portfolio/` to `limcheekin.com/` (the new domain). Keep the same content structure.

- [ ] **Step 4: Verify full build**

Run: `npm run build`

Expected: Build succeeds. `dist/api/portfolio.json` and `dist/llms-full.txt` exist with correct content.

- [ ] **Step 5: Commit**

```bash
rtk git add scripts/generate-api.ts public/robots.txt public/llms.txt
rtk git commit -m "feat: add build-time API and llms-full.txt generation (fixes T6, S1)"
```

---

## Task 12: WebMCP Island (Emerging Standards)

**Files:**
- Create: `src/components/WebMCPTools.tsx`

- [ ] **Step 1: Create src/components/WebMCPTools.tsx**

```tsx
import { useEffect } from 'react';

interface PortfolioData {
  projects: Array<{ title: string; description: string; technologies: string[]; slug: string }>;
  experience: Array<{ title: string; company: string; startDate: string; endDate?: string }>;
}

interface WebMCPToolsProps {
  portfolioApiUrl: string;
  contactEmail: string;
  engineerName: string;
}

export default function WebMCPTools({ portfolioApiUrl, contactEmail, engineerName }: WebMCPToolsProps) {
  useEffect(() => {
    const nav = navigator as any;
    if (!nav.modelContext) return;

    let registered = false;

    async function register() {
      try {
        const mc = nav.modelContext;

        mc.registerTool({
          name: 'get_projects',
          description: `Get all projects by ${engineerName}. Returns project titles, descriptions, technologies, and URLs.`,
          inputSchema: { type: 'object', properties: {} },
          async execute() {
            const res = await fetch(portfolioApiUrl);
            const data: PortfolioData = await res.json();
            return { content: [{ type: 'text', text: JSON.stringify(data.projects, null, 2) }] };
          },
        });

        mc.registerTool({
          name: 'get_experience',
          description: `Get work experience history for ${engineerName}. Returns job titles, companies, and date ranges.`,
          inputSchema: { type: 'object', properties: {} },
          async execute() {
            const res = await fetch(portfolioApiUrl);
            const data: PortfolioData = await res.json();
            return { content: [{ type: 'text', text: JSON.stringify(data.experience, null, 2) }] };
          },
        });

        mc.registerTool({
          name: 'get_contact_info',
          description: `Get contact information for ${engineerName}.`,
          inputSchema: { type: 'object', properties: {} },
          async execute() {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  name: engineerName,
                  email: contactEmail,
                  github: 'https://github.com/limcheekin',
                  linkedin: 'https://linkedin.com/in/limcheekin',
                  medium: 'https://medium.com/@limcheekin',
                }, null, 2)
              }]
            };
          },
        });

        mc.registerTool({
          name: 'search_portfolio',
          description: `Search across all portfolio content (projects, articles, experience) for ${engineerName}. Returns matching items.`,
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query to match against portfolio content' }
            },
            required: ['query']
          },
          async execute(input: { query: string }) {
            const res = await fetch(portfolioApiUrl);
            const data = await res.json();
            const q = input.query.toLowerCase();
            const results = {
              projects: data.projects.filter((p: any) =>
                p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.technologies.some((t: string) => t.toLowerCase().includes(q))
              ),
              articles: data.articles.filter((a: any) =>
                a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
              ),
              experience: data.experience.filter((e: any) =>
                e.title.toLowerCase().includes(q) || e.company.toLowerCase().includes(q)
              ),
            };
            return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
          },
        });

        registered = true;
      } catch (e) {
        // WebMCP not supported in this browser — silently skip
      }
    }

    register();

    return () => {
      if (registered && nav.modelContext) {
        try {
          nav.modelContext.unregisterTool('get_projects');
          nav.modelContext.unregisterTool('get_experience');
          nav.modelContext.unregisterTool('get_contact_info');
          nav.modelContext.unregisterTool('search_portfolio');
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [portfolioApiUrl, contactEmail, engineerName]);

  return null;
}
```

- [ ] **Step 2: Add WebMCPTools to BaseLayout.astro**

Add to `BaseLayout.astro` before the closing `</body>`:

```astro
---
// Add import at top of frontmatter
import WebMCPTools from '../components/WebMCPTools.tsx';
import { ENGINEER_NAME, EMAIL_ADDRESS, SITE_URL } from '../data/site';
---

<!-- Before </body> -->
<WebMCPTools client:idle portfolioApiUrl={`${SITE_URL}/api/portfolio.json`} contactEmail={EMAIL_ADDRESS} engineerName={ENGINEER_NAME} />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds. WebMCP component bundled as a client island.

- [ ] **Step 4: Commit**

```bash
rtk git add src/components/WebMCPTools.tsx src/layouts/BaseLayout.astro
rtk git commit -m "feat: add WebMCP tools island for browser-agent discoverability"
```

---

## Task 13: Dockerfile + Nginx Config (Deployment)

**Files:**
- Create: `Dockerfile`
- Create: `nginx.conf`

- [ ] **Step 1: Create nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Trailing slash enforcement
    rewrite ^([^.]*[^/])$ $1/ permanent;

    # Try files, then directories, then 404
    location / {
        try_files $uri $uri/ /404.html;
    }

    # API endpoint
    location /api/ {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML pages — short cache
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Custom 404 page
    error_page 404 /404.html;
    location = /404.html {
        internal;
    }
}
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Verify Docker build locally (optional)**

Run: `docker build -t portfolio .`

Expected: Multi-stage build completes successfully.

- [ ] **Step 4: Commit**

```bash
rtk git add Dockerfile nginx.conf
rtk git commit -m "feat: add Dockerfile and nginx config for Coolify deployment"
```

---

## Task 14: CI Workflow Update

**Files:**
- Modify: `.github/workflows/deploy.yaml`

- [ ] **Step 1: Replace deploy.yaml with CI-only workflow**

Rename to `ci.yaml` or update in place:

```yaml
name: CI Build Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Check build output
        run: |
          test -f dist/index.html
          test -f dist/404.html
          test -f dist/api/portfolio.json
          test -f dist/llms-full.txt
          echo "Build artifacts verified"
```

- [ ] **Step 2: Commit**

```bash
rtk git rm .github/workflows/deploy.yaml
rtk git add .github/workflows/ci.yaml
rtk git commit -m "chore: replace deploy workflow with CI-only build check"
```

---

## Task 15: Cleanup — Remove Old Files

**Files:**
- Delete: `App.tsx`, `index.tsx`, `index.html`, `constants.ts`, `types.ts`, `vite.config.ts`
- Delete: `components/Header.tsx`, `components/HomePage.tsx`, `components/PortfolioPage.tsx`
- Delete: `components/InsightsPage.tsx`, `components/ConnectPage.tsx`, `components/Banner.tsx`
- Delete: `components/FixedSidebars.tsx`, `components/Layout.tsx`
- Delete: `contexts/ThemeContext.tsx`
- Update: `.gitignore` to add `.superpowers/`

- [ ] **Step 1: Delete old source files**

```bash
rtk git rm App.tsx index.tsx index.html constants.ts types.ts vite.config.ts
rtk git rm -r components/ contexts/
```

- [ ] **Step 2: Update .gitignore**

Add `.superpowers/` to `.gitignore` to exclude brainstorm session files.

- [ ] **Step 3: Final build verification**

Run: `npm run build`

Expected: Clean build with only Astro source files. No references to old React SPA files.

- [ ] **Step 4: Verify dev server**

Run: `npm run dev`

Expected: All pages load correctly, navigation works, Banner carousel rotates, mobile menu toggles, contact form renders.

- [ ] **Step 5: Commit**

```bash
rtk git add -A
rtk git commit -m "chore: remove old React SPA files (Vite, React Router, ThemeContext)"
```

---

## Post-Migration Verification

After all tasks are complete, verify the following against the audit dimensions:

- [ ] **S2 check:** View source of `dist/index.html` — content is in the HTML, not behind `<div id="root">`
- [ ] **T1 check:** `curl localhost:PORT/about/` returns full HTML
- [ ] **T2 check:** Contact form has `action`, `method="POST"`, proper `<label>` and `<input>` elements
- [ ] **T3 check:** `curl localhost:PORT/nonexistent-page/` returns 404 page with navigation links
- [ ] **T6 check:** `curl localhost:PORT/api/portfolio.json` returns structured JSON
- [ ] **S1 check:** `dist/llms-full.txt` exists with all content
- [ ] **S4 check:** Each page has appropriate JSON-LD in `<head>`
- [ ] **WebMCP check:** Browser console `navigator.modelContextTesting?.listTools()` returns 4 tools
