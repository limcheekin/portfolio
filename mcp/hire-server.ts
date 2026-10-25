/**
 * The HIRE check MCP server, served at https://kin.rag.wtf/mcp/hire by the same Node process as the portfolio
 * server (mcp/server.ts routes the path here). Same conventions: stateless Streamable HTTP, POST only, JSON
 * responses, no auth, the Origin check, spec error codes. Pure computation with the shared scoring module
 * (src/lib/hire/): no data files, no writes, nothing stored. Tools are defined in src/lib/hire-tools.ts and run by
 * runHireTool in src/lib/hire/tools-runtime.ts.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { HIRE_CAPABILITIES, HIRE_INSTRUCTIONS, HIRE_SERVER, hireToolEntries } from '../src/lib/hire-tools';
import { REPORT_BASE } from '../src/lib/hire/link.ts';
import { HireInputError, runHireTool, type HireToolName } from '../src/lib/hire/tools-runtime.ts';
import { TOOL_ANNOTATIONS } from '../src/lib/portfolio-tools';
import { wrapRequestHandler } from './request-handlers';

const TOOL_NAMES = new Set<string>(hireToolEntries().map(([name]) => name));

export function buildHireServer(): McpServer {
  const server = new McpServer(
    { name: HIRE_SERVER.name, title: HIRE_SERVER.title, version: HIRE_SERVER.version, websiteUrl: REPORT_BASE },
    { instructions: HIRE_INSTRUCTIONS },
  );

  // The tools/call wrapper below runs the tool before the SDK handler, so validation errors are JSON-RPC errors.
  // It hands the result to the registered callback through the call's `extra` object, which the SDK passes on.
  const results = new WeakMap<object, object>();

  for (const [name, tool] of hireToolEntries()) {
    server.registerTool(
      name,
      { title: tool.title, description: tool.description, inputSchema: tool.input, outputSchema: tool.output, annotations: TOOL_ANNOTATIONS },
      async (_input: object, extra: object) => {
        const data = results.get(extra);
        if (!data) throw new Error(`${name}: no result`);
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as Record<string, unknown> };
      },
    );
  }

  // McpServer advertises list_changed by default; this stateless server has no stream to send it on.
  server.server.registerCapabilities(HIRE_CAPABILITIES);

  // validateAnswers (inside runHireTool) is the one rule source. Running it here, before the SDK's handler, makes
  // bad or incomplete answers a -32602 error (the SDK would turn any throw into an isError result), and an unknown
  // tool -32602 as in the portfolio server.
  wrapRequestHandler(server, 'tools/call', (inner) => async (request, extra) => {
    const name = request.params?.name;
    if (!TOOL_NAMES.has(name)) throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${name}`);
    try {
      results.set(extra, await runHireTool(name as HireToolName, request.params?.arguments ?? {}));
    } catch (err) {
      if (err instanceof HireInputError) throw new McpError(ErrorCode.InvalidParams, err.issues.join('; '));
      throw err;
    }
    return inner(request, extra);
  });
  return server;
}
