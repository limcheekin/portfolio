---
name: Lim Chee Kin, Portfolio
description: Dark, agent-first portfolio of an AI Solutions Architect; proof of shipped agents over claims.
colors:
  navy: "#050507"
  light-navy: "#101010"
  lightest-navy: "#3d3a39"
  slate-text: "#8b949e"
  light-slate: "#b8b3b0"
  lightest-slate: "#f2f2f2"
  white-text: "#ffffff"
  green-accent: "#00d992"
  green-tint: "rgba(0, 217, 146, 0.1)"
  danger: "#fb565b"
  amber: "#f5a524"
  sky: "#38bdf8"
  well: "#09090b"
  card: "#0e0e10"
  graphite: "#141417"
  light-graphite: "#1c1c20"
  edge: "#26262a"
  edge-strong: "#2e2e33"
  green-deep: "#0f2a20"
  green-dim: "#1d4d3a"
  green-pale: "#c9f5e4"
  sky-deep: "#0c1f2a"
  sky-dim: "#1e3a4a"
  sky-pale: "#cbeeff"
  print-ink: "#16161a"
  print-muted: "#5b6068"
  print-rule: "#d9d9de"
  print-paper: "#ffffff"
  print-green: "#047857"
  print-amber: "#b45309"
  print-coral: "#d4323a"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif"
    fontSize: "clamp(36px, 5vw, 52px)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 48px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 4.5vw, 48px)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.625
    fontFeature: "\"calt\", \"rlig\""
  body-lead:
    fontFamily: "Inter Variable, Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label-caps:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  chip: "5px"
  frame: "10px"
  panel: "12px"
  card: "16px"
  full: "9999px"
spacing:
  gutter-base: "24px"
  gutter-sm: "40px"
  gutter-md: "64px"
  gutter-lg: "96px"
  card-pad: "22px"
  page-top: "128px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.green-accent}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-primary-hover:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.green-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.light-slate}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-solid:
    backgroundColor: "{colors.green-accent}"
    textColor: "{colors.navy}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-magnet:
    backgroundColor: "{colors.green-accent}"
    textColor: "{colors.navy}"
    rounded: "{rounded.full}"
    padding: "20px 34px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.light-slate}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  card-work:
    backgroundColor: "{colors.card}"
    textColor: "{colors.lightest-slate}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
    width: "min(360px, 80vw)"
  card-project:
    backgroundColor: "{colors.card}"
    textColor: "{colors.lightest-slate}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  console:
    backgroundColor: "{colors.well}"
    textColor: "{colors.light-slate}"
    rounded: "{rounded.panel}"
  input-field:
    backgroundColor: "{colors.card}"
    textColor: "{colors.lightest-slate}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  nav-link:
    textColor: "{colors.light-slate}"
    typography: "{typography.label}"
    padding: "8px 10px"
  nav-link-active:
    textColor: "{colors.green-accent}"
---

# Design System: Lim Chee Kin, Portfolio

## Overview

**Creative North Star: "The Running Agent"**

The site is a near-black workspace where the work itself is the picture: a console replays real agent runs, each Work card carries a code-drawn illustration of the flow it automated, and the career rail fills as you scroll. Everything is set on a single carbon canvas (`navy`) with stepped dark surfaces for depth, one signal colour for emphasis and action, and a second colour reserved for open-source work. Mono type carries the machine voice (labels, dates, stacks, nav, buttons); Inter carries the human voice (headings and prose).

Density is calm. Each home section holds one idea, generous vertical room separates sections, and motion supports meaning: one thing moves at a time, and under reduced motion nothing travels. The palette's lineage is VoltAgent's dark theme; only the core colour values were carried over.

Dark only. There is no light theme and no theme toggle.

**Key Characteristics:**
- Carbon canvas with five stepped near-black surfaces (`well`, `card`, `graphite`, `light-graphite`, `edge`) instead of shadows for structure.
- One signal accent, Emerald Signal Green, for emphasis, links, active state and primary action.
- Sky marks open-source work only; green marks everything else.
- Mono labels and controls, Inter headings and prose, tight negative tracking on headings.
- Soft-cornered cards (16px) and small-radius controls (4px).
- Transform and opacity motion only, with a full reduced-motion branch.

