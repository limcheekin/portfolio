/** Screen-reader suffix for links that open a new tab (Link.astro, and React islands that render their own links). */
export const NEW_TAB_HINT = ' (opens in a new tab)';

/** Web links leave the site, so they open in a new tab; mailto: and site paths stay in place. */
export const opensNewTab = (href: string) => href.startsWith('http');
