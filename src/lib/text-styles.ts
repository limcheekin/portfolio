/** The h1 of every inner page (About, Projects, a project, Writing, an article, Contact). */
export const PAGE_TITLE = 'text-[clamp(32px,4.5vw,48px)] font-semibold leading-tight tracking-[-0.03em] text-lightest-slate';

/**
 * Reading measure for prose, leads and descriptions: about 70–75 characters a line at any size. Inter's `ch`
 * (the width of "0") is wider than its average letter, so 65ch ran to ~85 characters.
 */
export const MEASURE = 'max-w-[56ch]';

/**
 * A small text link (12–14px mono) with a 44px-tall tap area. Rows of them use no vertical gap, so wrapped
 * rows sit one tap area apart; a lone link adds `-my-3` to keep its line height in the layout.
 */
export const TAP_LINK = 'inline-flex min-h-11 items-center';

/** A small bordered chip: technologies, skills and tags. */
export const CHIP = 'rounded-[5px] border border-edge px-2 py-1 font-mono text-[11px] text-light-slate';