## Colors

A warm-neutral near-black system with one green signal and one sky marker.

### Primary
- **Emerald Signal Green** (`green-accent`): links, active nav, section numbers, the hero headline's accent phrase, primary buttons (outline and solid), the Work progress bar, the career rail fill and dots, focus outlines, list markers in prose. Also the source of every green glow and tint.
- **Signal Tint** (`green-tint`, green at 10%): hover fill of outline buttons and the logo mark.

### Secondary
- **Open-Source Sky** (`sky`): the kind label, hover border, title hover and active glow of open-source project cards, plus the open-source illustration family (`sky-deep` bubble fill, `sky-dim` bubble border, `sky-pale` bubble text). Never used for anything that is not open-source work.

### Tertiary
- **Enterprise Illustration Greens** (`green-deep` / `green-dim` / `green-pale`): bubble fill, border and text inside enterprise Work card illustrations. Illustration-only.
- **Danger Coral** (`danger`): form validation (invalid field border, error text) and the FIRE / DO NOT BUILD verdict; in slide decks, a failed step (see Slide Decks).

### Neutral
- **Abyss Black** (`navy`): page canvas, scrollbar track, text on solid green buttons, the inner fill of career dots.
- **Instrument Well** (`well`): recessed panels: the hero console and the illustration frame inside Work cards.
- **Card Carbon** (`card`): cards, the mobile drawer, form fields, the contact success panel; chips and nodes inside illustrations.
- **Graphite** (`graphite`): the top border that divides home sections; paper shapes in illustrations.
- **Hairline Graphite** (`light-graphite`): list row dividers, console title bar rule, the progress track and career rail, illustration frame border, the dot-pattern dots.
- **Edge** (`edge`): borders of cards, console, chips, inputs, the drawer; console window dots; illustration wires.
- **Strong Edge** (`edge-strong`): illustration outlines and text placeholders (the `shadow-doc-lines` lines).
- **Warm Charcoal** (`lightest-navy`): scrollbar thumb, the secondary hero button border, pending career dots.
- **Steel Slate** (`slate-text`): supporting prose, dates, metadata, stacks, footer, breadcrumb trail.
- **Warm Parchment** (`light-slate`): secondary text: taglines, nav links at rest, chips, form labels, console log lines.
- **Snow White** (`lightest-slate`): headings, titles and default body colour.
- **Pure White** (`white-text`): bold terms in a finished console run only.
- **Carbon Surface** (`light-navy`): defined in the palette; not used by current components.

### Portfolio tokens

Source of truth: `src/lib/palette.mjs`, read by `tailwind.config.mjs` (and imported directly by canvas code such as `DotGrid`). Components use these Tailwind names, never raw hex or `rgba()`; `palette.mjs` exports a `rgba(hex, alpha)` helper for the config and canvas code.

| Token | Value | Role |
|---|---|---|
| `navy` | `#050507` | Page canvas |
| `light-navy` | `#101010` | Reserved surface (unused) |
| `lightest-navy` | `#3d3a39` | Scrollbar thumb, secondary button border, pending career dots |
| `slate-text` | `#8b949e` | Supporting text, metadata |
| `light-slate` | `#b8b3b0` | Secondary text, nav at rest, chips, labels |
| `lightest-slate` | `#f2f2f2` | Headings, body default |
| `white-text` | `#ffffff` | Bold terms in a finished console run |
| `green-accent` | `#00d992` | The signal: emphasis, links, active, primary action, focus |
| `green-tint` | `green-accent` at 10% (Tailwind config) | Outline button and logo hover fill |
| `danger` | `#fb565b` | Form errors and the FIRE / DO NOT BUILD verdict; a failed step in slide decks |
| `amber` | `#f5a524` | The TRAIN verdict; a retried step in slide decks |
| `sky` | `#38bdf8` | Open-source work only (labels, glow, illustrations) |
| `well` | `#09090b` | Recessed panels: hero console, Work illustration frame |
| `card` | `#0e0e10` | Card surface, drawer, inputs; chips and nodes in illustrations |
| `graphite` | `#141417` | Section dividers; paper shapes in illustrations |
| `light-graphite` | `#1c1c20` | Hairlines, progress and career rails, chat bubbles |
| `edge` | `#26262a` | Card, console, chip and input borders; wires |
| `edge-strong` | `#2e2e33` | Illustration outlines and text placeholders |
| `green-deep` / `green-dim` / `green-pale` | `#0f2a20` / `#1d4d3a` / `#c9f5e4` | Enterprise illustration bubble fill / border / text |
| `sky-deep` / `sky-dim` / `sky-pale` | `#0c1f2a` / `#1e3a4a` / `#cbeeff` | Open-source illustration bubble fill / border / text |
| `print-ink` / `print-muted` / `print-rule` / `print-paper` | `#16161a` / `#5b6068` / `#d9d9de` / `#ffffff` | HIRE check PDF only (light, for print): text, secondary text, hairlines, paper |
| `print-green` / `print-amber` / `print-coral` | `#047857` / `#b45309` / `#d4323a` | HIRE check PDF verdict inks (HIRE / TRAIN / DO NOT BUILD or FIRE), darkened to read on white |

