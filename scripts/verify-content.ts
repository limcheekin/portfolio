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

const M = 'https://limcheekin.medium.com/';
const EXPECTED_ARTICLES: Record<string, [string, string]> = { // slug -> [publishDate, externalUrl]
  'zero-trust-ai-agents': ['2026-03-13', M + 'zero-trust-security-for-autonomous-ai-agents-691b5cbcec21'],
  'llm-load-testing-gke': ['2026-02-16', M + 'solving-the-llm-load-testing-paradox-a-reference-architecture-on-gke-autopilot-c8c2271f5cfb'],
  'nanochat-single-gpu': ['2025-10-15', M + 'reproducing-karpathys-nanochat-on-a-single-gpu-step-by-step-with-ai-tools-e9420aaee912'],
  'legacy-database-ai': ['2025-08-18', M + 'ai-is-ready-your-legacy-database-isnt-let-s-fix-that-f28013a2f833'],
  'no-code-mcp-server': ['2025-06-20', M + 'building-your-first-no-code-mcp-server-the-fabric-integration-story-90da58cdbe1f'],
  'talking-book': ['2025-05-19', M + 'introducing-talking-book-487f6e3bc2c2'],
  'beyond-the-cloud': ['2025-04-23', M + 'beyond-the-cloud-how-i-built-my-own-ai-server-and-why-68b7235117f3'],
  'own-your-ai-data': ['2025-04-19', M + 'would-you-pay-1-month-to-own-your-ai-data-6dbb0db1eeaf'],
  'talk-to-ai-fastrtc': ['2025-03-10', M + 'talk-to-ai-with-fastrtc-real-time-voice-conversations-with-ai-5cf35f9691d8'],
  'open-text-embeddings-intro': ['2023-11-13', M + 'unleashing-the-power-of-open-source-text-embeddings-with-open-text-embeddings-e8fc684aa2cd'],
};
const isoDate = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

check('articles match Medium', () => {
  const out: string[] = [];
  const found = new Map(frontmatter('src/content/articles').map((a) => [a.slug, a.data]));
  for (const [slug, [date, url]] of Object.entries(EXPECTED_ARTICLES)) {
    const d = found.get(slug);
    if (!d) { out.push(`missing article ${slug}`); continue; }
    if (isoDate(d.publishDate) !== date) out.push(`${slug}: publishDate ${isoDate(d.publishDate)} != ${date}`);
    if (d.externalUrl !== url) out.push(`${slug}: externalUrl ${d.externalUrl} != ${url}`);
  }
  for (const slug of found.keys()) if (!(slug in EXPECTED_ARTICLES)) out.push(`unexpected article ${slug}`);
  return out;
});
check('latest three articles', () => {
  const top = frontmatter('src/content/articles')
    .sort((a, b) => isoDate(b.data.publishDate).localeCompare(isoDate(a.data.publishDate)))
    .slice(0, 3)
    .map((a) => a.slug);
  const want = ['zero-trust-ai-agents', 'llm-load-testing-gke', 'nanochat-single-gpu'];
  return JSON.stringify(top) === JSON.stringify(want) ? [] : [`latest three are ${top.join(', ')}`];
});
check('llms.txt has no coming-soon', () => (readText('public/llms.txt').includes('coming soon') ? ['coming soon in llms.txt'] : []));
check('article links live', async () => {
  const out: string[] = [];
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' };
  const feed = await (await fetch(M + 'feed', { headers, signal: AbortSignal.timeout(30000) })).text();
  for (const [slug, [, url]] of Object.entries(EXPECTED_ARTICLES)) {
    if (!feed.includes(url)) out.push(`${slug}: not in Medium feed`);
    try {
      const r = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(30000) });
      if (r.status >= 400) out.push(`${slug}: GET ${r.status}`);
    } catch (e) {
      out.push(`${slug}: GET threw ${(e as Error).message}`);
    }
  }
  return out;
}, { links: true });

