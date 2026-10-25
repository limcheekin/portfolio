import type { ReadingKey } from '../../lib/hire/reasons';

/** The small "this tool's reading" label on every rule the tool adds; it links to the footnote on the page. */
export default function Reading({ k }: { k: ReadingKey }) {
  return (
    <a
      href={`#reading-${k}`}
      data-reading={k}
      className="inline-block whitespace-nowrap rounded-[5px] border border-edge px-1.5 py-1 font-mono text-[11px] leading-4 text-slate-text no-underline transition-colors duration-250 hover:border-green-accent hover:text-green-accent"
    >
      this tool's reading
    </a>
  );
}
