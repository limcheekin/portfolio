# **System Architecture and Implementation Guide for AI-Assisted Creative Web Redesign (Revised)**

*Revised October 18, 2026 after a fact-check against the official GSAP, Lenis, Next.js, React Bits and Claude Code documentation. A change log is at the end.*

## **Introduction to the Modern Creative Stack**

Designing a highly interactive, motion-rich portfolio requires orchestrating several systems: a rendering framework, a scroll engine, an animation library and a repository of polished visual components. This guide gives a practical, step-by-step architecture for redesigning the web property at **kin.rag.wtf**, using Claude Code as the implementation agent.

The site is the professional portfolio of Lim Chee Kin, an AI engineer and technical lead. His public GitHub profile (github.com/limcheekin) lists these current projects:

- **RAG.WTF**: an open-source platform for private, personalized knowledge discovery using RAG systems.
- **Talk To AI**: a real-time voice AI application targeting sub-300 ms latency, built on FastRTC/WebRTC with local or cloud STT, LLM and TTS backends.
- **Project Concord**: an MCP server that connects modern AI agents with legacy *database schemas*.
- **open-text-embeddings**: an OpenAI-compatible embeddings endpoint for open-source models.

Historical work in the Grails and Flutter ecosystems and the "25+ years" figure come from the site owner's own biography and should be confirmed with him before publishing. Likewise, confirm the exact repository name and URL of the `pipecat_smart_turn` Flutter package, which could not be independently verified.

The recommended stack:

| Technology Component | Architectural Purpose | Execution Paradigm |
| :---- | :---- | :---- |
| **Next.js 16 (App Router)** | Routing and rendering. | Server Components fetch data; animated UI lives in Client Components. (Next.js 16 is the Active LTS. Next.js's policy keeps each major in Maintenance LTS for two years after release, which puts Next.js 15 at about Oct 21, 2026, so start on 16. Check the current Node.js minimum; it was reported as 20.9+.) |
| **GSAP 3.13+ & ScrollTrigger** | Deterministic animation and scroll-linked state. | Imperative animation, scoped and cleaned up by the `useGSAP()` hook. All GSAP plugins are now free, including SplitText and Flip. |
| **Lenis (`lenis` / `lenis/react`)** | Smooth-scroll interpolation on top of native scroll. | One shared frame loop, driven by the GSAP ticker. |
| **React Bits** | Copy-in animated components (text, backgrounds, cursors, micro-interactions). | Installed as source you own, via the shadcn/jsrepo CLI or an (unofficial) MCP server. |
| **Claude Code** | Agentic code generation. | Guided by `CLAUDE.md`, and *enforced* by linting and hooks. |

## **Phase 1: Establishing the Agentic Development Environment**

AI agents tend to default to legacy patterns, such as bare `useEffect` for animations. That causes double-firing animations and leaks under React Strict Mode. Give the agent explicit rules, then verify them mechanically.

### **Shared Setup: Plugin Registration**

All code samples in this guide assume the plugins are imported and registered once, in a client-only module (for example `lib/gsap.ts`, imported by components that animate):

```ts
"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip);
export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };
```

Registering plugins also protects them from being dropped by tree-shaking in production builds. Install with `npm i gsap @gsap/react lenis`. All GSAP plugins ship in the standard `gsap` package.

### **Architectural Directives via CLAUDE.md**

Create a `CLAUDE.md` at the project root. Anthropic's documentation describes it as context loaded at the start of every session, **not enforced configuration**. Treat it as strong guidance, write the rules as short, binary statements, and back the important ones with ESLint rules, a pre-commit hook or Claude Code hooks so violations fail the build instead of relying on the agent's compliance.

A recommended starting rule set:

```markdown
## Animation rules
- In code we write, only animate x, y, scale, rotation, opacity (and xPercent/yPercent). Never animate top, left, width, height, margin.
  (The Flip plugin is allowed: it expresses layout changes as transforms. Vendored React Bits components may animate other
  properties, such as blur filters; profile those instead of rewriting them.)
- All GSAP animation code uses useGSAP() from @gsap/react. Do not use useEffect/useLayoutEffect for GSAP tweens or timelines.
  (Exception: wiring the Lenis <-> gsap.ticker bridge in the single SmoothScroll provider.)
- Every useGSAP() call passes { scope: containerRef }. Never use unscoped selectors.
- Animations created in event handlers (onClick, onMouseMove, setTimeout) must be wrapped in contextSafe().
  Manually added event listeners must be removed in a cleanup function.
- Never store tweens/timelines in useState. Use useRef if you must keep a reference.
- All animation logic must respect reduced motion via gsap.matchMedia().

## Next.js rules
- Any file using GSAP, Lenis, or DOM/canvas APIs starts with "use client".
- Heavy WebGL/canvas components are lazy-loaded with next/dynamic and { ssr: false }
  from inside a Client Component. Never use ssr:false in a Server Component (build error).
- Use next/image or explicit width/height on every image.

## React Bits rules
- Prefer installing components with the shadcn CLI (npx shadcn@latest add @react-bits/<Name>-TS-TW).
- After adding a component, read its dependency list and install every package explicitly,
  including scoped ones (e.g. @react-three/fiber, ogl, gsap, motion).
- Vendored components may use useEffect internally. Review them against the rules above and refactor
  if they leak or ignore reduced motion.
```

Why these rules matter, in brief:

- **`"use client"`**: GSAP, Lenis and canvas components need browser APIs, so they must be Client Components. Note that Client Components are still *prerendered* on the server by default, so any top-level access to `window` or `document` in the module body will throw during that prerender. Touch browser APIs only inside effects, `useGSAP` callbacks or event handlers. (`useGSAP` itself is SSR-safe: it falls back to `useEffect` when `window` is undefined.)
- **`next/dynamic` with `ssr: false`**: use it for heavy WebGL components to keep them out of server rendering and to code-split them, but only inside a Client Component. Next.js disallows `ssr: false` in Server Components.
- **`scope`**: passing a `useRef` to the container confines every string selector in the hook to that container's descendants, so `.card` in the hero cannot mutate `.card` in the footer.
- **`contextSafe`**: animations created after the hook runs (clicks, hovers, mouse moves) are not recorded by the hook's context and will not be reverted on unmount unless wrapped.

### **Installing React Bits Components**

React Bits is a free, open-source library of animated components. The catalog is organized into text animations, animations, components, backgrounds and micro-interactions, and is now well past the "135+" figure quoted by older tooling. Its official install path is the CLI:

```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW
```

The suffix selects JS or TS, then plain CSS or Tailwind. Components land in your repo as source you own.

**Optional: the unofficial ReactBits MCP server.** A third-party MCP server (`reactbits-dev-mcp-server`, run with `npx reactbits-dev-mcp-server`) lets Claude Code browse and fetch components in natural language. It is not maintained by React Bits. Facts worth knowing:

- Without a GitHub token it is limited to 60 requests per hour. Setting `GITHUB_TOKEN` (a classic token with no special scopes) raises that to 5,000 requests per hour.
- Its tools are `list_components` (filter by category and `css`/`tailwind`/`default` style), `get_component`, `search_components`, `get_component_demo` and `list_categories`. It also caches fetched components internally.
- Its own README rates some categories (buttons, forms, loaders) as returning incomplete or placeholder code. Verify any component it returns against the live component page.
- Some versions mis-resolve scoped packages: the dependency scanner keeps only the first path segment of an import, so `@react-three/fiber` becomes `@react-three`. Instruct the agent to read each component's imports and install the exact package names.

| MCP Tool | What It Does | Agentic Workflow Benefit |
| :---- | :---- | :---- |
| `list_components` | Lists components by category and styling variant. | Lets the agent discover candidates (e.g. backgrounds in Tailwind) without manual browsing. |
| `search_components` | Searches by name or description. | Fast lookup for a specific effect. |
| `get_component` | Returns the source for one component. | Source can be placed into `components/`; check imports and dependencies. |
| `get_component_demo` | Returns usage example code. | Reduces prop-guessing. |
| `list_categories` | Lists categories. | Orientation for the agent. |

## **Phase 2: Core Infrastructure and Scroll Physics**

Secure the scroll engine before adding visual components. **Lenis** is a lightweight, dependency-free smooth-scroll library that runs on top of the browser's *native* scroll, so `position: sticky`, anchor links and keyboard navigation keep working. It has known limits: no CSS scroll-snap (use the `lenis/snap` package), a 60 fps cap on Safari, and no smoothing over iframes.

Alternatives: GSAP's own **ScrollSmoother** is also free and integrates natively with ScrollTrigger. This guide uses Lenis, but ScrollSmoother is a valid choice if you want a single vendor.

### **Implementing Lenis within the App Router**

Install the current package (`npm i lenis`). The older `@studio-freight/lenis` and `@studio-freight/react-lenis` packages are deprecated and renamed. Import `ReactLenis` from `lenis/react` and the recommended stylesheet:

```tsx
import "lenis/dist/lenis.css"; // in your global layout or CSS entry
```

The stylesheet ships the rules Lenis needs (including the `html.lenis` height handling and the `data-lenis-prevent` behavior), so you do not need to hand-write them. Elements that need their own scroll context get `data-lenis-prevent` (or use the `allowNestedScroll` option, which is simpler but checks the DOM on every scroll event).

**Touch devices.** Leave `syncTouch` at its default (`false`). Native touch scrolling works with ScrollTrigger, and enabling `syncTouch` can be unstable on iOS earlier than 16 and can remove the smooth feel. Enable it only for a specific need, such as infinite scrolling.

**Reduced motion.** Lenis honors `prefers-reduced-motion` by default (`respectReducedMotion: true`): smoothing is disabled and programmatic scrolls become instant. Do not turn this off.

### **GSAP Ticker Synchronization Architecture**

If Lenis and ScrollTrigger run on separate `requestAnimationFrame` loops, scroll-linked animation jitters. Merge them into one loop. Put all of this in a single `SmoothScroll` provider (this is the one place a `useEffect` is appropriate):

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";

gsap.registerPlugin(ScrollTrigger); // module level

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  // 1. Keep ScrollTrigger in sync on every Lenis scroll event
  useLenis(ScrollTrigger.update);

  // 2. Drive Lenis from the GSAP ticker (seconds -> milliseconds)
  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0); // no time-skipping while time drives scroll position
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <>
      <ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />
      {children}
    </>
  );
}
```

The sequence, and why each part exists:

1. Register `ScrollTrigger` at module level so it exists before any component uses it.
2. Disable Lenis's internal loop (`autoRaf: false`) and call `lenis.raf(time * 1000)` from `gsap.ticker`, converting seconds to milliseconds.
3. Call `ScrollTrigger.update` on every Lenis scroll event (the `useLenis` callback above). **Omitting this step makes pinned and scrubbed sections lag.**
4. Call `gsap.ticker.lagSmoothing(0)`. GSAP's default lag smoothing adjusts time during heavy frames; when time determines the scroll position, that adjustment desynchronizes the page.
5. Remove the ticker listener in the effect's cleanup, to avoid duplicate listeners during hot-module replacement.

Notes on this pattern: `useLenis` reaches the instance through the `root` prop, which makes it globally accessible (it follows the official `lenis/react` examples, which pair `root` with `autoRaf: false`). Mount the provider once, high in `app/layout.tsx`. Keep Lenis updated, since options such as `respectReducedMotion` are recent; check `npm ls lenis` and the changelog if a documented option seems to be ignored.

For programmatic scrolling (anchor links, route changes, "back to top"), use `lenis.scrollTo()` so Lenis, not a competing tween, owns the scroll position.

## **Phase 3: GSAP and React Architectural Paradigms**

GSAP is imperative and mutates the DOM directly; React is declarative and re-renders from state. The `useGSAP()` hook reconciles them. It is a drop-in replacement for `useEffect`/`useLayoutEffect` that automatically manages cleanup via `gsap.context()`.

### **The Mechanics of the GSAP Context and Garbage Collection**

In development, React Strict Mode runs effects twice (mount, unmount, remount) to expose side-effect bugs. With a bare `useEffect`, the animation logic would execute twice, producing duplicate tweens, flicker and, for `from` tweens, wrong start values.

`useGSAP` records every tween, timeline, ScrollTrigger, Draggable and SplitText instance created while the hook executes. When the component unmounts (or during the Strict Mode remount), it calls `revert()` on the context, which kills those animations and restores the inline styles GSAP applied. Two clarifications:

- `revert()` handles GSAP objects. **Event listeners you add yourself are not removed automatically**; return a cleanup function that removes them.
- Do not store timelines in `useState`: it triggers re-renders. Keep a reference in `useRef` only if you need one.

Register the hook once to avoid React version discrepancies: `gsap.registerPlugin(useGSAP)`.

### **Scoped Selectors and Context-Safe Interactivity**

Pass `scope` so string selectors are confined to the component:

```tsx
const container = useRef<HTMLDivElement>(null);
const { contextSafe } = useGSAP(() => {
  gsap.from(".title", { y: 40, opacity: 0 });
}, { scope: container });