**Shadows** (`boxShadow` in `tailwind.config.mjs`, built from the palette):

| Token | Value | Role |
|---|---|---|
| `shadow-console` | 1px `green-accent` 6% ring, `0 30px 80px` black 60%, 80px `green-accent` 8% glow | Hero agent console |
| `shadow-glow-green` | `0 0 60px` `green-accent` 6% | Active enterprise Work card (on its fading overlay) |
| `shadow-glow-sky` | `0 0 60px` `sky` 6% | Active open-source Work card |
| `shadow-halo` | `0 0 0 4px` `green-accent` 12% | Career and experience timeline dots |
| `shadow-magnet` | `0 10px 40px` `green-accent` 25% | Contact magnet button |
| `shadow-scan` | `0 0 12px` `green-accent` | Scan line glow in enterprise illustrations |
| `shadow-spark` | `0 0 10px` `sky` | Spark glow in open-source illustrations |
| `shadow-doc-lines` | three `edge-strong` hard lines at 9/18/27px | Text lines on a document shape in illustrations |

**Gradients** (`backgroundImage`):

| Token | Value | Role |
|---|---|---|
| `bg-row-tint` | 90deg `green-accent` 6% to transparent at 70% | Article row hover tint (fades in by opacity) |
| `bg-contact-glow` | radial `green-accent` 10% to transparent at 60% | Glow behind the home Contact headline |
| `bg-dot-pattern` | 1px `light-graphite` dots (sized 14px) | Work illustration frame background |

### Named Rules
**The Sky Is Open Source Rule.** `sky` and its `sky-*` tints mark open-source work and nothing else. Enterprise work, navigation, links and actions are green. The accent for a project comes from `PROJECT_KIND_INFO[kind].accent`, never chosen by hand.

**The Tokens Only Rule.** Components use Tailwind colour, shadow and gradient tokens from `palette.mjs`. No raw hex or `rgba()` in components; a new colour is added to `palette.mjs` and this section first.

**The One Signal Rule.** Green is the only emphasis colour in the interface. It marks the thing to look at or press; it is never a large surface fill except the two solid action buttons.

## Typography

**Display Font:** system-ui stack (hero headline only)
**Body Font:** Inter Variable (self-hosted via `@fontsource-variable/inter`, latin subset preloaded in `BaseLayout`), falling back to Inter and the system sans stack
**Label/Mono Font:** SFMono-Regular, with Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace

**Character:** Inter carries headings and prose with tight negative tracking; mono carries everything the machine would say: labels, dates, stacks, nav, buttons, the console. Body text enables `"calt", "rlig"`.

