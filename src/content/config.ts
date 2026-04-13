import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    featuredOrder: z.number().optional(),
    technologies: z.array(z.string()),
    githubUrl: z.string().url().optional(),
    liveUrl: z.string().url().optional(),
    articleUrl: z.string().url().optional(),
    image: z.string().optional(),
    category: z.string(),
    dateStarted: z.string().optional(),
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
