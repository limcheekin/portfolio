import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { DEFAULT_PROJECT_KIND } from '../src/lib/project-kind';
import { EMAIL_ADDRESS, ENGINEER_NAME, ENGINEER_TITLE, SITE_URL } from '../src/data/site';
import type { Portfolio } from '../src/lib/portfolio-schema';
import { mcpManifest } from '../src/lib/portfolio-tools';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const contentDir = join(rootDir, 'src', 'content');

// Read content files directly from source (not dist)
function readJsonFiles(dir: string) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')));
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
    url: `${SITE_URL}/projects/${p._slug}/`,
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
    url: `${SITE_URL}/insights/${a._slug}/`,
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
    version: "2.1",
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
    a.description,
    a.externalUrl ? `URL: ${a.externalUrl}` : '',
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

// .well-known files that repeat another file or derive from data: generated here so they have one source.
const wellKnown = (name: string) => join(distDir, '.well-known', name);

// Current A2A versions look for the agent card at /.well-known/agent-card.json; serve the same file at both paths.
copyFileSync(wellKnown('agent.json'), wellKnown('agent-card.json'));
copyFileSync(join(distDir, 'ai-plugin.json'), wellKnown('ai-plugin.json'));

const httpResource = (path: string, name: string, description: string, mimeType: string) => ({ uri: `${SITE_URL}${path}`, name, description, mimeType });
writeFileSync(wellKnown('mcp.json'), JSON.stringify(mcpManifest([
  httpResource('/api/portfolio.json', 'Portfolio Data', 'Full structured portfolio: projects, work experience, articles and contact', 'application/json'),
  httpResource('/api/projects.json', 'Projects', 'Projects only (enterprise and open source)', 'application/json'),
  httpResource('/api/experience.json', 'Work Experience', 'Work history with responsibilities, newest first', 'application/json'),
  httpResource('/api/articles.json', 'Articles', 'Articles with summaries and links to the originals on Medium', 'application/json'),
  httpResource('/api/openapi.json', 'OpenAPI Spec', 'OpenAPI 3 description of the JSON API', 'application/json'),
  httpResource('/llms-full.txt', 'Full Portfolio Content', 'Extended prose content of all portfolio items for LLMs', 'text/plain'),
  httpResource('/llms.txt', 'LLM Site Index', 'Structured markdown index following the llms.txt convention', 'text/plain'),
]), null, 2));

// RFC 9116 requires Expires, at most a year ahead; each deploy moves it forward.
const expires = new Date(Date.now() + 330 * 24 * 60 * 60 * 1000).toISOString();
writeFileSync(wellKnown('security.txt'), [
  `Contact: mailto:${EMAIL_ADDRESS}`,
  `Expires: ${expires}`,
  'Preferred-Languages: en',
  `Canonical: ${SITE_URL}/.well-known/security.txt`,
  '',
].join('\n'));
console.log('Generated: dist/.well-known/{agent-card,ai-plugin,mcp}.json, security.txt');
