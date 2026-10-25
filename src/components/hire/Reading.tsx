import type { MouseEvent } from 'react';
import type { ReadingKey } from '../../lib/hire/reasons';

/**
 * Scroll to the footnote and focus it without touching the URL: the fragment holds the answers (`#a=`), so a hash
 * navigation would replace the report link and add a history entry that Back would reload. The href stays as the
 * fallback before hydration.
 */
function toFootnote(e: MouseEvent<HTMLAnchorElement>, k: ReadingKey) {
  const target = document.getElementById(`reading-${k}`);
  if (!target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  target.scrollIntoView({ block: 'start' });
  target.focus({ preventScroll: true });
}

/** The small "this tool's reading" label on every rule the tool adds; it leads to the footnote on the page. */
export default function Reading({ k }: { k: ReadingKey }) {
  return (
    <a
      href={`#reading-${k}`}
      onClick={(e) => toFootnote(e, k)}
      data-reading={k}
      className="inline-block whitespace-nowrap rounded-[5px] border border-edge px-1.5 py-1 font-mono text-[11px] leading-4 text-slate-text no-underline transition-colors duration-250 hover:border-green-accent hover:text-green-accent"
    >
      this tool's reading
    </a>
  );
}
