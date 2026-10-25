import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

export type Handler = (request: any, extra: any) => Promise<unknown>;

/**
 * Replaces the handler McpServer registered for `method` with `fn(inner)`. McpServer offers no hook to run code
 * before its own tools/call or resources/read logic, so both servers wrap the registered handlers; mcp:smoke checks
 * the behaviour this gives, so an SDK change shows up there.
 */
export function wrapRequestHandler(server: McpServer, method: string, fn: (inner: Handler) => Handler) {
  const handlers: Map<string, Handler> = (server.server as any)._requestHandlers;
  const inner = handlers.get(method);
  if (!inner) throw new Error(`mcp: no ${method} handler to wrap`);
  handlers.set(method, fn(inner));
}

/**
 * An unknown tool is a JSON-RPC -32602 error (the spec), where McpServer answers with an isError tool result. Wrap
 * this last, so it runs before any other tools/call wrapper.
 */
export function rejectUnknownTools(server: McpServer, toolNames: Set<string>) {
  wrapRequestHandler(server, 'tools/call', (inner) => async (request, extra) => {
    const name = request.params?.name;
    if (!toolNames.has(name)) throw new McpError(ErrorCode.InvalidParams, `Unknown tool: ${name}`);
    return inner(request, extra);
  });
}
