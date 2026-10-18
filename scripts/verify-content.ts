import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import matter from 'gray-matter';

const args = new Set(process.argv.slice(2));
const RUN_DIST = args.has('--dist');
const RUN_LINKS = args.has('--links');

// ---------- helpers ----------

export function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

/** Recursively list files under `dir` whose extension is in `exts` ('' matches extensionless files). */
export function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name).replaceAll('\\', '/');
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(extname(name))) out.push(p);
  }
  return out;
}

export function frontmatter(dir: string): Array<{ slug: string; data: any; body: string }> {
  return walk(dir, ['.md', '.mdx']).map((f) => {
    const { data, content } = matter(readText(f));
    return { slug: f.slice(dir.length + 1).replace(/\.mdx?$/, ''), data, body: content };
  });
}

export function htmlText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- runner ----------

type CheckFn = () => string[] | Promise<string[]>;
const queue: Array<{ name: string; fn: CheckFn }> = [];

export function check(name: string, fn: CheckFn, opts: { dist?: boolean; links?: boolean } = {}): void {
  if (opts.dist && !RUN_DIST) return;
  if (opts.links && !RUN_LINKS) return;
  queue.push({ name, fn });
}

// ---------- checks (later tasks append below) ----------

const YEARS = new RegExp(['25\\+?[\\s-]?years?', 'over 25'].join('|'), 'i'); // built from parts so this file doesn't match itself
const OLD_TITLE = /Senior Tech Lead, AI Engineer/;
const SCAN = [...walk('src', ['.astro', '.ts', '.tsx', '.md', '.json']), ...walk('public', ['.txt', '.json', '.webmanifest', '']), ...walk('scripts', ['.ts']), 'README.md']
  .filter((f) => !f.endsWith('verify-content.ts'));

check('no explicit years figure', () => SCAN.filter((f) => YEARS.test(readText(f))).map((f) => `years figure in ${f}`));
check('old title gone', () => SCAN.filter((f) => OLD_TITLE.test(readText(f))).map((f) => `old title in ${f}`));
check('old employer label gone', () => SCAN.filter((f) => readText(f).includes('RAG.WTF & AI Initiatives')).map((f) => f));
check('title is AI Solutions Architect', async () => (await import('../src/data/site.ts')).ENGINEER_TITLE === 'AI Solutions Architect' ? [] : ['ENGINEER_TITLE']);
check('llms.txt names role + employer', () => ['AI Solutions Architect', 'Daxonet AI'].filter((s) => !readText('public/llms.txt').includes(s)).map((s) => `llms.txt missing "${s}"`));
check('resume.pdf is the Oct 2026 CV', () => existsSync('docs/Resume-202610.pdf') && !readFileSync('public/resume.pdf').equals(readFileSync('docs/Resume-202610.pdf')) ? ['public/resume.pdf differs'] : []);
check('dist: portfolio.json title', () => JSON.parse(readText('dist/api/portfolio.json')).title === 'AI Solutions Architect' ? [] : ['portfolio.json title'], { dist: true });
check('dist: no years figure in dist', () => walk('dist', ['.html', '.txt', '.json', '.xml']).filter((f) => YEARS.test(readText(f))), { dist: true });

// ---------- run ----------

let failed = 0;
for (const { name, fn } of queue) {
  let failures: string[];
  try {
    failures = await fn();
  } catch (e) {
    failures = [`threw: ${(e as Error).message}`];
  }
  if (failures.length === 0) console.log(`✓ ${name}`);
  else {
    failed++;
    console.log(`✗ ${name}`);
    for (const f of failures) console.log(`    ${f}`);
  }
}
if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
