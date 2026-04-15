import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

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
  name: "Lim Chee Kin",
  title: "Senior Tech Lead, AI Engineer, and Solution Architect",
  email: "limcheekin@vobject.com",
  urls: {
    github: "https://github.com/limcheekin",
    linkedin: "https://linkedin.com/in/limcheekin",
    medium: "https://medium.com/@limcheekin",
  },
  projects: projects.map((p: any) => ({
    title: p.title,
    slug: p._slug,
    description: p.description,
    featured: p.featured,
    technologies: p.technologies || [],
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    category: p.category,
  })),
  articles: articles.map((a: any) => ({
    title: a.title,
    slug: a._slug,
    description: a.description,
    externalUrl: a.externalUrl,
    publishDate: a.publishDate,
    tags: a.tags || [],
  })),
  experience: experience.map((e: any) => ({
    company: e.company,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    technologies: e.technologies || [],
  })),
  metadata: {
    generatedAt: new Date().toISOString(),
    version: "2.0",
  },
};

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
  `# Lim Chee Kin — Full Portfolio Content`,
  `> Senior Tech Lead, AI Engineer, and Solution Architect with 25+ years of experience.`,
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
