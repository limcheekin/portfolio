/**
 * End-to-end check of the MCP server over HTTP: initialize, every tool, every resource, and the error paths.
 * The expected tools and resources come from the built manifest, so this also checks that /.well-known/mcp.json
 * matches what the server serves.
 * Usage: tsx scripts/mcp-smoke.ts [endpoint] [manifest]
 *   (defaults: http://127.0.0.1:3001/mcp, dist/.well-known/mcp.json)
 */
import { readFileSync } from 'node:fs';

const endpoint = process.argv[2] ?? 'http://127.0.0.1:3001/mcp';
const manifest = JSON.parse(readFileSync(process.argv[3] ?? 'dist/.well-known/mcp.json', 'utf8'));
let failures = 0;
let id = 0;

const post = (body: string) =>
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': manifest.protocolVersion,
    },
    body,
  });

async function rpc(method: string, params: Record<string, unknown> = {}) {
  const res = await post(JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }));
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${method}: HTTP ${res.status}, non-JSON body: ${text.slice(0, 200)}`);
  }
  if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

const call = async (name: string, args: Record<string, unknown> = {}) => rpc('tools/call', { name, arguments: args });
const data = async (name: string, args: Record<string, unknown> = {}) => (await call(name, args)).structuredContent;

/** Runs one named check; `fail` records a problem without stopping the check. */
async function check(name: string, fn: (fail: (problem: string) => void) => Promise<void>) {
  const problems: string[] = [];
  try {
    await fn((p) => problems.push(p));
  } catch (err) {
    problems.push((err as Error).message);
  }
  failures += problems.length;
  console.log(`${problems.length ? '✗' : '✓'} ${name}${problems.length ? ` — ${problems.join('; ')}` : ''}`);
}

await check('initialize', async (fail) => {
  const r = await rpc('initialize', {
    protocolVersion: manifest.protocolVersion,
    capabilities: {},
    clientInfo: { name: 'mcp-smoke', version: '1.0.0' },
  });
  if (r.serverInfo?.name !== manifest.serverInfo.name) fail(`serverInfo.name ${r.serverInfo?.name}`);
  if (r.protocolVersion !== manifest.protocolVersion) fail(`protocolVersion ${r.protocolVersion}`);
  if (!r.capabilities?.tools || !r.capabilities?.resources) fail('missing tools/resources capability');
  if (!r.instructions) fail('no instructions');
});

await check('tools/list matches the manifest', async (fail) => {
  const { tools } = await rpc('tools/list');
  const names = tools.map((t: any) => t.name).sort().join(',');
  const expected = manifest.tools.map((t: any) => t.name).sort().join(',');
  if (names !== expected) fail(`server ${names} vs manifest ${expected}`);
  for (const t of tools) {
    if (!t.outputSchema) fail(`${t.name} has no outputSchema`);
    if (t.annotations?.readOnlyHint !== true) fail(`${t.name} not readOnly`);
  }
});

await check('get_projects', async (fail) => {
  const all = await data('get_projects');
  if (all.count < 10) fail(`only ${all.count} projects`);
  if (!all.projects[0].url?.startsWith('https://kin.rag.wtf/projects/')) fail('no page url');
  if (!(await data('get_projects', { kind: 'oss' })).projects.every((p: any) => p.kind === 'oss')) fail('kind filter');
  const mcp = await data('get_projects', { technology: 'mcp' });
  if (!mcp.projects.some((p: any) => p.slug === 'project-concord')) fail('technology filter misses project-concord');
});

await check('get_project', async (fail) => {
  if ((await data('get_project', { slug: 'claim-pilot' }))?.project?.title?.startsWith('Claim Pilot') !== true) fail('claim-pilot');
  if ((await call('get_project', { slug: 'nope' })).isError !== true) fail('unknown slug is not an error');
});

await check('get_experience', async (fail) => {
  const r = await data('get_experience');
  if (r.count < 5) fail(`only ${r.count} roles`);
  if (!r.experience[0].description?.length) fail('newest role has no description');
});

await check('get_articles', async (fail) => {
  const all = await data('get_articles');
  if (all.count < 5) fail(`only ${all.count} articles`);
  if (all.articles[0].publishDate < all.articles[all.count - 1].publishDate) fail('not newest first');
  if ((await data('get_articles', { tag: 'mcp' })).count === 0) fail('tag filter found nothing for "mcp"');
});

await check('search_portfolio', async (fail) => {
  const r = await data('search_portfolio', { query: 'WhatsApp' });
  if (r.projects.length + r.experience.length === 0) fail('no hits for WhatsApp');
});

await check('get_contact_info', async (fail) => {
  if (!(await data('get_contact_info')).email?.includes('@')) fail('no email');
});

await check('resources match the manifest', async (fail) => {
  const listed = new Set((await rpc('resources/list')).resources.map((r: any) => r.uri));
  const templates = (await rpc('resources/templates/list')).resourceTemplates.map((t: any) => t.uriTemplate);
  for (const { uri } of manifest.resources) {
    if (uri.includes('{') ? !templates.includes(uri) : !listed.has(uri)) fail(`server lacks ${uri}`);
  }
  if (!listed.has('portfolio://projects/claim-pilot')) fail('project instances not listed');
  const project = await rpc('resources/read', { uri: 'portfolio://projects/project-concord' });
  if (!JSON.parse(project.contents[0].text).title?.startsWith('Project Concord')) fail('template read');
  const full = await rpc('resources/read', { uri: 'portfolio://llms-full' });
  if (!full.contents[0].text.includes('## Projects')) fail('llms-full read');
});

await check('GET is rejected', async (fail) => {
  const res = await fetch(endpoint, { headers: { Accept: 'text/event-stream' } });
  if (res.status !== 405) fail(`GET returned ${res.status}`);
});

await check('bad JSON is a parse error', async (fail) => {
  const res = await post('{not json');
  const body = await res.json();
  if (res.status !== 400 || body.error?.code !== -32700) fail(`HTTP ${res.status} ${JSON.stringify(body)}`);
});

console.log(failures ? `\n${failures} failure(s) against ${endpoint}` : `\nAll MCP checks passed against ${endpoint}`);
process.exit(failures ? 1 : 0);
