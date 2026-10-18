import { useRef } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { MQ } from '../../lib/motion';

export default function MagnetButton({ href, label }: { href: string; label: string }) {
  const zone = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLAnchorElement>(null);
  const labelEl = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const zoneEl = zone.current;
      const b = btn.current;
      const l = labelEl.current;
      const a = arrow.current;
      if (!zoneEl || !b || !l || !a || !contextSafe) return;
      const mm = gsap.matchMedia(zoneEl);

      mm.add(`${MQ.finePointer} and ${MQ.motion}`, () => {
        const opts = { duration: 0.4, ease: 'power3' };
        const bx = gsap.quickTo(b, 'x', opts);
        const by = gsap.quickTo(b, 'y', opts);
        const lx = gsap.quickTo(l, 'x', opts);
        const ly = gsap.quickTo(l, 'y', opts);
        const ax = gsap.quickTo(a, 'x', opts);
        const ay = gsap.quickTo(a, 'y', opts);

        const onMove = contextSafe((e: PointerEvent) => {
          const r = b.getBoundingClientRect();
          // The rect includes the current translate; remove it to get the rest centre.
          const cx = r.left + r.width / 2 - (gsap.getProperty(b, 'x') as number);
          const cy = r.top + r.height / 2 - (gsap.getProperty(b, 'y') as number);
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          bx(dx * 0.3);
          by(dy * 0.4);
          lx(dx * 0.08);
          ly(dy * 0.08);
          ax(4 + dx * 0.1);
          ay(dy * 0.08);
        });
        const onLeave = contextSafe(() => {
          bx(0);
          by(0);
          lx(0);
          ly(0);
          ax(0);
          ay(0);
        });

        zoneEl.addEventListener('pointermove', onMove);
        zoneEl.addEventListener('pointerleave', onLeave);
        return () => {
          zoneEl.removeEventListener('pointermove', onMove);
          zoneEl.removeEventListener('pointerleave', onLeave);
          gsap.set([b, l, a], { clearProps: 'transform' });
        };
      });
    },
    { scope: zone },
  );

  return (
    <div ref={zone} className="px-[60px] py-[30px] max-sm:px-6">
      <a
        ref={btn}
        href={href}
        data-testid="hero-contact-cta"
        className="inline-flex items-center gap-[10px] rounded-full bg-green-accent px-[34px] py-5 font-mono text-base font-semibold text-[#050507] no-underline shadow-[0_10px_40px_rgba(0,217,146,0.25)]"
      >
        <span ref={labelEl} className="inline-block">{label}</span>
        <span ref={arrow} className="inline-block" aria-hidden="true">→</span>
      </a>
    </div>
  );
}
