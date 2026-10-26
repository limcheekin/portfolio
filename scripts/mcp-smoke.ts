/**
 * End-to-end check of both MCP servers over HTTP: the portfolio server at /mcp and the HIRE check at /mcp/hire.
 * Initialize, every tool, every resource, and the error paths. The expected tools and resources come from the built
 * manifests, so this also checks that /.well-known/mcp.json and mcp-hire.json match what the servers serve.
 * Usage: tsx scripts/mcp-smoke.ts [endpoint] [manifest] [hire manifest]
 *   (defaults: http://127.0.0.1:3001/mcp, dist/.well-known/mcp.json, mcp-hire.json next to the first manifest;
 *   the HIRE server is checked at <endpoint>/hire)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FRAUD_CASE } from '../src/lib/hire/example.ts';

const endpoint = process.argv[2] ?? 'http://127.0.0.1:3001/mcp';
const manifestPath = process.argv[3] ?? 'dist/.well-known/mcp.json';
const hireManifestPath = process.argv[4] ?? join(dirname(manifestPath), 'mcp-hire.json');
const hireEndpoint = `${endpoint}/hire`;
let failures = 0;
let id = 0;

type Args = Record<string, unknown>;

/** JSON-RPC helpers bound to one endpoint and its manifest. */
function client(url: string, manifest: any) {
  const post = (body: string, headers: Record<string, string> = {}) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'MCP-Protocol-Version': manifest.protocolVersion,
        ...headers,
      },
      body,
    });

  async function send(method: string, params: Args) {
    const res = await post(JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }));
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${method}: HTTP ${res.status}, non-JSON body: ${text.slice(0, 200)}`);
    }
  }

  async function rpc(method: string, params: Args = {}) {
    const body = await send(method, params);
    if (body.error) throw new Error(`${method}: ${JSON.stringify(body.error)}`);
    return body.result;
  }

  /** The JSON-RPC error code of a call that should fail, or a description of what came back instead. */
  async function errorCode(method: string, params: Args) {
    const body = await send(method, params);
    return body.error?.code ?? `no error (${JSON.stringify(body.result).slice(0, 120)})`;
  }

  const call = async (name: string, args: Args = {}) => rpc('tools/call', { name, arguments: args });
  /** structuredContent of a tool call that must succeed. */
  const data = async (name: string, args: Args = {}) => {
    const r = await call(name, args);
    if (r.isError) throw new Error(`${name}: isError ${JSON.stringify(r.content).slice(0, 200)}`);
    return r.structuredContent;
  };
  return { url, manifest, post, rpc, errorCode, call, data };
}
type Client = ReturnType<typeof client>;

/** Runs one named check; `fail` records a problem without stopping the check. Returns the problem count. */
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

/** Checks every server shares: initialize, tools/list against the manifest, the HTTP rules and the Origin check. */
async function commonChecks(c: Client) {
  await check('initialize', async (fail) => {
    const r = await c.rpc('initialize', {
      protocolVersion: c.manifest.protocolVersion,
      capabilities: {},
      clientInfo: { name: 'mcp-smoke', version: '1.0.0' },
    });
    if (r.serverInfo?.name !== c.manifest.serverInfo.name) fail(`serverInfo.name ${r.serverInfo?.name}`);
    if (r.protocolVersion !== c.manifest.protocolVersion) fail(`protocolVersion ${r.protocolVersion}`);
    if (JSON.stringify(r.capabilities) !== JSON.stringify(c.manifest.capabilities)) {
      fail(`capabilities ${JSON.stringify(r.capabilities)} vs manifest ${JSON.stringify(c.manifest.capabilities)}`);
    }
    if (!r.instructions) fail('no instructions');
    if (c.manifest.instructions && r.instructions !== c.manifest.instructions) fail('instructions differ from the published manifest');
  });

  await check('tools/list matches the manifest', async (fail) => {
    const { tools } = await c.rpc('tools/list');
    const names = tools.map((t: any) => t.name).sort().join(',');
    const expected = c.manifest.tools.map((t: any) => t.name).sort().join(',');
    if (names !== expected) fail(`server ${names} vs manifest ${expected}`);
    for (const t of tools) {
      if (!t.outputSchema) fail(`${t.name} has no outputSchema`);
      if (t.annotations?.readOnlyHint !== true) fail(`${t.name} not readOnly`);
    }
  });

  await check('unknown tool is -32602', async (fail) => {
    const tool = await c.errorCode('tools/call', { name: 'delete_everything', arguments: {} });
    if (tool !== -32602) fail(`unknown tool: ${tool}, expected -32602`);
  });

  await check('GET is rejected', async (fail) => {
    const res = await fetch(c.url, { headers: { Accept: 'text/event-stream' } });
    if (res.status !== 405) fail(`GET returned ${res.status}`);
  });

  await check('bad JSON is a parse error', async (fail) => {
    const res = await c.post('{not json');
    const body = await res.json();
    if (res.status !== 400 || body.error?.code !== -32700) fail(`HTTP ${res.status} ${JSON.stringify(body)}`);
  });

  await check('Origin is validated', async (fail) => {
    const list = JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/list', params: {} });
    const foreign = await c.post(list, { Origin: 'https://evil.example' });
    if (foreign.status !== 403) fail(`foreign Origin returned ${foreign.status}, expected 403`);
    const own = await c.post(list, { Origin: new URL(c.manifest.url).origin });
    if (own.status !== 200) fail(`own Origin returned ${own.status}`);
  });
}

/** Prints the result line for one server and returns its failure count. */
async function server(label: string, url: string, run: () => Promise<void>) {
  console.log(`\n${label} (${url})`);
  const before = failures;
  await run();
  const n = failures - before;
  console.log(n ? `${n} failure(s) against ${url}` : `All MCP checks passed against ${url}`);
}

// ---- Portfolio server ----

await server('Portfolio server', endpoint, async () => {
  const p = client(endpoint, JSON.parse(readFileSync(manifestPath, 'utf8')));
  await commonChecks(p);

  await check('get_projects', async (fail) => {
    const all = await p.data('get_projects');
    if (all.count < 10) fail(`only ${all.count} projects`);
    if (!all.projects[0].url?.startsWith('https://kin.rag.wtf/projects/')) fail('no page url');
    if (!(await p.data('get_projects', { kind: 'oss' })).projects.every((x: any) => x.kind === 'oss')) fail('kind filter');
    const mcp = await p.data('get_projects', { technology: 'mcp' });
    if (!mcp.projects.some((x: any) => x.slug === 'project-concord')) fail('technology filter misses project-concord');
  });

  await check('get_project', async (fail) => {
    if ((await p.data('get_project', { slug: 'claim-pilot' }))?.project?.title?.startsWith('Claim Pilot') !== true) fail('claim-pilot');
    if ((await p.call('get_project', { slug: 'nope' })).isError !== true) fail('unknown slug is not an error');
  });

  await check('get_experience', async (fail) => {
    const r = await p.data('get_experience');
    if (r.count < 5) fail(`only ${r.count} roles`);
    if (!r.experience[0].description?.length) fail('newest role has no description');
  });

  await check('get_articles', async (fail) => {
    const all = await p.data('get_articles');
    if (all.count < 5) fail(`only ${all.count} articles`);
    if (all.articles[0].publishDate < all.articles[all.count - 1].publishDate) fail('not newest first');
    if ((await p.data('get_articles', { tag: 'mcp' })).count === 0) fail('tag filter found nothing for "mcp"');
  });

  await check('search_portfolio', async (fail) => {
    const r = await p.data('search_portfolio', { query: 'WhatsApp' });
    if (r.projects.length + r.experience.length === 0) fail('no hits for WhatsApp');
  });

  await check('get_contact_info', async (fail) => {
    if (!(await p.data('get_contact_info')).email?.includes('@')) fail('no email');
  });

  await check('resources match the manifest', async (fail) => {
    const listed = new Set((await p.rpc('resources/list')).resources.map((r: any) => r.uri));
    const templates = (await p.rpc('resources/templates/list')).resourceTemplates.map((t: any) => t.uriTemplate);
    for (const { uri } of p.manifest.resources) {
      if (uri.includes('{') ? !templates.includes(uri) : !listed.has(uri)) fail(`server lacks ${uri}`);
    }
    if (!listed.has('portfolio://projects/claim-pilot')) fail('project instances not listed');
    const project = await p.rpc('resources/read', { uri: 'portfolio://projects/project-concord' });
    if (!JSON.parse(project.contents[0].text).title?.startsWith('Project Concord')) fail('template read');
    const full = await p.rpc('resources/read', { uri: 'portfolio://llms-full' });
    if (!full.contents[0].text.includes('## Projects')) fail('llms-full read');
  });

  await check('unknown resource is -32002', async (fail) => {
    for (const uri of ['portfolio://projects/nope', 'portfolio://nope']) {
      const code = await p.errorCode('resources/read', { uri });
      if (code !== -32002) fail(`${uri}: ${code}, expected -32002`);
    }
  });
});

// ---- HIRE check server ----

await server('HIRE check server', hireEndpoint, async () => {
  let hireManifest: any;
  await check(`manifest ${hireManifestPath}`, async (fail) => {
    hireManifest = JSON.parse(readFileSync(hireManifestPath, 'utf8'));
    if (hireManifest.serverInfo?.name !== 'kin-hire') fail(`serverInfo.name ${hireManifest.serverInfo?.name}`);
    if (!/never stores or logs/.test(hireManifest.description ?? '')) fail('description lacks the privacy statement');
  });
  if (!hireManifest) return;
  const h = client(hireEndpoint, hireManifest);
  await commonChecks(h);

  await check('get_hire_checklist', async (fail) => {
    const r = await h.data('get_hire_checklist');
    if (r.sections?.h?.length !== 7) fail(`${r.sections?.h?.length} H items, expected 7`);
    if (Object.keys(r.redFlags ?? {}).length !== 13) fail(`${Object.keys(r.redFlags ?? {}).length} red flags, expected 13`);
    if (!r.source?.commit) fail('no framework source');
    if (r.gates?.intent?.label !== 'Need vs. Hype') fail('no Part 1 gates');
    if (r.fire?.criteria?.length !== 7) fail(`${r.fire?.criteria?.length} FIRE criteria, expected 7`);
    if (typeof r.interviewInstructions !== 'string' || !r.interviewInstructions.trim()) fail('no interview instructions in the checklist result');
  });

  await check('assess_agent: the fraud example', async (fail) => {
    const r = await h.data('assess_agent', FRAUD_CASE as unknown as Args);
    if (r.verdict !== 'TRAIN') fail(`verdict ${r.verdict}`);
    if (r.scores?.total !== 42) fail(`total ${r.scores?.total}`);
    if (!String(r.reportUrl).startsWith('https://kin.rag.wtf/hire/#a=')) fail(`reportUrl ${String(r.reportUrl).slice(0, 60)}`);
  });

  await check('assess_agent: a Part 1 stop needs only the answers up to its gate', async (fail) => {
    const r = await h.data('assess_agent', { part1: { canStateBusinessProblem: false } });
    if (r.verdict !== 'DO NOT BUILD') fail(`verdict ${r.verdict}`);
  });

  await check('assess_agent: invalid answers are -32602', async (fail) => {
    const bad = { ...FRAUD_CASE, h: { ...FRAUD_CASE.h, trust: 7 } };
    const code = await h.errorCode('tools/call', { name: 'assess_agent', arguments: bad });
    if (code !== -32602) fail(`h.trust 7: ${code}, expected -32602`);
    const incomplete = await h.errorCode('tools/call', { name: 'assess_agent', arguments: { name: 'x' } });
    if (incomplete !== -32602) fail(`incomplete answers: ${incomplete}, expected -32602`);
  });
});

console.log(failures ? `\n${failures} failure(s) in total` : '\nAll MCP checks passed on both servers');
process.exit(failures ? 1 : 0);
