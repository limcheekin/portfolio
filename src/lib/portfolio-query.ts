import { SITE_URL } from '../data/site';
import type { ProjectKind } from './project-kind';
import type { Article, Portfolio, Project } from './portfolio-schema';

/**
 * Read-only queries over /api/portfolio.json, and the tool handlers built on them. Shared by the in-browser
 * WebMCP tools (WebMCPTools.tsx) and the MCP server (mcp/server.ts), so both answer the same way; the tools'
 * names, descriptions and schemas live in portfolio-tools.ts. Pure functions with type-only schema imports,
 * so no zod reaches the browser bundle.
 */

const has = (haystack: string | undefined, needle: string) => (haystack ?? '').toLowerCase().includes(needle);
const anyHas = (values: string[], needle: string) => values.some((v) => has(v, needle));

export function listProjects(data: Portfolio, filter: { kind?: ProjectKind; technology?: string } = {}): Project[] {
  const tech = filter.technology?.trim().toLowerCase();
  return data.projects.filter((p) => (!filter.kind || p.kind === filter.kind) && (!tech || anyHas(p.technologies, tech)));
}

export function getProject(data: Portfolio, slug: string): Project | undefined {
  return data.projects.find((p) => p.slug === slug);
}

/** Articles, newest first, optionally limited to those with a matching tag. */
export function listArticles(data: Portfolio, filter: { tag?: string } = {}): Article[] {
  const tag = filter.tag?.trim().toLowerCase();
  return data.articles
    .filter((a) => !tag || anyHas(a.tags, tag))
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
}

/** Case-insensitive substring search over projects, articles and experience. */
export function searchPortfolio(data: Portfolio, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { query, projects: [], articles: [], experience: [] };
  return {
    query,
    projects: data.projects.filter(
      (p) => has(p.title, q) || has(p.description, q) || has(p.tagline, q) || anyHas(p.technologies, q),
    ),
    articles: listArticles(data).filter((a) => has(a.title, q) || has(a.description, q) || anyHas(a.tags, q)),
    experience: data.experience.filter(
      (e) => has(e.title, q) || has(e.company, q) || anyHas(e.description, q) || anyHas(e.technologies, q),
    ),
  };
}

/** Tool handlers: input in, the tool's structured result out. A thrown Error is reported as a tool error. */
export const TOOL_HANDLERS = {
  get_projects: (data: Portfolio, input: { kind?: ProjectKind; technology?: string }) => {
    const projects = listProjects(data, input);
    return { count: projects.length, projects };
  },
  get_project: (data: Portfolio, { slug }: { slug: string }) => {
    const project = getProject(data, slug);
    if (!project) throw new Error(`No project "${slug}". Known slugs: ${data.projects.map((p) => p.slug).join(', ')}`);
    return { project };
  },
  get_experience: (data: Portfolio) => ({ count: data.experience.length, experience: data.experience }),
  get_articles: (data: Portfolio, input: { tag?: string }) => {
    const articles = listArticles(data, input);
    return { count: articles.length, articles };
  },
  search_portfolio: (data: Portfolio, { query }: { query: string }) => searchPortfolio(data, query),
  get_contact_info: (data: Portfolio) => ({
    name: data.name,
    title: data.title,
    email: data.email,
    ...data.urls,
    contactPage: `${SITE_URL}/contact/`,
  }),
};

export type ToolName = keyof typeof TOOL_HANDLERS;

/** Runs a tool by name; `input` has already been validated against the tool's input schema. */
export const runTool = (name: ToolName, data: Portfolio, input: object = {}): Record<string, unknown> =>
  (TOOL_HANDLERS[name] as (data: Portfolio, input: object) => Record<string, unknown>)(data, input);
