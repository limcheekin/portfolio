import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { MQ } from '../../lib/motion';

const RADIUS = 160;
const RADIUS_SQ = RADIUS * RADIUS;
const GLOW = RADIUS * 1.3; // dots whose origin is within this distance of the pointer light up
const GLOW_SQ = GLOW * GLOW;
const REST = 0.01; // px and px/frame below which a dot counts as settled
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

      // Advances the physics (when `physics`) and draws one frame. At-rest dots share one path and one
      // fill. Returns true when every dot is back at its origin and still.
      const draw = (physics: boolean): boolean => {
        ctx.clearRect(0, 0, w, h);
        let settled = true;
        const lit: Array<[Dot, number]> = [];
        ctx.fillStyle = BASE;
        ctx.beginPath();
        for (const d of dots) {
          if (physics) {
            const dx = d.x - mx;
            const dy = d.y - my;
            const sq = dx * dx + dy * dy;
            if (sq < RADIUS_SQ) {
              const dist = Math.sqrt(sq);
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
            if (settled && (Math.abs(d.vx) > REST || Math.abs(d.vy) > REST || Math.abs(d.x - d.ox) > REST || Math.abs(d.y - d.oy) > REST)) settled = false;
          }
          let near = 0;
          if (physics) {
            const nx = d.ox - mx;
            const ny = d.oy - my;
            const sq = nx * nx + ny * ny;
            if (sq < GLOW_SQ) near = 1 - Math.sqrt(sq) / GLOW;
          }
          if (near > 0) lit.push([d, near]);
          else {
            ctx.moveTo(d.x + 1.3, d.y);
            ctx.arc(d.x, d.y, 1.3, 0, Math.PI * 2);
          }
        }
        ctx.fill();
        for (const [d, near] of lit) {
          ctx.fillStyle = `rgba(0,217,146,${0.25 + near * 0.75})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.3 + near * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        return settled;
      };

      // Calls `fn` on every canvas resize (and once when observing starts); returns the disconnect.
      const onResize = (fn: () => void) => {
        const ro = new ResizeObserver(fn);
        ro.observe(canvas);
        return () => ro.disconnect();
      };

      const mm = gsap.matchMedia(canvas);

      mm.add(INTERACTIVE, () => {
        let visible = false;
        let running = false;
        // Idle: pointer away and every dot settled. The ticker is detached until the pointer returns or
        // the canvas resizes.
        let idle = true;
        let away = true;
        // Latest pointer position in client coordinates; converted to canvas space once per frame.
        let cx = 0;
        let cy = 0;
        let moved = false;

        const sync = () => {
          const should = visible && !document.hidden && !idle;
          if (should && !running) gsap.ticker.add(frame);
          else if (!should && running) gsap.ticker.remove(frame);
          running = should;
        };
        const wake = () => {
          if (!idle) return;
          idle = false;
          sync();
        };
        const frame = () => {
          if (moved) {
            const r = canvas.getBoundingClientRect();
            mx = cx - r.left;
            my = cy - r.top;
            moved = false;
          }
          if (draw(true) && away) {
            // Snap the last sub-pixel remainder, draw the final frame and detach.
            for (const d of dots) { d.x = d.ox; d.y = d.oy; d.vx = d.vy = 0; }
            draw(false);
            idle = true;
            sync();
          }
        };
        const onMove = (e: Event) => {
          const p = e as PointerEvent;
          cx = p.clientX;
          cy = p.clientY;
          moved = true;
          away = false;
          wake();
        };
        const onLeave = () => {
          mx = my = -9999;
          moved = false;
          away = true;
        };

        build();
        draw(true);
        const io = new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; sync(); });
        io.observe(canvas);
        const unobserve = onResize(() => { build(); draw(true); wake(); });
        host.addEventListener('pointermove', onMove);
        host.addEventListener('pointerenter', onMove);
        host.addEventListener('pointerleave', onLeave);
        document.addEventListener('visibilitychange', sync);

        return () => {
          if (running) gsap.ticker.remove(frame);
          io.disconnect();
          unobserve();
          host.removeEventListener('pointermove', onMove);
          host.removeEventListener('pointerenter', onMove);
          host.removeEventListener('pointerleave', onLeave);
          document.removeEventListener('visibilitychange', sync);
        };
      });

      mm.add(STATIC, () => {
        // Draw once and stop; redraw only on resize.
        build();
        draw(false);
        return onResize(() => { build(); draw(false); });
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [gap], revertOnUpdate: true },
  );

  return <canvas ref={ref} aria-hidden="true" style={{ opacity }} className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block" />;
}
