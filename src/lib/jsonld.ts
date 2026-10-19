import { ENGINEER_NAME, SITE_URL } from '../data/site';

/** Stable JSON-LD node ids, so every page's mentions of the owner and the site merge into one entity. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** The owner as author/publisher: the id plus the name, for consumers that do not follow ids across pages. */
export const PERSON_REF = { '@type': 'Person', '@id': PERSON_ID, name: ENGINEER_NAME } as const;
