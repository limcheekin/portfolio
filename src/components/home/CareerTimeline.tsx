import { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap';
import { MQ } from '../../lib/motion';
import { CAREER_INTRO } from '../../data/career';
import type { CareerEntry } from './types';

export default function CareerTimeline({ entries }: { entries: CareerEntry[] }) {
  const section = useRef<HTMLElement>(null);
  const timeline = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const sectionEl = section.current;
      const timelineEl = timeline.current;
      const fillEl = fill.current;
      if (!sectionEl || !timelineEl || !fillEl) return;
      const mm = gsap.matchMedia(sectionEl);

      // Reduced motion: nothing is set; the rail is already full and the dots already green.
      mm.add(MQ.motion, () => {
        const jobs = gsap.utils.toArray<HTMLElement>('.job', sectionEl);
        gsap.set(jobs, { opacity: 0, y: 24, scale: 0.98 });
        jobs.forEach((j) => j.setAttribute('data-pending', ''));

        ScrollTrigger.batch(jobs, {
          start: 'top 85%',
          once: true,
          onEnter: (els) => {
            els.forEach((el) => el.removeAttribute('data-pending'));
            gsap.to(els, { opacity: 1, y: 0, scale: 1, stagger: 0.12, duration: 0.7, ease: 'power3.out', overwrite: true });
          },
        });

        gsap.fromTo(
          fillEl,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: timelineEl, start: 'top 80%', end: 'bottom 80%', scrub: true },
          },
        );

        return () => {
          jobs.forEach((j) => j.removeAttribute('data-pending'));
        };
      });
    },
    { scope: section },
  );

  return (
    <section
      id="career"
      ref={section}
      className="mx-auto grid max-w-[1100px] gap-10 px-6 py-24 sm:px-10 md:grid-cols-[1fr_2fr] md:gap-[6vw] md:px-16 md:py-[16vh] lg:px-24"
    >
      <div className="md:sticky md:top-[14vh] md:self-start">
        <h2 className="mb-3.5 text-[clamp(28px,4vw,48px)] font-semibold tracking-tight text-lightest-slate">
          <span className="mr-3 align-middle font-mono text-[0.5em] text-green-accent">02</span>Career
        </h2>
        <p className="mb-5 max-w-[300px] leading-relaxed text-slate-text">{CAREER_INTRO}</p>
        <a href="/about/" className="text-sm text-green-accent hover:underline">Full experience →</a>
      </div>

      <div ref={timeline} className="relative pl-[34px]">
        <div aria-hidden="true" className="absolute bottom-1.5 left-1.5 top-1.5 w-0.5 bg-[#1c1c20]">
          <i
            ref={fill}
            className="absolute inset-0 origin-top bg-gradient-to-b from-green-accent to-green-accent/20"
          />
        </div>
        <ol className="m-0 list-none p-0">
          {entries.map((e, i) => (
            <li
              key={e.when}
              className={`job group relative ${i === entries.length - 1 ? 'pb-0' : 'pb-[46px]'}`}
            >
              <span
                aria-hidden="true"
                className="absolute -left-[34px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-green-accent bg-navy shadow-[0_0_0_4px_rgba(0,217,146,0.12)] group-data-[pending]:border-[#3a3a40] group-data-[pending]:shadow-none"
              />
              <div className="font-mono text-xs tracking-wide text-green-accent">{e.when}</div>
              <h3 className={e.condensed ? 'mb-0.5 mt-1.5 text-[17px] font-semibold text-light-slate' : 'mb-0.5 mt-1.5 text-[22px] font-semibold tracking-tight text-lightest-slate'}>
                {e.title}
              </h3>
              {e.org && <div className="text-[15px] text-light-slate">{e.org}</div>}
              <p className={`max-w-[560px] leading-relaxed text-slate-text ${e.condensed ? 'mt-1.5' : 'mt-2.5'}`}>{e.summary}</p>
              {e.chips && (
                <ul className="mt-3 flex list-none flex-wrap gap-2 p-0 font-mono">
                  {e.chips.map((c) => (
                    <li key={c} className="rounded-[5px] border border-[#26262b] px-2 py-1 text-[11px] text-light-slate">{c}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
