import { z } from 'zod';
import { PROJECT_KINDS } from './project-kind';

/**
 * Shape of /api/portfolio.json: the one definition behind scripts/generate-api.ts (`satisfies Portfolio`),
 * the MCP tools' output schemas, the shared queries (types only) and the verify:dist check.
 * Uses zod at build time and in the MCP server; browser code imports the types only.
 */
export const ProjectSchema = z.object({
  title: z.string(),
  slug: z.string(),
  url: z.string().describe('Project page on kin.rag.wtf'),
  summary: z.string().describe('One sentence, at most 160 characters'),
  description: z.string(),
  featured: z.boolean(),
  kind: z.enum(PROJECT_KINDS).describe('enterprise: closed system built at Daxonet AI; oss: open source'),
  org: z.string().optional(),
  tagline: z.string().optional(),
  technologies: z.array(z.string()),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  category: z.string().optional(),
});

export const ArticleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  url: z.string().describe('Summary page on kin.rag.wtf'),
  description: z.string(),
  externalUrl: z.string().optional().describe('Full article (Medium)'),
  publishDate: z.string().describe('ISO 8601 date-time'),
  tags: z.array(z.string()),
});

export const ExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string().describe('YYYY-MM'),
  endDate: z.string().optional().describe('YYYY-MM; absent for the current role'),
  description: z.array(z.string()).describe('Responsibilities and outcomes'),
  technologies: z.array(z.string()),
});

export const PortfolioSchema = z.object({
  name: z.string(),
  title: z.string(),
  email: z.string(),
  urls: z.object({ github: z.string(), linkedin: z.string(), medium: z.string() }),
  projects: z.array(ProjectSchema),
  articles: z.array(ArticleSchema),
  experience: z.array(ExperienceSchema),
  metadata: z.object({ generatedAt: z.string(), version: z.string() }),
});

export type Project = z.infer<typeof ProjectSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
