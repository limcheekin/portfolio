import { z } from 'zod';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { EMAIL_ADDRESS, ENGINEER_NAME, ENGINEER_TITLE, SITE_URL } from '../data/site';
import { PROJECT_KINDS } from './project-kind';
import { ArticleSchema, ExperienceSchema, ProjectSchema } from './portfolio-schema';
import type { ToolName } from './portfolio-query';

/**
 * The one list of portfolio tools and resources. mcp/server.ts registers them, BaseLayout hands their JSON
 * Schemas to the WebMCP island, and scripts/generate-api.ts writes /.well-known/mcp.json from them. The
 * handlers are TOOL_HANDLERS in portfolio-query.ts. Build time and server only (imports zod).
 */
export const MCP_SERVER = { name: 'kin-portfolio', title: `${ENGINEER_NAME} Portfolio`, version: '1.0.0', url: `${SITE_URL}/mcp` };
/** nginx enforces this on /mcp (nginx.conf `limit_req_zone ... rate=60r/m`, `burst=30`). */
export const MCP_RATE_LIMIT = { requests: 60, windowSeconds: 60, burst: 30 };

export const MCP_INSTRUCTIONS =
  `Read-only data about ${ENGINEER_NAME}, ${ENGINEER_TITLE} at Daxonet AI: projects (enterprise and open source), ` +
  'work experience, articles and contact details. Use search_portfolio for keyword questions, get_project for one ' +
  'project by slug, and the portfolio:// resources for whole collections.';

interface ToolDef {
  title: string;
  description: string;
  input: z.ZodRawShape;
  output: z.ZodRawShape;
}

const slug = z.string().max(100);
const text = (description: string) => z.string().max(100).optional().describe(description);

export const MCP_TOOLS: Record<ToolName, ToolDef> = {
  get_projects: {
    title: 'List projects',
    description: `Projects by ${ENGINEER_NAME}, optionally filtered by kind (enterprise or oss) or by a technology (substring match, e.g. "MCP", "Python").`,
    input: {
      kind: z.enum(PROJECT_KINDS).optional().describe('enterprise or oss'),
      technology: text('Technology to match, case-insensitive substring'),
    },
    output: { count: z.number(), projects: z.array(ProjectSchema) },
  },
  get_project: {
    title: 'Get one project',
    description: 'One project by slug (see get_projects or the portfolio://projects/{slug} resources for slugs).',
    input: { slug: slug.describe('Project slug, e.g. "claim-pilot"') },
    output: { project: ProjectSchema },
  },
  get_experience: {
    title: 'Work experience',
    description: `Work history of ${ENGINEER_NAME}, newest first, with responsibilities and technologies for each role.`,
    input: {},
    output: { count: z.number(), experience: z.array(ExperienceSchema) },
  },
  get_articles: {
    title: 'List articles',
    description: `Articles by ${ENGINEER_NAME}, newest first, optionally filtered by tag (substring match, e.g. "MCP", "RAG").`,
    input: { tag: text('Tag to match, case-insensitive substring') },
    output: { count: z.number(), articles: z.array(ArticleSchema) },
  },
  search_portfolio: {
    title: 'Search the portfolio',
    description: 'Case-insensitive keyword search across projects, articles and work experience.',
    input: { query: z.string().min(1).max(200).describe('Keyword or phrase, e.g. "WhatsApp" or "voice AI"') },
    output: {
      query: z.string(),
      projects: z.array(ProjectSchema),
      articles: z.array(ArticleSchema),
      experience: z.array(ExperienceSchema),
    },
  },
  get_contact_info: {
    title: 'Contact details',
    description: `How to contact ${ENGINEER_NAME}: email, GitHub, LinkedIn, Medium and the contact page.`,
    input: {},
    output: {
      name: z.string(),
      title: z.string(),
      email: z.string(),
      github: z.string(),
      linkedin: z.string(),
      medium: z.string(),
      contactPage: z.string(),
    },
  },
};

export const toolEntries = () => Object.entries(MCP_TOOLS) as Array<[ToolName, ToolDef]>;

/** Name, description and JSON Schema input of each tool: what the browser-side WebMCP island needs. */
export const webMcpTools = () =>
  toolEntries().map(([name, t]) => ({ name, description: t.description, inputSchema: z.toJSONSchema(z.object(t.input)) }));

/** Static resources, served at portfolio://<name>; the per-project template is portfolio://projects/{slug}. */
export const MCP_RESOURCES = [
  { name: 'portfolio', title: 'Full portfolio', description: 'Everything in /api/portfolio.json', mimeType: 'application/json' },
  { name: 'projects', title: 'Projects', description: 'All projects', mimeType: 'application/json' },
  { name: 'experience', title: 'Work experience', description: 'Work history, newest first', mimeType: 'application/json' },
  { name: 'articles', title: 'Articles', description: 'Articles, newest first', mimeType: 'application/json' },
  { name: 'llms-full', title: 'Full content (llms-full.txt)', description: 'All portfolio prose as Markdown-style text', mimeType: 'text/plain' },
] as const;
export type ResourceName = (typeof MCP_RESOURCES)[number]['name'];
export const PROJECT_RESOURCE_TEMPLATE = 'portfolio://projects/{slug}';

/** /.well-known/mcp.json, written by scripts/generate-api.ts. */
export function mcpManifest(httpResources: Array<{ uri: string; name: string; description: string; mimeType: string }>) {
  return {
    name: MCP_SERVER.title,
    description: `Read-only MCP server with portfolio data for ${ENGINEER_NAME}, ${ENGINEER_TITLE} at Daxonet AI: projects, work experience, articles and contact details.`,
    url: MCP_SERVER.url,
    transport: { type: 'streamable-http', url: MCP_SERVER.url, stateless: true, methods: ['POST'] },
    protocolVersion: LATEST_PROTOCOL_VERSION,
    serverInfo: { name: MCP_SERVER.name, version: MCP_SERVER.version },
    authentication: { type: 'none' },
    rateLimit: MCP_RATE_LIMIT,
    capabilities: { tools: true, resources: true },
    tools: toolEntries().map(([name, t]) => ({ name, description: t.description })),
    resources: [
      ...MCP_RESOURCES.map((r) => ({ uri: `portfolio://${r.name}`, name: r.title, mimeType: r.mimeType })),
      { uri: PROJECT_RESOURCE_TEMPLATE, name: 'One project (template)', mimeType: 'application/json' },
    ],
    httpResources,
    documentation: `${SITE_URL}/llms.txt`,
    contact: { email: EMAIL_ADDRESS, url: `${SITE_URL}/contact/` },
  };
}
