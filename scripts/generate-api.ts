import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

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
        const content = readFileSync(join(dir, f), 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!match) return null;
        const frontmatter: Record<string, any> = {};
        match[1].split('\n').forEach((line) => {
          const [key, ...rest] = line.split(':');
          if (key && rest.length) {
            let val = rest.join(':').trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith('[')) {
              try { frontmatter[key.trim()] = JSON.parse(val); } catch { frontmatter[key.trim()] = val; }
            } else if (val === 'true') frontmatter[key.trim()] = true;
            else if (val === 'false') frontmatter[key.trim()] = false;
            else frontmatter[key.trim()] = val;
          }
        });
        frontmatter._body = match[2].trim();
        frontmatter._slug = f.replace('.md', '');
        return frontmatter;
      })
      .filter(Boolean);
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
