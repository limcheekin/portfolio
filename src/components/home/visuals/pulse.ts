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
