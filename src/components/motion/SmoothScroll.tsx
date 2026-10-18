import { useEffect, useRef } from 'react';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from '../../lib/gsap';

export default function SmoothScroll() {
  const lenisRef = useRef<LenisRef>(null);

  // Keep ScrollTrigger in sync on every Lenis scroll event.
  useLenis(ScrollTrigger.update);

  // Drive Lenis from the GSAP ticker (seconds -> milliseconds) and refresh
  // triggers once layout settles (window load, web fonts ready).
  useEffect(() => {
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener('load', refresh);
    };
  }, []);

  return <ReactLenis root options={{ autoRaf: false, anchors: true }} ref={lenisRef} />;
}
