import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { DEFAULT_PROJECT_KIND, projectLabel } from '../src/lib/project-kind';
import { articlePath, markdownPath, projectPath, rolePath } from '../src/lib/paths';
import { ABOUT_CONTENT, EMAIL_ADDRESS, ENGINEER_NAME, ENGINEER_TITLE, SITE_URL } from '../src/data/site';
import { FAQ } from '../src/data/faq';
import type { Portfolio } from '../src/lib/portfolio-schema';
import { mcpManifest } from '../src/lib/portfolio-tools';
import { hireManifest } from '../src/lib/hire-tools';
import { HIRE_CREDIT_MARKDOWN, HIRE_DESCRIPTION, HIRE_INTRO, HIRE_PRIVACY_STATEMENT, checklistMarkdown } from '../src/lib/hire/copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const contentDir = join(rootDir, 'src', 'content');

// Read content files directly from source (not dist)
function readJsonFiles(dir: string) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ ...JSON.parse(readFileSync(join(dir, f), 'utf-8')), _id: f.replace('.json', '') }));
  } catch {
    return [];
  }
}

function readMdFrontmatter(dir: string) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const raw = readFileSync(join(dir, f), 'utf-8');
        const { data, content } = matter(raw);
        return {
          ...data,
          _body: content.trim(),
          _slug: f.replace('.md', ''),
        };
      });
  } catch {
    return [];
  }
}

// Read content
const projects = readMdFrontmatter(join(contentDir, 'projects'));
const articles = readMdFrontmatter(join(contentDir, 'articles'));
const experience = readJsonFiles(join(contentDir, 'experience')).sort((a, b) => a.sortOrder - b.sortOrder);

// One version string for the data and its OpenAPI description.
const API_VERSION: string = JSON.parse(readFileSync(join(rootDir, 'public', 'api', 'openapi.json'), 'utf-8')).info.version;
const projectUrl = (slug: string) => `${SITE_URL}${projectPath(slug)}`;
const articleUrl = (slug: string) => `${SITE_URL}${articlePath(slug)}`;

// Generate portfolio.json
const portfolio = {
  name: ENGINEER_NAME,
  title: ENGINEER_TITLE,
  email: EMAIL_ADDRESS,
  urls: {
    github: "https://github.com/limcheekin",
    linkedin: "https://linkedin.com/in/limcheekin",
    medium: "https://medium.com/@limcheekin",
  },
  projects: projects.map((p: any) => ({
    title: p.title,
    slug: p._slug,
    url: projectUrl(p._slug),
    summary: p.summary,
    description: p.description,
    featured: p.featured,
    kind: p.kind ?? DEFAULT_PROJECT_KIND,
    org: p.org,
    tagline: p.tagline,
    technologies: p.technologies || [],
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    category: p.category,
  })),
  articles: articles.map((a: any) => ({
    title: a.title,
    slug: a._slug,
    url: articleUrl(a._slug),
    description: a.description,
    externalUrl: a.externalUrl,
    publishDate: new Date(a.publishDate).toISOString(),
    tags: a.tags || [],
  })),
  experience: experience.map((e: any) => ({
    company: e.company,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    description: e.description || [],
    technologies: e.technologies || [],
  })),
  metadata: {
    generatedAt: new Date().toISOString(),
    version: API_VERSION,
  },
} satisfies Portfolio;

mkdirSync(join(distDir, 'api'), { recursive: true });
writeFileSync(join(distDir, 'api', 'portfolio.json'), JSON.stringify(portfolio, null, 2));
console.log('Generated: dist/api/portfolio.json');

// Generate granular API endpoints
writeFileSync(join(distDir, 'api', 'projects.json'), JSON.stringify(portfolio.projects, null, 2));
console.log('Generated: dist/api/projects.json');

writeFileSync(join(distDir, 'api', 'experience.json'), JSON.stringify(portfolio.experience, null, 2));
console.log('Generated: dist/api/experience.json');

writeFileSync(join(distDir, 'api', 'articles.json'), JSON.stringify(portfolio.articles, null, 2));
console.log('Generated: dist/api/articles.json');

// Generate llms-full.txt
const lines = [
  `# ${ENGINEER_NAME} — Full Portfolio Content`,
  `> ${ENGINEER_TITLE} at Daxonet AI — enterprise AI agents, document extraction, RAG and voice AI.`,
  ``,
  `## Projects`,
  ...projects.map((p: any) => [
    `### ${p.title}`,
    `Page: ${projectUrl(p._slug)}`,
    p.description,
    `Technologies: ${(p.technologies || []).join(', ')}`,
    p.githubUrl ? `Repository: ${p.githubUrl}` : '',
    p.liveUrl ? `Live: ${p.liveUrl}` : '',
    p._body ? `\n${p._body}` : '',
    ``,
  ].filter(Boolean).join('\n')),
  ``,
  `## Articles`,
  ...articles.map((a: any) => [
    `### ${a.title}`,
    `Page: ${articleUrl(a._slug)}`,
    a.description,
    a.externalUrl ? `Full article: ${a.externalUrl}` : '',
    a._body ? `\n${a._body}` : '',
    ``,
  ].filter(Boolean).join('\n')),
  ``,
  `## Work Experience`,
  ...experience.map((e: any) => [
    `### ${e.title} @ ${e.company}`,
    `${e.startDate} - ${e.endDate || 'Present'}`,
    ...e.description.map((d: string) => `- ${d}`),
    `Skills: ${(e.technologies || []).join(', ')}`,
    ``,
  ].join('\n')),
  ``,
  `## Contact`,
  `- Email: limcheekin@vobject.com`,
  `- GitHub: https://github.com/limcheekin`,
  `- LinkedIn: https://linkedin.com/in/limcheekin`,
  `- Medium: https://medium.com/@limcheekin`,
];