const onEnter = contextSafe(() => gsap.to(".card", { scale: 1.05 })); // tracked and reverted on unmount
```

Animations that run after the hook has executed (clicks, hovers, `setTimeout`) are "context-unsafe" until wrapped in `contextSafe()`. This matters for React Bits components that react to the pointer.

| GSAP Paradigm | Implementation Mechanics | Next.js Architecture Benefit |
| :---- | :---- | :---- |
| **Garbage Collection** | `useGSAP()` reverts its context on unmount. | Prevents double-firing and leaks under Strict Mode. |
| **Scope Isolation** | Pass a root `useRef` as `scope`. | Confines selectors to local descendants. |
| **Event Safety** | Wrap handlers in `contextSafe()`. | Tweens created by interaction are tracked and reverted. |
| **High-Frequency Updates** | Use `gsap.quickTo()` for cursor-linked values. | Avoids creating a new tween on every `mousemove`. |

## **Phase 4: Systematic Visual Redesign of kin.rag.wtf**

The aesthetic should reflect precise, data-driven, highly optimized engineering rather than a generic corporate template. The site divides into five narrative sections.

### **Step 1: The Hero Interface and Technical Aesthetic**

Use the React Bits catalog to find a background that evokes vector or latent-space data:

- **Dot Grid** draws a springy dot grid on a 2D `<canvas>` that reacts to the cursor, a fitting image for embedding matrices. In the version I inspected, it depended on GSAP and its InertiaPlugin (now free) and was written with a plain `useEffect`, so review the version you install against your cleanup rules. Component internals change between releases.
- **Aurora** is a soft shader background that, in the version I inspected, used OGL (WebGL). That is lighter than a Three.js scene but still WebGL, so lazy-load it (`next/dynamic`, `ssr: false`, from a Client Component) and budget for mobile.

For headline typography, React Bits offers **Blur Text** (historically built on the `motion`/Framer Motion library rather than GSAP; check its listed dependencies) and **Tech Text**, plus a Split Text component. If you build your own with GSAP SplitText, configure it like this:

```tsx
useGSAP(() => {
  SplitText.create(".hero-title", {
    type: "lines, words",
    mask: "lines",
    autoSplit: true,               // re-split on font load / width change
    onSplit(self) {
      return gsap.from(self.words, { // returned animation is cleaned up and time-synced on re-split
        yPercent: 100, opacity: 0, stagger: 0.04, duration: 0.8, ease: "power3.out",
      });
    },
  });
}, { scope: heroRef });
```

Notes: `onSplit()` requires GSAP 3.13 or later. `deepSlice` already defaults to `true` (and only affects line splitting), so it needs no setting. SplitText adds an `aria-label` to the split element and hides the fragments from screen readers; this does not expose nested links, so keep linked text out of split elements or provide a screen-reader-only duplicate. Avoid `text-wrap: balance` on split text.

### **Step 2: Open Source Showcase via Horizontal Scroll Mechanics**

Lim Chee Kin's open-source work includes the `open-text-embeddings` API, the `surrealdb_wasm` Flutter package, a Pipecat Smart Turn Flutter package for real-time voice (verify the repository), and historical Flutter and Grails integrations. A horizontally scrolling, pinned section suits this variety better than a vertical list.

Pin the **outer section** and translate an **inner track** (do not animate the pinned element itself, because that corrupts ScrollTrigger's measurements):

```tsx
useGSAP(() => {
  const track = trackRef.current!;
  const distance = () => track.scrollWidth - window.innerWidth;

  const tween = gsap.to(track, {
    x: () => -distance(),
    ease: "none",                  // required: linear mapping from scroll to movement
    scrollTrigger: {
      trigger: sectionRef.current,
      pin: true,
      scrub: 1,                    // playhead takes about 1 second to catch up
      start: "top top",
      end: () => "+=" + distance(),
      invalidateOnRefresh: true,   // re-read distance() on resize/refresh
    },
  });
}, { scope: sectionRef });
```

Guidance:

1. The track is a flex row of cards wider than the viewport.
2. `xPercent: -100 * (n - 1)` is a valid alternative **only if every card is a full-viewport-width panel**; otherwise compute the distance from `scrollWidth` as above.
3. To trigger animations on elements *inside* the moving track, give those ScrollTriggers `containerAnimation: tween`. The container tween must use `ease: "none"`; pinning and snapping are not available on `containerAnimation`-based triggers.
4. Create ScrollTriggers in page order (top to bottom) so pin spacing is accounted for, or use `refreshPriority`/`ScrollTrigger.sort()`.
5. Programmatic navigation to or from this section should use `lenis.scrollTo()`.
6. Do not add drag momentum (Draggable plus InertiaPlugin) to this scroll-driven track. Two controllers would compete for the same transform. If you want drag physics, use it in a separate, non-pinned carousel.

### **Step 3: Professional Experience and Timeline Batching**

Present a long career without dense walls of text, using a vertical timeline and `ScrollTrigger.batch()` instead of dozens of individual ScrollTriggers. Batch groups the elements that enter the viewport within a short interval and hands your callback an array, so you can apply a stagger:

```tsx
ScrollTrigger.batch(".job", {
  start: "top 85%",
  onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, scale: 1, stagger: 0.12, overwrite: true }),
});
```

Set the initial hidden state (`opacity: 0; transform: translateY(24px) scale(0.98)`) in CSS or with `gsap.set`, and keep to transform and opacity properties. Animating `top`, `margin` or `width` forces layout recalculation on every frame. Create the batch inside the `gsap.matchMedia()` handler from Phase 5 so reduced-motion users get a plain fade (or an immediate reveal) instead, and so it is reverted when the condition changes. If you hide elements in CSS, make sure a reduced-motion or no-JavaScript path still makes them visible.

### **Step 4: Micro-Interactions and State Transitions**

Layer interaction sparingly:

- **Cursor effects**: React Bits includes Splash Cursor (a fluid simulation), Target Cursor, Blob Cursor and others. The simulations are GPU-heavy; disable them on touch devices and for reduced motion.
- **Magnetic hover**: React Bits provides **Magnet**, a wrapper that makes any element ease toward the cursor with spring physics. (There is no dedicated "magnetic button" component; wrap your own button.)
- **Filtering**: use GSAP's **Flip** plugin to capture element state, change the DOM, and animate from the old state to the new one, so project cards rearrange fluidly when filtering by technology (RAG, voice AI, legacy data):

```tsx
const { contextSafe } = useGSAP({ scope: gridRef });

