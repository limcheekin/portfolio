# VoltAgent Re-skin Design

**Status:** Approved
**Date:** 2026-04-15
**Scope:** Visual re-skin of the portfolio site to adopt the VoltAgent-inspired design system from `DESIGN.md`. Direction A — token-swap + typography. Content, layout, and component APIs unchanged.

## Context

The portfolio currently uses a Brittany-Chiang-inspired dark theme (deep navy `#0a192f` + mint green `#64ffda`). `DESIGN.md` defines a VoltAgent-inspired system: near-pure-black (`#050507`) with emerald signal green (`#00d992`), warm-neutral borders (`#3d3a39`), dual-font display stack (system-ui headings, Inter body, SFMono code), and compressed heading rhythm.

Three directions were presented (Re-skin, Command Center, Agent OS). **Direction A — Re-skin** was chosen to adopt the visual system with minimal surface-area change.

## Goals

- Adopt the VoltAgent palette, type stack, and focus treatment site-wide.
- Preserve every piece of user-visible content, every page route, and every component API.
- Keep the spacing scale, animation timings, and elevation treatment intact.
- Touch as few files as possible. Token names stay; only token values change so existing Tailwind class usage auto-updates.

## Non-Goals

- Pulsing logo glow, terminal-chrome cards, pill tech tags (Direction B motifs).
- Hero terminal, git-log experience, package.json skills (Direction C motifs).
- Light-mode toggle. The site is dark-only and stays that way.
- New semantic colors (success/warning/info/danger) beyond one specific use for form error text.
- Layout changes, new sections, content edits, or schema changes.

## Design

### Color tokens (`tailwind.config.mjs`)

Token names are preserved; only values change. This means no `.astro` file needs to update its class usage for colors.

| Token | Old value | New value | Role (per DESIGN.md) |
|---|---|---|---|
| `navy` | `#0a192f` | `#050507` | Abyss Black — page canvas |
| `light-navy` | `#112240` | `#101010` | Carbon Surface — cards, buttons |
| `lightest-navy` | `#233554` | `#3d3a39` | Warm Charcoal — borders |
| `slate-text` | `#8892b0` | `#8b949e` | Steel Slate — tertiary text |
| `light-slate` | `#a8b2d1` | `#b8b3b0` | Warm Parchment — secondary text |
| `lightest-slate` | `#ccd6f6` | `#f2f2f2` | Snow White — primary text |
| `white-text` | `#e6f1ff` | `#ffffff` | Pure White — max-emphasis |
| `green-accent` | `#64ffda` | `#00d992` | Emerald Signal Green — accent |
| `green-tint` | `rgba(100,255,218,0.1)` | `rgba(0,217,146,0.1)` | Tinted hover/focus |

**New tokens added:** None. VoltAgent Mint (`#2fd6a1`) is reserved by DESIGN.md for CTA button text, but the current `Button` component uses `text-green-accent` which will resolve to Signal Green on the Carbon Surface background at 7.5:1 contrast — no readability gap to close. Skipping Mint avoids a speculative token.

Semantic colors are intentionally not added to the Tailwind palette. The only semantic need today is form-error red, handled with an arbitrary value (see §Tailwind-default color leaks to fix).

### Typography (`tailwind.config.mjs`)

Extend `fontFamily` with a new `display` stack:

```js
fontFamily: {
  display: [
    'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Ubuntu',
    'Cantarell', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'
  ],
  sans: [
    'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
    'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"',
    'Arial', '"Noto Sans"', 'sans-serif'
  ],
  mono: [
    'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas',
    '"Liberation Mono"', '"Courier New"', 'monospace'
  ],
},
```

The `sans` and `mono` stacks are unchanged. Inter stays as body font; SFMono stays as code font.

### Compressed heading rhythm (`src/styles/global.css`)

Global rules that apply whenever `font-display` is used on headings:

```css
body {
  font-feature-settings: "calt", "rlig";
}
h1.font-display { line-height: 1.0;  letter-spacing: -0.065em; }
h2.font-display { line-height: 1.11; letter-spacing: -0.025em; }
```

Values are taken directly from the DESIGN.md hierarchy table (Display -0.65px at 60px ≈ -0.011em; Section heading -0.9px at 36px = -0.025em). The Display row is applied more aggressively to the hero H1 because compressed hero type is a signature trait of the VoltAgent look.

### Where `font-display` is applied

- `src/pages/index.astro`: hero `<h1>` (name) and hero `<h2>` (tagline) — add `font-display` to existing classes.
- `src/components/SectionWrapper.astro`: section `<h2>` — add `font-display`.

No other headings are touched. Article titles, project titles, and experience titles keep their current Inter-based treatment because DESIGN.md's h3/h4 rows are not as tightly specified.

### `global.css` color updates

Replace hardcoded hexes that duplicate token values:

- `html` `background-color: #0a192f` → `#050507`
- `body` `color: #ccd6f6` → `#f2f2f2`
- Scrollbar track `#0a192f` → `#050507`
- Scrollbar thumb `#233554` → `#3d3a39`
- Scrollbar thumb hover `#a8b2d1` → `#b8b3b0`
- `*:focus-visible` outline color `#64ffda` → `#00d992`
- `.custom-bullet::before` color `#64ffda` → `#00d992`

### Tailwind-default color leaks to fix

Three locations use Tailwind default palette classes that do NOT resolve to our custom tokens. Each must be swapped to use the custom tokens or an arbitrary-value hex so the re-skin reaches them.

**`src/components/Banner.tsx`:**

| Line | Old | New | Why |
|---|---|---|---|
| 45 | `text-slate-300` | `text-light-slate` | Secondary body color — maps to Warm Parchment `#b8b3b0` |
| 48 | `bg-blue-500/40` | `bg-green-accent/60` | Underline accent; DESIGN.md: green is the sole chromatic energy |
| 52 | `text-emerald-400` | `text-green-accent` | Primary value-prop accent — Signal Green |
| 56 | `text-slate-300` | `text-light-slate` | Secondary body color |
| 58 | `text-rose-400` | `text-[#fb565b]` | Danger Coral per DESIGN.md — no Tailwind palette token matches, use arbitrary value |

**`src/components/ContactForm.astro`:**

| Lines | Old | New |
|---|---|---|
| 25, 40, 54 | `text-red-400` | `text-[#fb565b]` |

That is the complete list of Tailwind-default palette leaks in the codebase (verified via grep). No other files need color-class edits.

### Behavioral notes

- **About photo frame:** Keeps the `border-2 border-green-accent` treatment with `translate-x-3 translate-y-3` offset. The frame will now appear in Signal Green (`#00d992`) against Abyss Black — higher contrast than before, consistent with DESIGN.md's "green as power-on" principle.
- **Project card elevation:** Cards use `bg-light-navy` which becomes Carbon Surface `#101010`. The existing `border-lightest-navy` treatment becomes Warm Charcoal `#3d3a39`, satisfying DESIGN.md's "Don't skip the warm-gray border system." No additional border treatment needed.
- **Experience timeline:** Hover border and dot fill automatically remap to Signal Green via `green-accent` token.
- **Button focus ring:** `ring-green-accent/70` and `ring-offset-navy` auto-update.
- **Banner Coral italic "negative" text:** Uses Danger Coral `#fb565b` which DESIGN.md reserves for semantic danger states. This is a mild abuse of semantics (it's rhetorical, not error), but it retains the visual rhythm of the rotator and no other color in the palette carries the same "warning" weight. Accepted.

## Files Touched

1. `tailwind.config.mjs` — token values + new `display` font stack.
2. `src/styles/global.css` — scrollbar, focus, bullet, OpenType features, compressed-heading rules.
3. `src/components/Banner.tsx` — 5 color-class swaps.
4. `src/components/ContactForm.astro` — 3 error-span color swaps.
5. `src/pages/index.astro` — add `font-display` to hero H1 and H2.
6. `src/components/SectionWrapper.astro` — add `font-display` to section H2.

**No new files. No deleted files. No component API changes.**

## Verification Plan

Manual visual verification in `npm run dev` of every route:

- `/` (home with all sections)
- `/about/`
- `/projects/` and one `/projects/[slug]/`
- `/insights/` and one `/insights/[slug]/`
- `/contact/`
- `/404`

For each page confirm:

- No `#0a192f`, `#64ffda`, `#233554`, or other old-palette hexes visible (spot check via DevTools).
- Focus outlines are signal-green `#00d992` when tabbing.
- Hero name and tagline render in system-ui with tight line-height and negative letter-spacing.
- Section H2s render in system-ui with compressed rhythm.
- Banner rotator value props contrast cleanly against Abyss Black.
- Contact form inline error text renders in Danger Coral `#fb565b` (force a blank-submit to test).
- Scrollbar track and thumb use the new warm-neutral colors.

Type-check via `npm run build` (Astro performs TS checks). No automated visual regression or unit tests are configured and none are added by this work.

## Risks & Mitigations

- **Contrast shift on text:** Moving from `#ccd6f6` (bright slate) to `#f2f2f2` (Snow White) on a darker canvas (`#0a192f` → `#050507`) increases contrast. No accessibility regression expected; both pairs exceed WCAG AA.
- **Compressed line-heights may clip descenders** on the hero H1 on some platforms — `line-height: 1.0` with `system-ui` rendering SF Pro/Segoe UI should be fine, but watch for trimmed glyphs during verification. Fallback: bump to `1.02`.
- **Banner Coral `#fb565b` vs Tailwind rose:** The old `text-rose-400` (`#fb7185`) was softer/pinker. The new Danger Coral is more saturated red. If the new tone feels too alarmist in the rotator, step down to `#fd9c9f` (Danger Rose per DESIGN.md). Decide during verification.

## Open Questions

None at spec-approval time. All decisions recorded above.
