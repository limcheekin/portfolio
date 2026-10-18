import type { CareerEntry } from '../components/home/types';

export const CAREER_INTRO =
  'From enterprise Java and banking systems to agentic AI. The same job throughout: make complex systems work for the business.';

export const CAREER_HIGHLIGHTS: CareerEntry[] = [
  {
    when: '2026 — Present',
    title: 'AI Solutions Architect',
    org: 'Daxonet AI',
    summary: 'Enterprise agents for expense claims, trade documents and warehouse operations, plus company-wide AI enablement.',
    chips: ['Claude Agent SDK', 'MCP', 'Gemini', 'FastAPI'],
  },
  {
    when: '2021 — 2025',
    title: 'Principal AI Architect',
    org: 'Independent Consultant',
    summary: 'MCP for enterprise databases, real-time voice AI, self-hosted RAG, and a healthcare agent on GKE.',
    chips: ['RAG', 'Voice AI', 'GKE', 'Ragas'],
  },
  {
    when: '2013 — 2020',
    title: 'Senior Java Tech Lead',
    org: 'DXC Technology',
    summary: 'Led 6+ engineers across China, Europe and Malaysia on an enterprise analytics console.',
    chips: ['Spring Boot', 'AWS', 'Microservices'],
  },
  {
    when: '2012 — 2013',
    title: 'Senior Java Tech Lead',
    org: 'Zurich Technology Services',
    summary: 'Resolved 60+ cross-service production issues in claims systems.',
  },
  {
    when: '2005 — 2012',
    title: 'Open source, banking and healthcare delivery',
    summary: '10+ open-source Grails plugins · RM6M and RM2M banking tenders at Penril · RM2M hospital inventory system at CMG Online.',
    condensed: true,
  },
  {
    when: '1999 — 2005',
    title: 'Where it started',
    summary: 'Siemens Multimedia, Media Trend, Online One and Tee Yam Holding.',
    condensed: true,
  },
];
