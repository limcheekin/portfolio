import { useRef } from 'react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { useMatchMedia } from '../../lib/use-match-media';
import { MQ } from '../../lib/motion';
import { GUTTER } from '../../lib/layout';
import SectionHeading from './SectionHeading';
import type { CareerEntry } from './types';

export default function CareerTimeline({ intro, entries }: { intro: string; entries: CareerEntry[] }) {
  const section = useRef<HTMLElement>(null);
  const timeline = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLElement>(null);

  useMatchMedia(section, (mm, sectionEl) => {
    const timelineEl = timeline.current;
    const fillEl = fill.current;
    if (!timelineEl || !fillEl) return;

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
  });

  return (
    <section
      id="career"
      ref={section}
      className={`mx-auto grid max-w-[1100px] gap-10 py-24 md:grid-cols-[1fr_2fr] md:gap-[6vw] md:py-[16vh] ${GUTTER}`}
    >
      <div className="md:sticky md:top-[14vh] md:self-start">
        <SectionHeading number="02" className="mb-3.5">Career</SectionHeading>
        <p className="mb-5 max-w-[300px] leading-relaxed text-slate-text">{intro}</p>
        <a href="/about/" className="text-sm text-green-accent hover:underline">Full experience →</a>
      </div>

      <div ref={timeline} className="relative pl-[34px]">
        <div aria-hidden="true" className="absolute bottom-1.5 left-1.5 top-1.5 w-0.5 bg-light-graphite">
          <i
            ref={fill}
            className="absolute inset-0 origin-top bg-gradient-to-b from-green-accent to-green-accent/20"
          />
        </div>
        <ol className="m-0 list-none p-0">
          {entries.map((e) => {
            const [titleCls, summaryMt] = e.condensed
              ? ['text-[17px] font-semibold text-light-slate', 'mt-1.5']
              : ['text-[22px] font-semibold tracking-tight text-lightest-slate', 'mt-2.5'];
            return (
              <li key={e.when} className="job group relative pb-[46px] last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[34px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-green-accent bg-navy shadow-halo group-data-[pending]:border-lightest-navy group-data-[pending]:shadow-none"
                />
                <div className="font-mono text-xs tracking-wide text-green-accent">{e.when}</div>
                <h3 className={`mb-0.5 mt-1.5 ${titleCls}`}>{e.title}</h3>
                {e.org && <div className="text-[15px] text-light-slate">{e.org}</div>}
                <p className={`max-w-[560px] leading-relaxed text-slate-text ${summaryMt}`}>{e.summary}</p>
                {e.chips && (
                  <ul className="mt-3 flex list-none flex-wrap gap-2 p-0 font-mono">
                    {e.chips.map((c) => (
                      <li key={c} className="rounded-[5px] border border-edge px-2 py-1 text-[11px] text-light-slate">{c}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