### Hierarchy
- **Display** (700, 36px / 48px / 52px at base / sm / lg, line-height 1.04, -0.015em): the home hero `h1` only. Its accent phrase is green, set upright (an `em` with italics removed). SplitText line masks are padded (`.hero-line-mask`) so descenders survive.
- **Contact headline** (600, `clamp(36px, 6vw, 76px)`, 1.04, -0.035em): the home Contact `h2`, the one oversized heading below the hero; also carries a green accent phrase.
- **Headline** (600, `clamp(28px, 4vw, 48px)`, 1.25, -0.03em): numbered home section headings ("01 Selected Work"). The number is mono, green, half size, set inline before the title.
- **Page title** (600, `clamp(32px, 4.5vw, 48px)`, 1.25, -0.03em, `lightest-slate`): the `h1` of every inner page, from `PAGE_TITLE`.
- **Title** (600, 20px to 24px, -0.02em): card titles, timeline job titles, inner page subsection headings. Prose `h2` is 20px/600/-0.02em, `h3` 18px/600.
- **Body** (400, 16px, 1.625): prose in `slate-text`, measured by `MEASURE` (`max-w-[56ch]`, about 70–75 characters of Inter a line; 65ch ran to ~85). Lead paragraphs on inner pages and the hero sub run at 18px.
- **Label** (mono, 400, 12px to 13px): nav, breadcrumb, dates, stacks, footer, form labels, buttons (12px / 14px / 16px by size).
- **Label caps** (mono, 11px, uppercase, 0.08em): the kind label on Work and project cards ("Enterprise · Daxonet AI"), and chips (11px, not uppercase).

Headings `h1`–`h3` use `text-wrap: balance`; `p` and `li` use `text-wrap: pretty`.

### Named Rules
**The Two Voices Rule.** Mono is for labels, metadata, controls and machine output; Inter is for headings and sentences. A sentence is never set in mono, and a date or stack is never set in Inter.

**The Upright Accent Rule.** Emphasis inside a headline is a green phrase, not italics or bold.

## Layout

Single column with a responsive gutter. The page gutter is the `--gutter` variable (24px base, 40px at sm, 64px at md, 96px at lg), applied through `GUTTER` on every home section. Inner pages use `PAGE_MAIN`: a centred `max-w-screen-lg` column inside the same gutter, 128px top padding to clear the fixed header, 80px bottom.

Home sections are full-width bands divided by a 1px `graphite` top border. Vertical room is generous: the hero fills the viewport on md and up; Career uses 16vh vertical padding; Contact is at least 90vh. Hero is a two-column grid (1.1fr / 1fr) on md and up, stacked below. Career is a 1fr / 2fr grid with a sticky intro column. Projects lists two columns (enterprise) and up to three (open source); gaps are 24px.

The Work track pins and scrolls horizontally only on the `pin` screen (min-width 768px and min-height 560px, mirrored by `MQ.pin`); below it (`nopin`) it is a native snap-scrolling row; under reduced motion the cards wrap into a centred grid. Raw screens disable Tailwind's `max-*` variants, so responsive classes are written mobile-first.

### Named Rules
**The One Idea Per Section Rule.** Each section carries one idea. No side rails, no secondary widgets competing with the section's subject.

## Elevation & Depth

Depth is tonal first. Surfaces step from `navy` (canvas) to `well` (recessed) to `card` (raised), and borders (`edge`, `light-graphite`, `graphite`) do the structural work. Shadows are rare and almost all are green-tinted glows that mean "this is live": the console, the active Work card, the contact magnet button, the career dots. The only neutral drop shadow is inside `shadow-console`.

### Shadow Vocabulary
See the shadow table in Portfolio tokens. Card glows are carried by an absolutely positioned overlay whose opacity fades; the shadow value itself never transitions.

### Named Rules
**The Glow Means Live Rule.** A glow marks the one element that is active or waiting for action. Static content gets a border, not a shadow.

## Shapes

Corners are soft on containers and small on controls: cards and images 16px, the console 12px, the illustration frame 10px, chips 5px, buttons and inputs 4px. Fully round shapes are reserved for the contact magnet button, timeline dots, console window dots and hamburger bars. Borders are 1px throughout (the logo mark and timeline dots use 2px); the "more" Work card uses a dashed `edge` border on a transparent fill. Article rows are borderless list rows separated by `light-graphite` hairlines.

## Components