const applyFilter = contextSafe((tag: string) => {
  const state = Flip.getState(".project-card");   // 1. capture
  setActiveTag(tag);                               // 2. change the DOM (React state)
  requestAnimationFrame(() => {                    // 3. animate after React has committed the update
    Flip.from(state, { duration: 0.6, ease: "power2.inOut", absolute: true, stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1 }),
      onLeave: (els) => gsap.to(els, { opacity: 0 }) });
  });
});
```

  In React, the DOM only changes after the state update renders, so run `Flip.from()` after that commit (a `useLayoutEffect`/`useGSAP` keyed on the filter value is the more robust pattern for production). Under reduced motion, skip Flip and swap the cards instantly or with a brief fade.
- **Cursor-linked values**: for per-frame pointer tracking, create the setter once and reuse it with `gsap.quickTo()` instead of making a new tween on every `mousemove`:

```tsx
useGSAP(() => {
  const xTo = gsap.quickTo(".cursor-dot", "x", { duration: 0.3, ease: "power3" });
  const yTo = gsap.quickTo(".cursor-dot", "y", { duration: 0.3, ease: "power3" });
  const move = (e: MouseEvent) => { xTo(e.clientX); yTo(e.clientY); };
  window.addEventListener("mousemove", move);
  return () => window.removeEventListener("mousemove", move); // your listener: you remove it
}, { scope: container });
```

| Portfolio Narrative Section | Content Focus | Architectural Implementation |
| :---- | :---- | :---- |
| **Hero** | AI Engineer / Architect | Dot Grid or Aurora background (lazy-loaded); SplitText with `autoSplit` and `onSplit`. |
| **Open Source Showcase** | open-text-embeddings, surrealdb_wasm, Pipecat Smart Turn (verify) | Pinned section, inner track translated with `ease: "none"`, `scrub: 1`. |
| **Real-Time Applications** | Talk To AI (sub-300 ms target, FastRTC/WebRTC) | Gradient Waves background; `toggleActions: "play none none none"` entry animation. |
| **Data Transformation** | Project Concord (MCP server for legacy database schemas) | Flip plugin for filtering legacy vs. modern data sources. |
| **Career Timeline** | Experience history | `ScrollTrigger.batch()` for staggered reveals. |

## **Phase 5: Accessibility, Performance Optimization, and Edge Cases**

Animation can cause dizziness and nausea for people with vestibular disorders. A professional portfolio should handle this deliberately.

### **Respecting Motion Preferences via gsap.matchMedia()**

`gsap.matchMedia()` runs setup code only while a media query matches; when it stops matching, every animation and ScrollTrigger created in that function is reverted automatically. It is a specialized wrapper around `gsap.context()`, so you do not need both. In React, create it inside `useGSAP` and revert it in the cleanup:

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia(container); // pass the scope here: matchMedia makes its own context and does not inherit useGSAP's scope
  mm.add(
    { reduceMotion: "(prefers-reduced-motion: reduce)", allowMotion: "(prefers-reduced-motion: no-preference)" },
    (ctx) => {
      const { reduceMotion } = ctx.conditions!;
      gsap.from(".reveal", {
        opacity: 0,
        y: reduceMotion ? 0 : 60,           // no spatial movement under reduced motion
        duration: reduceMotion ? 0.2 : 0.8,
        scrollTrigger: reduceMotion
          ? { trigger: ".reveal", toggleActions: "play none none none" } // simple fade, no scrub
          : { trigger: ".reveal", scrub: 1 },
      });
    }
  );
  return () => mm.revert();
}, { scope: container });
```

