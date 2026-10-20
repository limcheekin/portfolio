import { getCollection } from 'astro:content';
import { EMAIL_ADDRESS, ENGINEER_NAME, ENGINEER_TITLE, SITE_URL, SOCIAL_LINKS } from '../data/site';
import { PERSON_ID } from './jsonld';

/** Employers named in the Person node, by experience entry, so their names match the About page. */
const CURRENT_EMPLOYER = '00-daxonet';
const PAST_EMPLOYERS = ['02-dxc-tech-lead', '03-zurich-tech-lead', '05-penril-consultant', '08-siemens'];

/** The site owner, the same node on every page that describes him (home and About). */
export async function personJsonLd() {
  const jobs = new Map((await getCollection('experience')).map((e) => [e.id, e.data]));
  const org = (id: string) => {
    const job = jobs.get(id);
    if (!job) throw new Error(`person-jsonld: no experience entry "${id}"`);
    return { '@type': 'Organization', name: job.company, ...(job.companyUrl && { url: job.companyUrl }) };
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: ENGINEER_NAME,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/images/profile.png`,
    jobTitle: ENGINEER_TITLE,
    description: `${ENGINEER_TITLE} focused on enterprise AI, conversational agents and business workflow integration.`,
    email: `mailto:${EMAIL_ADDRESS}`,
    knowsAbout: [
      'Artificial Intelligence', 'Machine Learning', 'Retrieval-Augmented Generation',
      'LLM Deployment', 'Python', 'Java', 'Spring', 'React', 'TypeScript',
      'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Model Context Protocol',
    ],
    worksFor: { ...org(CURRENT_EMPLOYER), '@id': `${SITE_URL}/#employer` },
    alumniOf: PAST_EMPLOYERS.map(org),
    contactPoint: {
      '@type': 'ContactPoint',
      email: EMAIL_ADDRESS,
      contactType: 'professional inquiry',
      availableLanguage: ['English'],
      url: `${SITE_URL}/contact/`,
    },
    sameAs: SOCIAL_LINKS.map((l) => l.url),
  };
}
