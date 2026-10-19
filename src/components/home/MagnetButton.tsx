import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { MQ } from '../../lib/motion';

export default function MagnetButton({ href, label }: { href: string; label: string }) {
  const zone = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const zoneEl = zone.current;
      const btnEl = btnRef.current;
      const labelEl = labelRef.current;
      const arrowEl = arrowRef.current;
      if (!zoneEl || !btnEl || !labelEl || !arrowEl || !contextSafe) return;
      const mm = gsap.matchMedia(zoneEl);

      mm.add(`${MQ.finePointer} and ${MQ.motion}`, () => {
        const opts = { duration: 0.4, ease: 'power3' };
        // Each part follows the pointer offset from the button's rest centre by its own factors;
        // `ox` is a constant x nudge (the arrow leans right while the pointer is inside).
        const parts = ([[btnEl, 0.3, 0.4, 0], [labelEl, 0.08, 0.08, 0], [arrowEl, 0.1, 0.08, 4]] as const).map(([el, kx, ky, ox]) => ({
          x: gsap.quickTo(el, 'x', opts),
          y: gsap.quickTo(el, 'y', opts),
          kx,
          ky,
          ox,
        }));

        const onMove = contextSafe((e: PointerEvent) => {
          const r = btnEl.getBoundingClientRect();
          // The rect includes the current translate; remove it to get the rest centre.
          const cx = r.left + r.width / 2 - (gsap.getProperty(btnEl, 'x') as number);
          const cy = r.top + r.height / 2 - (gsap.getProperty(btnEl, 'y') as number);
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          for (const p of parts) {
            p.x(p.ox + dx * p.kx);
            p.y(dy * p.ky);
          }
        });
        const onLeave = contextSafe(() => {
          for (const p of parts) {
            p.x(0);
            p.y(0);
          }
        });

        zoneEl.addEventListener('pointermove', onMove);
        zoneEl.addEventListener('pointerleave', onLeave);
        return () => {
          zoneEl.removeEventListener('pointermove', onMove);
          zoneEl.removeEventListener('pointerleave', onLeave);
          gsap.set([btnEl, labelEl, arrowEl], { clearProps: 'transform' });
        };
      });
    },
    { scope: zone },
  );

  return (
    <div ref={zone} className="px-6 py-[30px] sm:px-[60px]">
      <a
        ref={btnRef}
        href={href}
        data-testid="hero-contact-cta"
        className="inline-flex items-center gap-[10px] rounded-full bg-green-accent px-[34px] py-5 font-mono text-base font-semibold text-navy no-underline shadow-magnet"
      >
        <span ref={labelRef} className="inline-block">{label}</span>
        <span ref={arrowRef} className="inline-block" aria-hidden="true">→</span>
      </a>
    </div>
  );
}