Degradation strategy for `reduce`: remove x/y translations, pause infinite or looping animation (including canvas loops such as Dot Grid, by passing a prop or unmounting the component), and replace scrubbed motion with short opacity fades. Lenis already disables its smoothing in this mode.

**A manual "Disable animations" toggle.** `matchMedia` reacts to media-query changes, **not to React state**. For an in-app toggle, keep the preference in a store or ref that the matchMedia handler reads, and call `gsap.matchMediaRefresh()` when it changes. That reverts all active matchMedia setups and re-runs the ones that currently match. GSAP documents this approach for a reduced-motion checkbox.

| Accessibility Condition | Animation Degradation Strategy | Implementation |
| :---- | :---- | :---- |
| `prefers-reduced-motion: reduce` | Eliminate spatial (x, y) transforms. | `y: reduceMotion ? 0 : 60` inside the handler. |
| Vestibular protection | Stop looping background animation. | Pass a `paused`/`enabled` prop to React Bits canvases, or do not mount them. |
| Scroll feedback | Replace scrubbed movement with brief fades. | Use `toggleActions: "play none none none"` with an opacity tween instead of `scrub`. |
| Manual override | Let users override the system setting. | Toggle a stored flag, then call `gsap.matchMediaRefresh()`. |

### **Combating Layout Shifts and Hydration Issues**

