/** Horizontal page gutter shared by the home sections; `--gutter` is set per breakpoint in global.css. */
export const GUTTER = 'px-[var(--gutter)]';

/** The <main> of every inner page: a centred column inside the same gutter, clear of the fixed header. */
export const PAGE_MAIN = `mx-auto min-h-screen max-w-screen-lg pt-32 pb-20 ${GUTTER}`;
