// Per-page <lastmod> for the sitemap: an article's publish date, otherwise the last commit that touched the
// page's sources. Pages with no known date get no lastmod rather than the build time.
//
// Commit history comes from the local checkout when it is complete. Coolify sends no .git into the Docker build,
// so there a bare, blobless clone of the public repository (commits and trees only) is read once and deleted.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = fileURLToPath(new URL('..', import.meta.url));
const REMOTE = 'https://github.com/limcheekin/portfolio.git';
// Every page source lives under src/, so the log is limited to it.
const LOG = ['log', '--format=%x00%cI', '--name-only', 'HEAD', '--', 'src'];

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120_000 });

/** `git log` of src/ (one commit per NUL-separated entry, newest first), or '' when no history is reachable. */
function readLog() {
  try {
    if (git('rev-parse', '--is-shallow-repository').trim() === 'false') return git(...LOG);
  } catch {
    // no checkout here (the Docker build)
  }
  const dir = mkdtempSync(join(tmpdir(), 'lastmod-'));
  try {
    git('clone', '--bare', '--filter=blob:none', '--single-branch', REMOTE, dir);
    console.log(`sitemap-lastmod: commit dates from ${REMOTE}`);
    return git(`--git-dir=${dir}`, ...LOG);
  } catch {
    console.warn(`sitemap-lastmod: no local history and ${REMOTE} unreachable, so pages other than articles get no lastmod`);
    return '';
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Newest commit date (UTC ISO) per file, read on first use: the first date seen for a file is its last change. */
let fileDates;
function getFileDates() {
  if (fileDates) return fileDates;
  fileDates = new Map();
  for (const entry of readLog().split('\0').slice(1)) {
    const [isoDate, ...files] = entry.trim().split('\n');
    const date = new Date(isoDate).toISOString();
    for (const file of files) if (file && !fileDates.has(file)) fileDates.set(file, date);
  }
  return fileDates;
}

/** ISO date of the newest commit touching any of `paths` (files or directories), or undefined. */
function gitDate(...paths) {
  let latest;
  for (const [file, date] of getFileDates()) {
    if (paths.some((p) => file === p || file.startsWith(`${p}/`)) && (!latest || date > latest)) latest = date;
  }
  return latest;
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
  '/about/': ['src/pages/about.astro', 'src/content/experience', 'src/data/site.ts', 'src/data/faq.ts'],
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