ScrollTrigger measures element positions when it is created. If images or web fonts change the page height afterward, trigger points become wrong and animations fire too early or late.

1. Reserve space: give every image explicit `width` and `height`, or use `next/image`; load fonts with `next/font` to limit shifts.
2. Re-measure once content settles: call `ScrollTrigger.refresh()` after dynamic content loads (use a `ResizeObserver` or `onLoad` handlers). SplitText with `autoSplit: true` already re-splits when fonts finish loading.
3. Add `invalidateOnRefresh: true` to ScrollTriggers whose tween values are derived from layout (widths, distances), so they are recalculated on resize and refresh.
4. Avoid CSS `content-visibility: auto`/`hidden` on animated sections; it prevents correct measurement.
5. If you pin and see jumping, check for ancestors with `transform` or `will-change`, which break `position: fixed` pinning. `pinReparent: true` is a last resort.
6. On mobile, consider `ScrollTrigger.normalizeScroll()` only if address-bar resizing causes problems, and test it alongside Lenis.

**`will-change`.** It promotes an element to its own compositor layer and can improve smoothness, but applying it broadly across many React Bits components consumes GPU memory and can crash low-end phones. Rely on GSAP's default `force3D: "auto"` behavior, or apply `will-change: transform, opacity` only to a small set of actively animating elements and remove it afterward.

