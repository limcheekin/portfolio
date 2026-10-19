import { useEffect, useRef } from 'react';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { MQ } from '../../lib/motion';

export default function SmoothScroll() {
  const lenisRef = useRef<LenisRef>(null);

  // Keep ScrollTrigger in sync on every Lenis scroll event.
  const lenis = useLenis(ScrollTrigger.update);

  // Drive Lenis from the GSAP ticker (seconds -> milliseconds) and refresh triggers once web fonts
  // are ready (ScrollTrigger already refreshes on window load by itself).
  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  // Under reduced motion the wheel scrolls natively; Lenis itself only makes programmatic scrolls immediate.
  useEffect(() => {
    if (!lenis) return;
    const reduce = window.matchMedia(MQ.reduce);
    const apply = () => {
      lenis.options.smoothWheel = !reduce.matches;
    };
    apply();
    reduce.addEventListener('change', apply);
    return () => reduce.removeEventListener('change', apply);
  }, [lenis]);

  return <ReactLenis root options={{ autoRaf: false, anchors: true }} ref={lenisRef} />;
}
