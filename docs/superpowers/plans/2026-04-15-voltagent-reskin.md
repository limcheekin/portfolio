# VoltAgent Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the portfolio site to the VoltAgent-inspired visual system (Abyss Black + Signal Green + Warm Charcoal + system-ui display) without changing layout, content, or component APIs.

**Architecture:** Token-swap strategy. Tailwind custom color tokens keep their names (`navy`, `green-accent`, etc.) but have new hex values, so no `.astro` file needs to touch its class list for colors. A new `display` font-family is added to Tailwind and applied only to hero headings and section H2s. Four files get targeted edits for Tailwind-default palette leaks.

**Tech Stack:** Astro 5, React 19 islands, Tailwind CSS 3 (with real `tailwind.config.mjs`), TypeScript. No test runner configured — verification is manual in `npm run dev` plus `npm run build` for type checks.

**Reference spec:** `docs/superpowers/specs/2026-04-15-voltagent-reskin-design.md`

---

## Note on Verification Style

This codebase has no automated test suite. Each task ends with:

1. A **visual verification step** — run `npm run dev`, open the affected page, confirm the described outcome with DevTools open.
2. A **commit step** — conventional commit message, small scope.

A final `npm run build` in Task 7 catches any TypeScript breakage.

---

## Task 1: Swap Tailwind color tokens and add `display` font family

**Files:**
- Modify: `tailwind.config.mjs`

- [ ] **Step 1: Replace color token values**

Open `tailwind.config.mjs`. Inside `theme.extend.colors`, replace the object with the exact block below. Token names stay the same; only hex values change.

```js
colors: {
  'navy': '#050507',
  'light-navy': '#101010',
  'lightest-navy': '#3d3a39',
  'slate-text': '#8b949e',
  'light-slate': '#b8b3b0',
  'lightest-slate': '#f2f2f2',
  'white-text': '#ffffff',
  'green-accent': '#00d992',
  'green-tint': 'rgba(0, 217, 146, 0.1)',
},
```

- [ ] **Step 2: Add `display` font family**

Inside `theme.extend.fontFamily`, add a new `display` key ABOVE the existing `sans` key. The final `fontFamily` object should read:

```js
fontFamily: {
  display: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Ubuntu', 'Cantarell', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
  sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
  mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
},
```

- [ ] **Step 3: Verify Tailwind config is valid**

Run: `npm run build`
Expected: build completes without Tailwind-config errors. If it fails, inspect the error — most likely a missing comma or bad quote in the font array.

- [ ] **Step 4: Visual verification**

Run: `npm run dev` and open `http://localhost:4321/` in a browser.
Expected: the page has already partially re-themed — background is now near-black (`#050507`), green accents are Signal Green (`#00d992`). Some text (like the hero name rendered as Inter not system-ui) still looks like the old font; that's fixed in Task 5. **Do not panic if headings still look the same — their `font-display` class doesn't exist yet.**

- [ ] **Step 5: Commit**

```bash
rtk git add tailwind.config.mjs
rtk git commit -m "feat(theme): swap color tokens to VoltAgent palette and add display font stack"
```

---

## Task 2: Rewrite `global.css` for new palette, compressed heading rhythm, and OpenType features

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace the entire file contents**

Overwrite `src/styles/global.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
  background-color: #050507;
}

body {
  font-family: 'Inter', sans-serif;
  color: #f2f2f2;
  font-feature-settings: "calt", "rlig";
}

/* Compressed heading rhythm (VoltAgent) — applies only to headings
   that opt in with .font-display. Uses em-based tracking so it
   scales with font size. */
h1.font-display { line-height: 1.0;  letter-spacing: -0.065em; }
h2.font-display { line-height: 1.11; letter-spacing: -0.025em; }

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #050507;
}

::-webkit-scrollbar-thumb {
  background: #3d3a39;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b8b3b0;
}

*:focus-visible {
  outline: 2px dashed #00d992;
  outline-offset: 2px;
}

.custom-bullet {
  position: relative;
  padding-left: 1.75rem;
}

.custom-bullet::before {
  content: "▹";
  position: absolute;
  left: 0;
  color: #00d992;
  font-size: 1.125rem;
  line-height: 1.75;
}
```