### **Verification Checklist (have Claude Code run or report on these)**

These are recommended practices rather than requirements from any single source.

1. **Strict Mode double-mount**: run `next dev`, load each animated route, and confirm no duplicated or flickering animations.
2. **Leak check on navigation**: navigate between routes and confirm `ScrollTrigger.getAll().length` returns to the expected count rather than growing.
3. **Reduced motion**: emulate `prefers-reduced-motion: reduce` in browser dev tools and confirm there is no x/y movement, no scrubbed animation and no looping canvases.
4. **Scroll sync**: scroll quickly on desktop and on a real phone; pinned sections should not jitter or desynchronize.
5. **Resize and font load**: resize the window and throttle the network; split text should re-split and trigger points should realign.
6. **Layout shift and performance**: run Lighthouse or Web Vitals for CLS and main-thread time, and test the WebGL backgrounds on a low-end mobile device.
7. **Keyboard and screen reader**: tab through the page, confirm focus is visible and anchors work with Lenis, and check split headings with a screen reader.
8. **Dependencies**: confirm every package imported by vendored React Bits components is in `package.json` with its exact scoped name.

## **Conclusion**

Constraining Claude Code with a clear `CLAUDE.md`, and backing it with linting and hooks, turns the redesign into architectural direction instead of line-by-line coding. Next.js 16 supplies SEO-friendly rendering; a single shared frame loop for Lenis and GSAP provides cinematic scrolling; `useGSAP` scope and `contextSafe` keep animation leak-free; and `gsap.matchMedia()` with Lenis's built-in reduced-motion support keeps the experience accessible. Treat third-party React Bits tooling and every vendored component as code to review, not as trusted output.

## **Change Log (what was corrected from the original draft)**

