/** Shared style for centred SVG text labels in the illustrations (the font is the frame's `font-mono`). */
export const svgLabel = { fontSize: 10, textAnchor: 'middle', dominantBaseline: 'middle' } as const;

/** Fades `target` in from 5px below at `at` seconds: the common reveal step of the illustrations. */
export function reveal(tl: gsap.core.Timeline, target: string, at: number) {
  tl.from(target, { opacity: 0, y: 5, duration: 0.35 }, at);
}

/**
 * Adds a pulse that travels a straight wire (offset dx, dy from where the circle is drawn), `cycles`
 * times, then rests back at its start. Replaces SMIL animateMotion; uses only x/y inside the
 * visual's timeline.
 */
export function addPulse(tl: gsap.core.Timeline, target: string, dx: number, dy: number, at: number, dur: number, cycles: number) {
  tl.to(
    target,
    {
      keyframes: [
        { x: dx, y: dy, duration: dur, ease: 'none' },
        { x: 0, y: 0, duration: 0.001 },
      ],
      repeat: cycles - 1,
    },
    at,
  );
}
