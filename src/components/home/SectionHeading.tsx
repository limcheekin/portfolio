import type { ReactNode } from 'react';

/**
 * "NN Title" heading of a numbered home section. Renders statically from .astro files and inside islands.
 * The number is decorative (aria-hidden); the sr-only space keeps extracted text "01 Selected Work", not "01Selected Work".
 */
export default function SectionHeading({ number, id, className = '', children }: { number: string; id?: string; className?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={`text-[clamp(28px,4vw,48px)] font-semibold leading-tight tracking-[-0.03em] text-lightest-slate ${className}`}>
      <span aria-hidden="true" className="mr-3 align-middle font-mono text-[0.5em] text-green-accent">{number}</span>
      <span className="sr-only"> </span>
      {children}
    </h2>
  );
}
