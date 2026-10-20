/**
 * Read-only MCP server for the portfolio, served at https://kin.rag.wtf/mcp.
 *
 * Streamable HTTP in stateless mode: every POST gets a fresh server and transport (the SDK's stateless pattern),
 * responses are plain JSON (no SSE stream, no sessions). It runs inside the nginx container
 * (docker/40-mcp-server.sh), and nginx proxies `location = /mcp` to it with a rate limit. Data comes from the
 * same build it ships with (api/portfolio.json and llms-full.txt). Tools and resources are defined in
 * src/lib/portfolio-tools.ts, their handlers in src/lib/portfolio-query.ts. No writes, no auth, no secrets.
 *
 * Local: npm run build && npm run mcp:dev   (serves http://127.0.0.1:3001/mcp from dist/)
 */
import { createServer, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { SITE_URL } from '../src/data/site';
import { getProject, listArticles, runTool } from '../src/lib/portfolio-query';
import type { Portfolio } from '../src/lib/portfolio-schema';
import {
  MCP_CAPABILITIES,
  MCP_INSTRUCTIONS,
  MCP_RESOURCES,
  MCP_SERVER,
  PROJECT_RESOURCE_TEMPLATE,
  TOOL_ANNOTATIONS,
  toolEntries,
  type ResourceName,
} from '../src/lib/portfolio-tools';

const DATA_DIR = process.env.PORTFOLIO_DIR ?? 'dist';
const HOST = process.env.MCP_HOST ?? '127.0.0.1';
const PORT = Number(process.env.MCP_PORT ?? 3001);
const MAX_BODY_BYTES = 64 * 1024;

const portfolio: Portfolio = JSON.parse(readFileSync(join(DATA_DIR, 'api', 'portfolio.json'), 'utf8'));

// The data never changes while the process runs, so resource bodies are serialised once.
const pretty = (data: unknown) => JSON.stringify(data, null, 2);
const RESOURCE_TEXT: Record<ResourceName, string> = {
  portfolio: pretty(portfolio),
  projects: pretty(portfolio.projects),
  experience: pretty(portfolio.experience),
  articles: pretty(listArticles(portfolio)),
  'llms-full': readFileSync(join(DATA_DIR, 'llms-full.txt'), 'utf8'),
};
const PROJECT_RESOURCES = portfolio.projects.map((p) => ({
  uri: `portfolio://projects/${p.slug}`,
  name: p.slug,
  title: p.title,
  mimeType: 'application/json',
}));

/** MCP's "Resource not found" error (code -32002, not in the SDK's ErrorCode enum). */
const resourceNotFound = (uri: string) => new McpError(-32002, `Resource not found: ${uri}`, { uri });

type Handler = (request: any, extra: unknown) => Promise<unknown>;

/**
 * Spec error codes where the SDK's McpServer differs: an unknown tool is a JSON-RPC -32602 error (the SDK turns it
 * into an isError tool result), and an unknown resource is -32002 (the SDK sends -32602). McpServer offers no hook
 * for either, so this wraps the handlers it registered; mcp:smoke checks both codes, so an SDK change shows up there.
 */
function useSpecErrorCodes(server: McpServer, toolNames: Set<string>) {
  const handlers: Map<string, Handler> = (server.server as any)._requestHandlers;
  const wrap = (method: string, fn: (inner: Handler) => Handler) => {
    const inner = handlers.get(method);
    if (!inner) throw new Error(`mcp: no ${method} handler to wrap`);
    handlers.set(method, fn(inner));
  };
  wrap('tools/call', (inner) => async (request, extra) => {
    const name = request.params?.name;
    if (!toolNames.has(name)) throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${name}`);
    return inner(request, extra);
  });
  wrap('resources/read', (inner) => async (request, extra) => {
    try {
      return await inner(request, extra);
    } catch (err) {
      if (err instanceof McpError && err.code === ErrorCode.InvalidParams && /not found/.test(err.message)) {
        throw resourceNotFound(request.params?.uri);
      }
      throw err;
    }
  });
}

const TOOL_NAMES = new Set(toolEntries().map(([name]) => name));

function buildServer(): McpServer {
  const server = new McpServer(
    { name: MCP_SERVER.name, title: MCP_SERVER.title, version: MCP_SERVER.version, websiteUrl: SITE_URL },
    { instructions: MCP_INSTRUCTIONS },
  );

  for (const [name, tool] of toolEntries()) {
    server.registerTool(
      name,
      { title: tool.title, description: tool.description, inputSchema: tool.input, outputSchema: tool.output, annotations: TOOL_ANNOTATIONS },
      // A thrown Error (e.g. an unknown slug) becomes an isError result in the SDK.
      async (input: object) => {
        const data = runTool(name, portfolio, input);
        return { content: [{ type: 'text' as const, text: pretty(data) }], structuredContent: data };
      },
    );
  }

  for (const r of MCP_RESOURCES) {
    server.registerResource(
      r.name,
      `portfolio://${r.name}`,
      { title: r.title, description: r.description, mimeType: r.mimeType },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: r.mimeType, text: RESOURCE_TEXT[r.name] }] }),
    );
  }

  server.registerResource(
    'project',
    new ResourceTemplate(PROJECT_RESOURCE_TEMPLATE, {
      list: async () => ({ resources: PROJECT_RESOURCES }),
      complete: { slug: (value) => PROJECT_RESOURCES.map((r) => r.name).filter((s) => s.startsWith(value)) },
    }),
    { title: 'Project', description: 'One project by slug', mimeType: 'application/json' },
    async (uri, { slug }) => {
      const project = getProject(portfolio, String(slug));
      if (!project) throw resourceNotFound(uri.href);
      return { contents: [{ uri: uri.href, mimeType: 'application/json', text: pretty(project) }] };
    },
  );

  // McpServer advertises list_changed by default; this stateless server has no stream to send it on.
  server.server.registerCapabilities(MCP_CAPABILITIES);
  useSpecErrorCodes(server, TOOL_NAMES);
  return server;
}

// ---- HTTP ----

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version',
  'Access-Control-Max-Age': '86400',
};

function sendError(res: ServerResponse, status: number, code: number, message: string, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }));
}

const http = createServer(async (req, res) => {
  for (const [name, value] of Object.entries(CORS_HEADERS)) res.setHeader(name, value);
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;

  // Liveness probe; nginx only proxies /mcp, so this is reachable from inside the container alone.
  if (path === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (path !== '/mcp') return sendError(res, 404, -32601, 'Not found. The MCP endpoint is POST /mcp.');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    return sendError(res, 405, -32000, 'Method not allowed. This stateless server takes POST /mcp only (no SSE stream).', {
      Allow: 'POST, OPTIONS',
    });
  }

  // The transport reads and size-checks the body itself (413 over the limit, 400/-32700 for invalid JSON).
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: MAX_BODY_BYTES,
  });
  res.on('close', () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('mcp: request failed', err);
    if (!res.headersSent) sendError(res, 500, -32603, 'Internal error.');
  }
});

http.listen(PORT, HOST, () => {
  console.log(
    `mcp: listening on http://${HOST}:${PORT}/mcp (data ${DATA_DIR}: ${portfolio.projects.length} projects, ` +
      `${portfolio.articles.length} articles, ${portfolio.experience.length} roles)`,
  );
});

const shutdown = () => http.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