writeFileSync(join(distDir, 'llms-full.txt'), lines.join('\n'));
console.log('Generated: dist/llms-full.txt');

// llms.txt is hand-written except its project list, which comes from the collection so it never misses one:
// enterprise first, then open source, each in Work-track order (featuredOrder) and then by title.
const LLMS_PROJECTS_MARKER = /^<!-- projects:.*-->$/m;
const llmsPath = join(distDir, 'llms.txt');
const llms = readFileSync(llmsPath, 'utf-8');
if (!LLMS_PROJECTS_MARKER.test(llms)) throw new Error('public/llms.txt lost its <!-- projects: ... --> marker');
const byOrder = (a: any, b: any) => (a.featuredOrder ?? 99) - (b.featuredOrder ?? 99) || a.title.localeCompare(b.title);
const projectLines = (kind: string) =>
  (projects as any[])
    .filter((p) => (p.kind ?? DEFAULT_PROJECT_KIND) === kind)
    .sort(byOrder)
    .map((p) => `- [${p.title.split(':')[0].trim()}](${projectUrl(p._slug)}): ${p.tagline ?? p.summary}${p.githubUrl ? ` Source: ${p.githubUrl}` : ''}`);
writeFileSync(llmsPath, llms.replace(LLMS_PROJECTS_MARKER, ['At Daxonet AI:', ...projectLines('enterprise'), '', 'Open source:', ...projectLines('oss')].join('\n')));
console.log('Generated: project list in dist/llms.txt');

// Markdown version of each project, article and the About page, next to its index.html (linked from the page's
// <head> as rel="alternate" type="text/markdown"): the page's content without the markup, for agents.
const writeMarkdown = (pagePath: string, parts: Array<string | false | undefined>) => {
  mkdirSync(join(distDir, pagePath), { recursive: true });
  writeFileSync(join(distDir, markdownPath(pagePath)), parts.filter((x) => x !== false && x !== undefined).join('\n') + '\n');
};
const list = (label: string, items: string[] = []) => items.length > 0 && `- ${label}: ${items.join(', ')}`;
const link = (label: string, url?: string) => url && `- ${label}: ${url}`;

for (const p of projects as any[]) {
  writeMarkdown(projectPath(p._slug), [
    `# ${p.title}`,
    '',
    `> ${p.summary}`,
    '',
    `- Page: ${projectUrl(p._slug)}`,
    `- Kind: ${projectLabel(p.kind ?? DEFAULT_PROJECT_KIND, p.org)}`,
    list('Technologies', p.technologies),
    link('Source', p.githubUrl),
    link('Live', p.liveUrl),
    '',
    p.description,
    p._body ? `\n${p._body}` : undefined,
  ]);
}

for (const a of articles as any[]) {
  writeMarkdown(articlePath(a._slug), [
    `# ${a.title}`,
    '',
    `- Page: ${articleUrl(a._slug)}`,
    `- Published: ${new Date(a.publishDate).toISOString().slice(0, 10)}${a.platform ? ` on ${a.platform}` : ''}`,
    link('Full article', a.externalUrl),
    list('Tags', a.tags),
    '',
    a.description,
    a._body && a._body !== a.description ? `\n${a._body}` : undefined,
  ]);
}

writeMarkdown('/about/', [
  `# About ${ENGINEER_NAME}`,
  '',
  ...ABOUT_CONTENT.introductionParagraphs.flatMap((para) => [para, '']),
  `Technologies: ${ABOUT_CONTENT.skills.join(', ')}`,
  '',
  '## Work Experience',
  '',
  ...experience.flatMap((e: any) => [
    `### ${e.title} @ ${e.company} (${e.startDate} – ${e.endDate || 'Present'})`,
    '',
    ...e.description.map((d: string) => `- ${d}`),
    '',
  ]),
  '## Frequently asked questions',
  '',
  ...FAQ.flatMap((f) => [`### ${f.question}`, '', f.answer, '']),
]);
writeMarkdown('/hire/', [
  '# HIRE check: should you build that AI agent?',
  '',
  `> ${HIRE_DESCRIPTION}`,
  '',
  `- Page: ${SITE_URL}/hire/`,
  `- MCP server: ${SITE_URL}/mcp/hire`,
  '',
  ...HIRE_INTRO.flatMap((para) => [para, '']),
  '## Privacy',
  '',
  HIRE_PRIVACY_STATEMENT,
  '',
  '## Credit and licence',
  '',
  HIRE_CREDIT_MARKDOWN,
  '',
  '## The checklist',
  '',
  ...checklistMarkdown(),
]);
console.log('Generated: dist/{projects,insights}/<slug>/index.md, dist/about/index.md, dist/hire/index.md');

