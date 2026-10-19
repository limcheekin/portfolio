import type { ReactNode } from 'react';

/** "NN Title" heading of a numbered home section. Renders statically from .astro files and inside islands. */
export default function SectionHeading({ number, id, className = '', children }: { number: string; id?: string; className?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={`text-[clamp(28px,4vw,48px)] font-semibold leading-tight tracking-[-0.03em] text-lightest-slate ${className}`}>
      <span className="mr-3 align-middle font-mono text-[0.5em] text-green-accent">{number}</span>
      {children}
    </h2>
  );
}