const readExperience = () => walk('src/content/experience', ['.json']).sort().map((f) => ({ f, ...JSON.parse(readText(f)) }));
check('experience order + Daxonet first', () => {
  const out: string[] = [];
  const e = readExperience().sort((a, b) => a.sortOrder - b.sortOrder);
  const orders = e.map((x) => x.sortOrder);
  if (new Set(orders).size !== orders.length) out.push('sortOrder not unique');
  for (let i = 1; i < e.length; i++) if (e[i].startDate > e[i - 1].startDate) out.push(`${e[i].company} starts after ${e[i - 1].company} but sorts later`);
  if (e[0]?.company !== 'Daxonet AI' || e[0]?.title !== 'AI Solutions Architect' || e[0]?.startDate !== '2026-01') out.push('first entry is not Daxonet AI / AI Solutions Architect / 2026-01');
  const p = e.find((x) => x.title === 'Principal AI Architect');
  if (!p || p.company !== 'Independent Consultant' || p.startDate !== '2021-01' || p.endDate !== '2025-12') out.push('Principal AI Architect entry wrong');
  return out;
});
check('merge kept trimmed detail', () => [
  ['02-dxc-tech-lead.json', 'contributing millions'], ['02-dxc-tech-lead.json', 'EPIC Configurator'], ['02-dxc-tech-lead.json', 'Divestiture and Acquisition'],
  ['03-zurich-tech-lead.json', '5-member'], ['01-ai-engineer.json', 'open-text-embeddings'], ['01-ai-engineer.json', 'Fluwix'],
].filter(([f, s]) => !readText(`src/content/experience/${f}`).includes(s)).map(([f, s]) => `${f} lost "${s}"`));
check('CV facts merged', () => [
  ['00-daxonet.json', 'Claim Pilot'], ['00-daxonet.json', 'AI Enablement'], ['01-ai-engineer.json', 'Private Service Connect'],
  ['01-ai-engineer.json', 'Ragas'], ['02-dxc-tech-lead.json', 'mentored three junior developers'],
].filter(([f, s]) => !existsSync(`src/content/experience/${f}`) || !readText(`src/content/experience/${f}`).includes(s)).map(([f, s]) => `${f} missing "${s}"`));
check('no companyUrl on Independent Consultant', () => (readExperience().some((x) => x.company === 'Independent Consultant' && x.companyUrl) ? ['companyUrl still set'] : []));

const FEATURED: Record<string, string> = { 'claim-pilot': 'claim', 'trade-pilot': 'trade', 'warebot': 'ware', 'agentic-ai-layer': 'agent', 'project-concord': 'concord', 'talk-to-ai': 'talk', 'rag-wtf': 'rag' };
const projectsBySlug = () => new Map(frontmatter('src/content/projects').map((p) => [p.slug, p]));
check('featured order', () => {
  const got = frontmatter('src/content/projects').filter((p) => p.data.featured).sort((a, b) => (a.data.featuredOrder ?? 99) - (b.data.featuredOrder ?? 99)).map((p) => p.slug);
  const want = Object.keys(FEATURED);
  return JSON.stringify(got) === JSON.stringify(want) ? [] : [`featured order is ${got.join(', ')}`];
});
check('featured cards complete', () => {
  const out: string[] = [];
  const m = projectsBySlug();
  Object.keys(FEATURED).forEach((slug, i) => {
    const d = m.get(slug)?.data;
    if (!d) { out.push(`missing ${slug}`); return; }
    if (!d.tagline) out.push(`${slug}: no tagline`);
    if (!Array.isArray(d.stack) || d.stack.length < 2 || d.stack.length > 4) out.push(`${slug}: stack length`);
    if (d.visual !== FEATURED[slug]) out.push(`${slug}: visual ${d.visual}`);
    if (d.featuredOrder !== i + 1) out.push(`${slug}: featuredOrder ${d.featuredOrder}`);
    if (i < 4 && (d.kind !== 'enterprise' || d.org !== 'Daxonet AI')) out.push(`${slug}: should be enterprise / Daxonet AI`);
    if (i >= 4 && d.kind !== 'oss') out.push(`${slug}: should be oss`);
  });
  return out;
});
check('demoted + hvac', () => {
  const out: string[] = [];
  const m = projectsBySlug();
  for (const s of ['telegram-gpt', 'open-text-embeddings']) if (m.get(s)?.data.featured !== false) out.push(`${s} should not be featured`);
  const h = m.get('smart-hvac-catalogue')?.data;
  if (!h) out.push('smart-hvac-catalogue missing');
  else { if (h.featured) out.push('hvac featured'); if (h.kind !== 'enterprise') out.push('hvac kind'); }
  return out;
});
check('dist: portfolio.json has kind', () => (JSON.parse(readText('dist/api/portfolio.json')).projects as any[]).filter((p) => !p.kind).map((p) => `${p.slug} lacks kind`), { dist: true });

// ---------- task 6: site chrome ----------
const UI = [...walk('src/pages', ['.astro','.ts']), ...walk('src/components', ['.astro','.tsx']), ...walk('src/layouts', ['.astro']), 'src/data/site.ts'];
check('no visible "Insights" label', () => UI.filter(f => /Insights/.test(readText(f))).map(f => f));
check('nav says Writing', async () => (await import('../src/data/site.ts')).NAV_LINKS.some((l: any) => l.name === 'Writing' && l.href === '/insights/') ? [] : ['NAV_LINKS']);
check('sidebars removed', () => [existsSync('src/components/FixedSidebars.astro') && 'FixedSidebars.astro exists', ...UI.filter(f => readText(f).includes('FixedSidebars'))].filter(Boolean) as string[]);
check('dist: footer + nav', () => { const t = htmlText(readText('dist/index.html')); return [!t.includes('Kuala Lumpur, Malaysia') && 'footer location', !readText('dist/index.html').includes('href="/insights/"') && 'nav link'].filter(Boolean) as string[]; }, { dist: true });

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