### Buttons
Mono, quiet and precise; the outline is the default.
- **Shape:** gently squared (4px), 1px border.
- **Primary (outline):** `green-accent` text and border on transparent; sizes sm (20px × 10px, 12px text), md (28px × 14px, 14px), lg (32px × 16px, 16px). Shared classes live in `src/lib/button-styles.ts`.
- **Hover / Focus:** fills with `green-tint`; focus-visible adds a 2px `green-accent` ring at 70% with a `navy` offset. Colour, background, border and opacity transition over 250ms on `cubic-bezier(0.645, 0.045, 0.355, 1)`.
- **Secondary:** `light-slate` text and border. The hero's résumé button uses a `lightest-navy` border with `lightest-slate` text and turns green on hover.
- **Solid:** the hero primary CTA is a filled `green-accent` button with `navy` text at 600; hover drops opacity to 0.9.
- **Magnet (Contact):** a pill (9999px), filled green, navy mono 16px/600 text with an arrow, `shadow-magnet`. On a fine pointer with motion allowed, the button, label and arrow follow the pointer with `gsap.quickTo` (0.4s, power3) and spring back on leave.

### Chips
- **Style:** transparent, 1px `edge` border, 5px radius, mono 11px `light-slate`, 4px × 8px. Used for technologies, skills and tags (`CHIP`).
- **State:** static; chips are not interactive. In the hero console the active run chip switches to a green border at 40% and green text.

### Cards / Containers
- **Work card:** `card` surface, 1px `edge` border, 16px radius, 22px padding, `min(360px, 80vw)` wide and `min(470px, 72vh)` tall on tall screens. Content: a 312:170 illustration frame (170px tall on a full-width card; on narrower cards the drawing scales down with it) (`well` with `bg-dot-pattern`, 10px radius, `light-graphite` border), a mono caps kind label in the kind's accent, a 24px title, a `light-slate` tagline, a mono `slate-text` stack. The active card gets an accent border at 55% and a `glow-*` shadow on a fading overlay. Inactive cards sit at opacity 0.9 with their illustration at 0.7 and `saturate(0.55)`, frozen on the finished frame.
- **Project card:** the Work card language without the illustration: text only, 20px title, tagline clamped to three lines. Hover turns the border to the kind's accent at 55% and the title to the accent.
- **Shadow Strategy:** none at rest; see Elevation.

### Inputs / Fields
- **Style:** `card` fill, 1px `edge` border, 4px radius, 12px × 16px padding, 14px `lightest-slate` text, `slate-text` placeholder. Labels are mono 12px `light-slate` above the field.
- **Focus:** border turns `green-accent`, plus a 2px green ring at 50% on focus-visible.
- **Error:** `aria-invalid` turns the border `danger`; a mono 12px `danger` message below names the fix.
- **Disabled:** the submit button drops to 50% opacity while sending.

### Navigation
- **Header:** fixed, 64px (80px md), `navy` at 80% with backdrop blur, inside the page gutter. Left: the initial in a 2px green-bordered square (40px / 48px). Right: mono 14px links, each prefixed by a green 12px index ("01."), `light-slate` at rest, green on hover and when current, then a small outline Résumé button. It hides on scroll down and returns on scroll up or when focus enters it.
- **Mobile:** below md, a two-bar green toggle that rotates into an X opens a right-hand drawer (`card`, `edge` left border, 75% wide, max 384px) with centred mono 18px links and an outline Résumé button. The page behind is dimmed, blurred and made `inert`; Escape closes it.
- **Breadcrumb:** mono 14px `slate-text`, `/` separators, current item green. Links carry a 44px tap area (`TAP_LINK`) without changing the layout.
- **Footer:** mono 12px `slate-text`, links turn green on hover. Small text links here, in the home Contact row and beside section headings use `TAP_LINK` (44px tall tap area); wrapped rows sit one tap area apart.

### Agent Console (signature)
A terminal-like panel in the hero: `well` surface, `edge` border, 12px radius, `shadow-console`, mono 13px at 1.7 line height. A title bar with three `edge` dots and a `light-graphite` rule, log lines in a 74px label column, a green blinking block cursor, and run chips along the bottom. Runs loop; under reduced motion the console rests on a finished run and the cursor stops blinking.

### Work Illustrations (signature)
One code-drawn illustration per Work card, selected by the project's `visual` field and played by `VizFrame`. Built only from palette tokens: `card` chips and nodes, `graphite` paper, `edge` wires, `edge-strong` outlines and `shadow-doc-lines`, accent bubbles from the matching `green-*` or `sky-*` family, `shadow-scan` / `shadow-spark` highlights. Each is drawn on a 312×170 canvas and scaled to fit its frame. Only the active card's illustration plays: once (at most 5s), each time the card becomes active while the Work section is on screen. It never loops.