- [ ] **Step 2: Visual verification**

`npm run dev` should hot-reload. Open `http://localhost:4321/` and:
- Scroll: track and thumb now use Warm Charcoal / Warm Parchment greys.
- Press Tab to cycle focus through links: outline is Signal Green dashed.
- Hover skills list (custom bullets `▹` on `/about/` or the home About section): bullets are Signal Green.

- [ ] **Step 3: Commit**

```bash
rtk git add src/styles/global.css
rtk git commit -m "feat(theme): update global.css to new palette and add compressed heading rhythm"
```

---

## Task 3: Fix Tailwind-default color leaks in `Banner.tsx`

**Files:**
- Modify: `src/components/Banner.tsx`

The rotating value-props banner uses Tailwind's default `slate-300`, `emerald-400`, `rose-400`, `blue-500` classes that do not resolve to our custom tokens and would leak the old palette into the new theme.

- [ ] **Step 1: Apply all five color-class swaps**

Edit `src/components/Banner.tsx`. Make these five exact replacements inside the `return (...)` block:

1. Line 45 — change

   ```tsx
   <div className="text-2xl md:text-3xl lg:text-4xl text-slate-300">
   ```

   to

   ```tsx
   <div className="text-2xl md:text-3xl lg:text-4xl text-light-slate">
   ```

2. Line 48 — change

   ```tsx
   <div className="absolute -bottom-1 left-0 w-full h-px bg-blue-500/40" />
   ```

   to

   ```tsx
   <div className="absolute -bottom-1 left-0 w-full h-px bg-green-accent/60" />
   ```

3. Line 52 — change

   ```tsx
   <div className="text-3xl md:text-4xl lg:text-5xl text-emerald-400 py-0">
   ```

   to

   ```tsx
   <div className="text-3xl md:text-4xl lg:text-5xl text-green-accent py-0">
   ```

4. Line 56 — change

   ```tsx
   <div className="text-2xl md:text-3xl lg:text-4xl text-slate-300 flex items-baseline flex-wrap gap-x-3">
   ```

   to

   ```tsx
   <div className="text-2xl md:text-3xl lg:text-4xl text-light-slate flex items-baseline flex-wrap gap-x-3">
   ```

5. Line 58 — change

   ```tsx
   <span className="text-rose-400 font-light italic opacity-95">
   ```

   to

   ```tsx
   <span className="text-[#fb565b] font-light italic opacity-95">
   ```

- [ ] **Step 2: Visual verification**

`npm run dev` hot-reloads. Open `http://localhost:4321/` and watch the hero Banner for a full rotation cycle (≈7 seconds each, 6 props total):
- "I help X" and "without Y" lines render in Warm Parchment (`#b8b3b0`).
- The target phrase (e.g., "privacy-conscious enterprises") has a thin Signal Green underline at 60% opacity.
- The benefit sentence (big line) renders in Signal Green (`#00d992`).
- The negative phrase renders in Danger Coral (`#fb565b`), italic.
- Open DevTools → inspect → confirm `text-[#fb565b]` applied the literal hex (Tailwind JIT produces an arbitrary-value class).

- [ ] **Step 3: Commit**

```bash
rtk git add src/components/Banner.tsx
rtk git commit -m "fix(theme): replace Tailwind-default palette classes in Banner with custom tokens"
```

---

## Task 4: Fix Tailwind-default color leaks in `ContactForm.astro`

**Files:**
- Modify: `src/components/ContactForm.astro`

The three inline error spans use `text-red-400`. Per spec, replace with Danger Coral `#fb565b`.

- [ ] **Step 1: Swap the three error-span classes**

Each replacement is the same substring change. Apply it three times (once per error span at lines 25, 40, 54). Use your editor's find-and-replace with match-case ON:

- Find: `font-mono text-xs text-red-400 mt-1`
- Replace with: `font-mono text-xs text-[#fb565b] mt-1`

After editing, lines 25, 40, and 54 should each read:

```astro
    <span id="contact-name-error" role="alert" class="hidden font-mono text-xs text-[#fb565b] mt-1"></span>
```

(with the matching `id` for email and message rows).

- [ ] **Step 2: Visual verification**