// GET search index for agents without MCP: one flat list of every project, article and role with its page URL
// and the words worth matching. (search_portfolio on the MCP server answers the same questions server-side.)
const searchItems = [
  ...portfolio.projects.map((p) => ({
    type: 'project',
    title: p.title,
    url: p.url,
    summary: p.summary,
    keywords: [p.kind, p.org, p.category, ...p.technologies].filter(Boolean),
  })),
  ...portfolio.articles.map((a) => ({ type: 'article', title: a.title, url: a.url, summary: a.description, keywords: a.tags, date: a.publishDate })),
  ...experience.map((e: any) => ({
    type: 'experience',
    title: `${e.title} @ ${e.company}`,
    url: `${SITE_URL}${rolePath(e._id)}`,
    summary: e.description[0] ?? '',
    keywords: e.technologies ?? [],
    date: e.startDate,
  })),
];
writeFileSync(join(distDir, 'api', 'search.json'), JSON.stringify({ generatedAt: portfolio.metadata.generatedAt, items: searchItems }, null, 2));
console.log('Generated: dist/api/search.json');

// Every machine-readable file, described once: /api/ lists the API ones, mcp.json lists them all.
const httpResource = (path: string, name: string, description: string, mimeType = 'application/json') => ({ uri: `${SITE_URL}${path}`, name, description, mimeType });
const HTTP_RESOURCES = [
  httpResource('/api/portfolio.json', 'Portfolio Data', 'Full structured portfolio: projects, work experience, articles and contact'),
  httpResource('/api/projects.json', 'Projects', 'Projects only (enterprise and open source)'),
  httpResource('/api/experience.json', 'Work Experience', 'Work history with responsibilities, newest first'),
  httpResource('/api/articles.json', 'Articles', 'Articles with summaries and links to the originals on Medium'),
  httpResource('/api/search.json', 'Search Index', 'Every project, article and role with keywords and page URL, for client-side search'),
  httpResource('/api/openapi.json', 'OpenAPI Spec', 'OpenAPI 3 description of the JSON API'),
  httpResource('/llms-full.txt', 'Full Portfolio Content', 'Extended prose content of all portfolio items for LLMs', 'text/plain'),
  httpResource('/llms.txt', 'LLM Site Index', 'Structured markdown index following the llms.txt convention', 'text/plain'),
];

// /api/ itself answers with an index of the endpoints instead of a 404 (nginx: index index.json).
writeFileSync(join(distDir, 'api', 'index.json'), JSON.stringify({
  name: `${ENGINEER_NAME} Portfolio API`,
  version: API_VERSION,
  description: 'Static, read-only JSON. No auth. Described by openapi.json; the same data is served by the MCP server.',
  endpoints: HTTP_RESOURCES.filter((r) => r.uri.startsWith(`${SITE_URL}/api/`)).map(({ uri, description }) => ({ url: uri, description })),
  mcp: `${SITE_URL}/mcp`,
  llms: `${SITE_URL}/llms.txt`,
}, null, 2));
console.log('Generated: dist/api/index.json');

// .well-known files that repeat another file or derive from data: generated here so they have one source.
const wellKnown = (name: string) => join(distDir, '.well-known', name);

// Current A2A versions look for the agent card at /.well-known/agent-card.json; serve the same file at both paths.
copyFileSync(wellKnown('agent.json'), wellKnown('agent-card.json'));
copyFileSync(join(distDir, 'ai-plugin.json'), wellKnown('ai-plugin.json'));

writeFileSync(wellKnown('mcp.json'), JSON.stringify(mcpManifest(HTTP_RESOURCES), null, 2));
// The HIRE check server at /mcp/hire has its own manifest (tools only, no resources).
writeFileSync(wellKnown('mcp-hire.json'), JSON.stringify(hireManifest(), null, 2));

// RFC 9116 requires Expires, at most a year ahead; each deploy moves it forward.
const expires = new Date(Date.now() + 330 * 24 * 60 * 60 * 1000).toISOString();
writeFileSync(wellKnown('security.txt'), [
  `Contact: mailto:${EMAIL_ADDRESS}`,
  `Expires: ${expires}`,
  'Preferred-Languages: en',
  `Canonical: ${SITE_URL}/.well-known/security.txt`,
  '',
].join('\n'));
console.log('Generated: dist/.well-known/{agent-card,ai-plugin,mcp,mcp-hire}.json, security.txt');