| Area | Original | Corrected |
| :---- | :---- | :---- |
| Next.js version | Next.js 15 | Next.js 16 (15 reaches EOL Oct 21, 2026). |
| `ssr: false` | Presented as a general instruction. | Allowed only inside Client Components; Client Components are still prerendered on the server. |
| `window is not defined` | Attributed to GSAP/hydration in general. | Caused by top-level browser API access; `useGSAP` is SSR-safe. |
| Lenis package | `@studio-freight/react-lenis`. | `lenis` and `lenis/react` (old packages deprecated); import `lenis/dist/lenis.css`. |
| `syncTouch` | Mandatory `true`. | Default `false`; enable only for specific needs (iOS < 16 instability). |
| Ticker sync | Omitted a step. | Added `ScrollTrigger.update` on Lenis scroll events. |
| CLAUDE.md | "Immutable system prompt" that "guarantees" compliance. | Context, not enforcement; add ESLint/hooks. |
| `useEffect` ban | Absolute, contradicting the Lenis wiring. | Scoped to animation logic, with the ticker bridge as the exception. |
| `revert()` | "Removes event listeners." | Reverts GSAP objects only; remove your own listeners in cleanup. |
| SplitText | `deepSlice: true`; returned animation implied responsive re-split. | `deepSlice` is the default; add `autoSplit: true`; `onSplit` needs GSAP 3.13+. |
| Horizontal scroll | Missing `ease: "none"`; `offsetWidth`-based end; `xPercent` formula assumed. | Uses `scrollWidth` distance, `ease: "none"`, `containerAnimation` notes, `invalidateOnRefresh`. |
| InertiaPlugin / ScrollToPlugin | Recommended for the showcase and routing. | Removed: drag conflicts with scrub; use `lenis.scrollTo()`. |
| matchMedia toggle | Implied automatic binding to React state. | Use `gsap.matchMediaRefresh()`. |
| React Bits MCP table | Listed `CacheManager` and dependency resolution as parameters. | Lists the five actual tools; notes it is unofficial and has incomplete categories. |
| React Bits install | MCP only. | Official shadcn/jsrepo CLI first. |
| Scoped-package bug | Split on "@". | Splits on "/" and keeps the first segment. |
| Component names | "Magnetic Buttons", "GradientWaves". | Magnet (wrapper), Gradient Waves; Aurora noted as WebGL. |
| Project Concord | "MCP to Legacy API". | MCP server for legacy database schemas. |
| Plugin licensing | Not mentioned. | All GSAP plugins are free. |
| Accessibility | No mention of Lenis behavior. | Lenis honors reduced motion by default. |
| Formatting | Stray citation artifacts in a table cell. | Removed. |

## **Works Cited (sources used for the revision)**

1. GSAP and React, useGSAP: https://gsap.com/resources/React
2. GSAP SplitText: https://gsap.com/docs/v3/Plugins/SplitText/
3. GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
4. gsap.matchMedia(): https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/
5. Webflow makes GSAP 100% free: https://webflow.com/blog/gsap-becomes-free
6. Lenis README: https://github.com/darkroomengineering/lenis
7. lenis/react README: https://github.com/darkroomengineering/lenis/blob/main/packages/react/README.md
8. Deprecated `@studio-freight/react-lenis`: https://npmjs.com/package/@studio-freight/react-lenis
9. Next.js, lazy loading Client Components: https://nextjs.org/docs/app/guides/lazy-loading
10. Next.js 15 end-of-life: https://endoflife.ai/article-nextjs-15-eol
11. React Bits installation: https://reactbits.dev/get-started/installation
12. React Bits component index: https://reactbits.dev/get-started/index
13. ReactBits MCP Server (unofficial): https://github.com/ceorkm/reactbits-mcp-server
14. Claude Code documentation, CLAUDE.md and memory: https://code.claude.com/docs/
15. Lim Chee Kin (limcheekin) GitHub profile: https://github.com/limcheekin
16. open-text-embeddings: https://github.com/limcheekin/open-text-embeddings
