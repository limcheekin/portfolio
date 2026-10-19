// Per-page <lastmod> for the sitemap: an article's publish date, otherwise the last commit that touched the
// page's content. Pages with no known date get no lastmod rather than the build time.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = fileURLToPath(new URL('..', import.meta.url));

/** ISO date of the newest commit touching any of `paths`, or undefined (no git, shallow clone without history). */
function gitDate(...paths) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths], { cwd: root, encoding: 'utf8' }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

const newest = (dates) => dates.filter(Boolean).sort().at(-1);

const articleDir = join(root, 'src/content/articles');
const articleDates = Object.fromEntries(
  readdirSync(articleDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => [f.slice(0, -3), new Date(matter(readFileSync(join(articleDir, f), 'utf8')).data.publishDate).toISOString()]),
);

const projectDir = 'src/content/projects';
const projectDate = (slug) => gitDate(`${projectDir}/${slug}.md`);

const PAGE_SOURCES = {
  '/': ['src/pages/index.astro', 'src/data', 'src/components/home', 'src/content'],
  '/about/': ['src/pages/about.astro', 'src/content/experience', 'src/data/site.ts'],
  '/contact/': ['src/pages/contact.astro', 'src/components/ContactForm.astro'],
  '/projects/': ['src/pages/projects/index.astro', projectDir],
  '/insights/': ['src/pages/insights/index.astro', 'src/content/articles'],
};

/** lastmod for a page path such as "/projects/claim-pilot/". */
export function lastmodFor(pathname) {
  const article = pathname.match(/^\/insights\/([^/]+)\/$/);
  if (article) return articleDates[article[1]];
  const project = pathname.match(/^\/projects\/([^/]+)\/$/);
  if (project) return projectDate(project[1]);
  const sources = PAGE_SOURCES[pathname];
  if (!sources) return undefined;
  if (pathname === '/insights/') return newest([gitDate(...sources), ...Object.values(articleDates)]);
  return gitDate(...sources);
}