`npm run dev`. Open `http://localhost:4321/contact/`. Click the "Send Message" submit button without filling any field. Native validation messages appear; watch the inline error spans beneath each field — they should render in Danger Coral `#fb565b`. Verify via DevTools that the arbitrary-value class resolved.

- [ ] **Step 3: Commit**

```bash
rtk git add src/components/ContactForm.astro
rtk git commit -m "fix(theme): use Danger Coral for contact form error text"
```

---

## Task 5: Apply `font-display` to hero name and tagline in `index.astro`

**Files:**
- Modify: `src/pages/index.astro` (hero section, lines 185–206)

The hero H1 (name) and H2 (tagline) need the compressed system-ui rhythm defined in `global.css`.

- [ ] **Step 1: Add `font-display` to the hero H1**

In `src/pages/index.astro`, find the line starting with:

```astro
<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-lightest-slate mb-3 md:mb-4 animate-fadeInUp"
```

Change the `class` attribute to add `font-display` after `font-bold`:

```astro
<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-lightest-slate mb-3 md:mb-4 animate-fadeInUp"
```

- [ ] **Step 2: Add `font-display` to the hero H2**

Find the next line that begins:

```astro
<h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-text mb-6 md:mb-8 animate-fadeInUp"
```

Change to:

```astro
<h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-text mb-6 md:mb-8 animate-fadeInUp"
```

- [ ] **Step 3: Visual verification**

