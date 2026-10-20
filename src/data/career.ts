import { getCollection } from 'astro:content';
import type { CareerEntry } from '../components/home/types';
import { roleSlug, slugify } from '../lib/paths';

export const CAREER_INTRO =
  'From enterprise Java and banking systems to agentic AI. The same job throughout: make complex systems work for the business.';

// Home-page copy for each Career entry. Titles, organisations and dates come from the experience
// collection: a role names its entry; a condensed entry names the oldest and newest entries it spans.
type Highlight =
  | { role: string; summary: string; chips?: string[] }
  | { title: string; span: [oldest: string, newest: string]; summary: string };

const HIGHLIGHTS: Highlight[] = [
  {
    role: '00-daxonet',
    summary: 'Enterprise agents for expense claims, trade documents and warehouse operations, plus company-wide AI enablement.',
    chips: ['Claude Agent SDK', 'MCP', 'Gemini', 'FastAPI'],
  },
  {
    role: '01-ai-engineer',
    summary: 'MCP for enterprise databases, real-time voice AI, self-hosted RAG, and a healthcare agent on GKE.',
    chips: ['RAG', 'Voice AI', 'GKE', 'Ragas'],
  },
  {
    role: '02-dxc-tech-lead',
    summary: 'Led 6+ engineers across China, Europe and Malaysia on an enterprise analytics console.',
    chips: ['Spring Boot', 'AWS', 'Microservices'],
  },
  {
    role: '03-zurich-tech-lead',
    summary: 'Resolved 60+ cross-service production issues in claims systems.',
  },
  {
    title: 'Open source, banking and healthcare delivery',
    span: ['06-cmg-tech-lead', '04-independent'],
    summary: '10+ open-source Grails plugins · RM6M and RM2M banking tenders at Penril · RM2M hospital inventory system at CMG Online.',
  },
  {
    title: 'Where it started',
    span: ['10-tee-yam', '07-media-trend'],
    summary: 'Siemens Multimedia, Media Trend, Online One and Tee Yam Holding.',
  },
];

const when = (start: string, end?: string) => `${start.slice(0, 4)} — ${end ? end.slice(0, 4) : 'Present'}`;

/** The home Career entries, joined with the experience collection at build time. */
export async function getCareerEntries(): Promise<CareerEntry[]> {
  const jobs = new Map((await getCollection('experience')).map((e) => [e.id, e.data]));
  const job = (id: string) => {
    const data = jobs.get(id);
    if (!data) throw new Error(`career.ts: no experience entry "${id}"`);
    return data;
  };

  return HIGHLIGHTS.map((h): CareerEntry => {
    if ('role' in h) {
      const { title, company, startDate, endDate } = job(h.role);
      return { slug: roleSlug(h.role), when: when(startDate, endDate), title, org: company, summary: h.summary, chips: h.chips };
    }
    const [oldest, newest] = h.span.map(job);
    return { slug: slugify(h.title), when: when(oldest.startDate, newest.endDate), title: h.title, summary: h.summary, condensed: true };
  });
}
