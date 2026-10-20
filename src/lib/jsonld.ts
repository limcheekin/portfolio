import { ENGINEER_NAME, SITE_URL } from '../data/site';

/** Stable JSON-LD node ids, so every page's mentions of the owner and the site merge into one entity. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** The owner as author/publisher: the id plus the name, for consumers that do not follow ids across pages. */
export const PERSON_REF = { '@type': 'Person', '@id': PERSON_ID, name: ENGINEER_NAME } as const;

/** The page node for `path` ("/about/"), part of the site, with its own id for other nodes to point at. */
export function webPageJsonLd(path: string, type = 'WebPage', extra: Record<string, unknown> = {}) {
  const url = `${SITE_URL}${path}`;
  return { '@context': 'https://schema.org', '@type': type, '@id': `${url}#webpage`, url, isPartOf: { '@id': WEBSITE_ID }, ...extra };
}

/** BreadcrumbList from Home (the canonical root URL, with its trailing slash) through each [name, path]. */
export function breadcrumbJsonLd(...trail: Array<[name: string, path: string]>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'], ...trail].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  };
}