### Article Row
A list row: mono date, 18px title, two mono tags, an arrow. On hover the `bg-row-tint` overlay fades in, the row nudges 14px right (motion-safe), the title turns green and the arrow lifts. Used on home Latest Writing and the Writing page (detailed variant adds the description).

### Timeline
Career (home) and Experience (About) share one rail: a 2px `light-graphite` line with 14px dots (2px green border, `navy` fill, `shadow-halo`), mono green dates, 20px titles, `slate-text` detail and chips. On home the rail fills with a green gradient on scroll and dots start as pending (`lightest-navy` border, no halo).

### Slide Decks
Presentation decks (`.pptx`, e.g. `public/slide/deck.pptx`, served at `/slide/deck.pptx`) carry the same carbon canvas, green signal and two voices, adjusted for projectors and for apps without the web fonts:
- Card borders are `slate-text` at 0.75pt, not `edge`: projectors crush the near-black steps, and `edge` (1.35:1) or `lightest-navy` (1.8:1) vanish against `navy`; `slate-text` clears 3:1. Card fills stay `card`; the one live card keeps its green border and glow.
- Agent-run status: `green-accent` for a done step, `amber` for a retried step, `danger` for a failed step, always paired with an icon (check, retry arrows, cross) and alt text, never colour alone.
- Labels use Courier New (the portable end of the mono stack) and body text Arial, since Inter and SF Mono do not ship with Office, Keynote or Google Slides. Nothing that carries meaning is set below 12pt; the footer is 10pt.
- No eyebrow above a heading: the case name sits in the footer beside the slide number.

### Motion
Motion follows the "Animation rules" in `CLAUDE.md`; in summary:
- Animate only transforms (`x`, `y`, `xPercent`, `yPercent`, `scale`, `scaleX`, `scaleY`, `rotation`) and `opacity`. Hover and focus may transition `color`, `background-color` and `border-color`. No layout properties, `filter` or `box-shadow` transitions, no `transition-all`.
- All GSAP runs inside `useGSAP` or `useMatchMedia` with `gsap.matchMedia` branches on `MQ`. Under reduced motion: no movement, pin, scrub or loops; loops and scrubbed pieces rest on the finished frame; reveals are immediate or a short fade.
- At most the hero console and one active Work card animate at once. The hero dot grid moves only in response to the pointer.
- Lenis smooth scroll on the home page only, driven by the GSAP ticker; inner pages scroll natively; no CSS `scroll-behavior: smooth`.
- Hero entrance: words rise from their line masks (0.8s, power3.out, 0.04s stagger), then the sub and CTAs fade up 12px.
- Hover timing: 250ms with the custom ease for controls, 300ms ease-out for article rows, 400ms ease-out for Work card dimming.

## Do's and Don'ts

### Do:
- **Do** build every new surface on `navy`, with `card` for raised surfaces and `well` for recessed ones, bordered by `edge`.
- **Do** use `green-accent` for links, active state, primary actions and focus, and `sky` only for open-source work.
- **Do** take colours, shadows and gradients from the Tailwind tokens listed in Portfolio tokens.
- **Do** set labels, dates, stacks, nav and buttons in mono, and headings and prose in Inter with negative tracking.
- **Do** use `PAGE_TITLE` for inner page `h1`s, `PAGE_MAIN` / `GUTTER` for page and section width, and `CHIP`, `BUTTON_BASE` and `BUTTON_SIZES` for chips and buttons.
- **Do** give every `<img>` explicit width and height (`Img.astro` does it), with 16px radius and an `edge` border for content images.
- **Do** provide a reduced-motion branch for every animation, resting on its finished frame.

### Don't:
- **Don't** add a light theme, light surfaces or a theme toggle.
- **Don't** use `sky` for anything other than open-source work, or green for open-source work.
- **Don't** write raw hex or `rgba()` in components.
- **Don't** transition `box-shadow`, `filter` or layout properties; fade an overlay's opacity instead.
- **Don't** add a glow or shadow to static content; borders carry structure.
- **Don't** crowd a section: one idea per section, no side rails, no more than the console and one Work card moving at once.
- **Don't** state a years-of-experience figure anywhere in the design or copy.
