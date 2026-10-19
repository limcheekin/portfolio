import { defineCollection, z } from 'astro:content';
import { DEFAULT_PROJECT_KIND, PROJECT_KINDS } from '../lib/project-kind';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    featuredOrder: z.number().optional(),
    technologies: z.array(z.string()),
    /** Programming languages of an open-source project (schema.org programmingLanguage). */
    languages: z.array(z.string()).optional(),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    articleUrl: z.string().url().optional(),
    image: z.string().optional(),
    category: z.string(),
    dateStarted: z.string().optional(),
    kind: z.enum(PROJECT_KINDS).default(DEFAULT_PROJECT_KIND),
    org: z.string().optional(),
    tagline: z.string().optional(),
    stack: z.array(z.string()).min(3).max(4).optional(),
    visual: z.enum(['claim', 'trade', 'ware', 'agent', 'concord', 'talk', 'rag']).optional(),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    externalUrl: z.string().url().optional(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()),
    image: z.string().optional(),
    platform: z.string().optional(),
    type: z.enum(["Article", "Talk", "Slides"]).default("Article"),
  }),
});

const experience = defineCollection({
  type: 'data',
  schema: z.object({
    company: z.string(),
    title: z.string(),
    location: z.string().optional(),
    companyUrl: z.string().url().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.array(z.string()),
    technologies: z.array(z.string()),
    sortOrder: z.number(),
  }),
});

export const collections = { projects, articles, experience };
