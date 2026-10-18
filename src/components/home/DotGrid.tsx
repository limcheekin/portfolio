import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { MQ } from '../../lib/motion';

const RADIUS = 160;
const SPRING = 0.06;
const DAMPING = 0.82;
const BASE = 'rgba(139,148,158,0.22)';
const INTERACTIVE = `${MQ.motion} and ${MQ.finePointer}`;
const STATIC = `${MQ.reduce}, not all and ${MQ.finePointer}`;

interface Dot { ox: number; oy: number; x: number; y: number; vx: number; vy: number }

export default function DotGrid({ gap = 30, opacity = 0.35 }: { gap?: number; opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      const host = canvas.closest('section') ?? canvas.parentElement ?? canvas;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let dots: Dot[] = [];
      let w = 0;
      let h = 0;
      let mx = -9999;
      let my = -9999;

      const build = () => {
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dots = [];
        for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
      };

      const draw = (physics: boolean) => {
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
          if (physics) {
            const dx = d.x - mx;
            const dy = d.y - my;
            const dist = Math.hypot(dx, dy);
            if (dist < RADIUS) {
              const f = (1 - dist / RADIUS) * 2.2;
              d.vx += (dx / (dist || 1)) * f;
              d.vy += (dy / (dist || 1)) * f;
            }
            d.vx += (d.ox - d.x) * SPRING;
            d.vy += (d.oy - d.y) * SPRING;
            d.vx *= DAMPING;
            d.vy *= DAMPING;
            d.x += d.vx;
            d.y += d.vy;
          }
          const near = physics ? Math.max(0, 1 - Math.hypot(d.ox - mx, d.oy - my) / (RADIUS * 1.3)) : 0;
          ctx.fillStyle = near > 0 ? `rgba(0,217,146,${0.25 + near * 0.75})` : BASE;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.3 + near * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const mm = gsap.matchMedia(canvas);

      mm.add(INTERACTIVE, () => {
        let visible = false;
        let running = false;
        const frame = () => draw(true);
        const sync = () => {
          const should = visible && !document.hidden;
          if (should && !running) gsap.ticker.add(frame);
          else if (!should && running) gsap.ticker.remove(frame);
          running = should;
        };
        const onMove = (e: Event) => {
          const p = e as PointerEvent;
          const r = canvas.getBoundingClientRect();
          mx = p.clientX - r.left;
          my = p.clientY - r.top;
        };
        const onLeave = () => { mx = my = -9999; };

        build();
        draw(true);
        const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; sync(); });
        io.observe(canvas);
        const ro = new ResizeObserver(() => { build(); draw(true); });
        ro.observe(canvas);
        host.addEventListener('pointermove', onMove);
        host.addEventListener('pointerleave', onLeave);
        document.addEventListener('visibilitychange', sync);

        return () => {
          if (running) gsap.ticker.remove(frame);
          io.disconnect();
          ro.disconnect();
          host.removeEventListener('pointermove', onMove);
          host.removeEventListener('pointerleave', onLeave);
          document.removeEventListener('visibilitychange', sync);
        };
      });

      mm.add(STATIC, () => {
        // Draw once and stop; redraw only on resize.
        build();
        draw(false);
        const ro = new ResizeObserver(() => { build(); draw(false); });
        ro.observe(canvas);
        return () => ro.disconnect();
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [gap], revertOnUpdate: true },
  );

  return <canvas ref={ref} aria-hidden="true" style={{ opacity }} className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block" />;
}