`npm run dev`. Open `http://localhost:4321/`. The hero name "Lim Chee Kin." and tagline "AI Engineer & Solution Architect." should now render in system-ui (Segoe UI on Windows, SF Pro on macOS) with visibly compressed line-height and negative letter-spacing — text feels denser and more technical than before. Inspect via DevTools → Computed styles:
- `font-family` includes `system-ui, -apple-system, "Segoe UI"`.
- `line-height` reads `normal` (set by Tailwind's `font-bold`) overridden by the `h1.font-display { line-height: 1.0 }` rule from `global.css`.
- `letter-spacing` reads `-0.065em` (on the H1).

If CSS specificity fights you: the rules `h1.font-display { ... }` and `h2.font-display { ... }` are element+class selectors, so they should win against Tailwind utility classes. If they don't take effect, confirm the file changes saved and hard-refresh the browser.

- [ ] **Step 4: Commit**

```bash
rtk git add src/pages/index.astro
rtk git commit -m "style(theme): apply font-display to hero headings"
```

---

## Task 6: Apply `font-display` to section H2 in `SectionWrapper.astro`

**Files:**
- Modify: `src/components/SectionWrapper.astro`

`SectionWrapper` renders every numbered section heading ("01. About Me", "02. Some Things I've Built", etc.) across the home page. Applying `font-display` there reaches all of them with one edit.

- [ ] **Step 1: Add `font-display` to the section H2**

In `src/components/SectionWrapper.astro`, find the H2 (line 15):

```astro
<h2 id={id} class="flex items-center text-2xl md:text-3xl font-semibold text-lightest-slate mb-10 md:mb-12 whitespace-nowrap relative w-full">
```

Add `font-display` right after `flex items-center`:

```astro
<h2 id={id} class="flex items-center font-display text-2xl md:text-3xl font-semibold text-lightest-slate mb-10 md:mb-12 whitespace-nowrap relative w-full">
```

- [ ] **Step 2: Visual verification**

`npm run dev`. Open `http://localhost:4321/` and scroll through all four sections. Section titles "01. About Me", "02. Some Things I've Built", "03. Writing", and "04. Get In Touch" (or the configured subtext) should render in system-ui, with tighter rhythm than the surrounding Inter body text. The dividing `<span class="block h-px bg-lightest-navy/30">` line should now appear in Warm Charcoal.

- [ ] **Step 3: Commit**

```bash
rtk git add src/components/SectionWrapper.astro
rtk git commit -m "style(theme): apply font-display to numbered section headings"
```

---

## Task 7: Full-route verification pass

**Files:** None — verification only.

- [ ] **Step 1: Run dev server and walk every route**

Run: `npm run dev` and visit each URL below. On each, confirm no old-palette artifacts remain. Keep DevTools Elements inspector open and spot-check computed styles.

Checklist per route (same for all):

- [ ] Background is Abyss Black (`#050507`) — no navy `#0a192f`.
- [ ] Primary text is Snow White (`#f2f2f2`) — no `#ccd6f6`.
- [ ] Green accents are Signal Green (`#00d992`) — no mint `#64ffda`.
- [ ] Borders are Warm Charcoal (`#3d3a39`) — no `#233554`.
- [ ] Tab through interactive elements — focus outline is Signal Green dashed.
- [ ] Scrollbar track/thumb use new warm-neutral greys.

Routes:

- [ ] `http://localhost:4321/`
- [ ] `http://localhost:4321/about/`
- [ ] `http://localhost:4321/projects/`
- [ ] One `http://localhost:4321/projects/<slug>/` — pick any featured project from the home page
- [ ] `http://localhost:4321/insights/`
- [ ] One `http://localhost:4321/insights/<slug>/` — pick any article from the home page Writing section
- [ ] `http://localhost:4321/contact/`
- [ ] `http://localhost:4321/nonexistent-route` — should render the 404 page

- [ ] **Step 2: Component-level verification**

Back on `/`:

- [ ] Hero: name + tagline use system-ui (verify in DevTools Computed → `font-family`).
- [ ] Hero Banner rotator: cycle through at least 3 props; target underline is signal-green, benefit text is Signal Green, negative text is Danger Coral italic.
- [ ] About section: the professional photo has the signal-green offset frame; hover removes the overlay and desaturation filter; grayscale transitions smoothly.
- [ ] About skills grid: `▹` bullets render in Signal Green.
- [ ] Experience timeline: hover a row — left vertical bar and dot border transition to Signal Green, dot fills with Signal Green, title gains Signal Green.
- [ ] Experience tech tags: Signal Green text on `green-tint` background (tinted signal green at 10%).
- [ ] Projects section: featured project cards show Carbon Surface (`#101010`) description box; tech list uses mono slate text; GitHub/external-link icons transition to Signal Green on hover.
- [ ] Writing section: article hover state — card background transitions to Carbon Surface, title transitions to Signal Green.
- [ ] Contact section: CTA button border + text in Signal Green; hover fills with Signal Green tint.
- [ ] Footer: single muted link; transitions to Signal Green on hover.
- [ ] Resize window below 768px: hamburger menu appears; opens as a Carbon Surface drawer with Signal Green `0N.` labels.

- [ ] **Step 3: TypeScript + production-build verification**

Run: `npm run build`
Expected: Astro build succeeds. TypeScript checks pass. `dist/` is populated.

If the build fails, the most likely culprit is a syntax error in `tailwind.config.mjs` from Task 1 — reopen and verify brackets/commas.

- [ ] **Step 4: Grep for lingering old-palette references**

Run (in the repo root):

```bash
rtk grep -n -E "#0a192f|#112240|#233554|#8892b0|#a8b2d1|#ccd6f6|#e6f1ff|#64ffda" src
```

Expected output: none (empty result). Any hits are leftovers from the re-skin and must be cleaned up before declaring the work done.

Run:

```bash
rtk grep -n -E "text-slate-[0-9]|text-emerald-[0-9]|text-rose-[0-9]|text-red-[0-9]|bg-blue-[0-9]" src
```

Expected output: none (empty result). If any remain, they are new Tailwind-default palette leaks that need to be mapped to custom tokens.

- [ ] **Step 5: Final commit (if any cleanups were needed) or declare done**

If any cleanups were required from Step 4:

```bash
rtk git add -u
rtk git commit -m "chore(theme): clean up remaining old-palette references"
```

Otherwise, the re-skin is complete.

---

## Summary of commits (expected sequence)

1. `feat(theme): swap color tokens to VoltAgent palette and add display font stack`
2. `feat(theme): update global.css to new palette and add compressed heading rhythm`
3. `fix(theme): replace Tailwind-default palette classes in Banner with custom tokens`
4. `fix(theme): use Danger Coral for contact form error text`
5. `style(theme): apply font-display to hero headings`
6. `style(theme): apply font-display to numbered section headings`
7. (optional) `chore(theme): clean up remaining old-palette references`

Each commit is self-contained and leaves the site in a working state.
