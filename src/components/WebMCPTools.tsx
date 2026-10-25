import { useEffect } from 'react';
import { runTool, type ToolName } from '../lib/portfolio-query';
import type { Portfolio } from '../lib/portfolio-schema';
import { registerWebMcpTools } from '../lib/webmcp';

/**
 * In-browser WebMCP tools (registration in src/lib/webmcp.ts). The tool list and JSON Schemas come from
 * /.well-known/mcp.json (written from src/lib/portfolio-tools.ts); answers come from the same handlers as the
 * MCP server at /mcp.
 */
interface WebMCPToolsProps {
  portfolioApiUrl: string;
  manifestUrl: string;
}

export default function WebMCPTools({ portfolioApiUrl, manifestUrl }: WebMCPToolsProps) {
  useEffect(() => {
    let data: Promise<Portfolio> | undefined;
    const load = () =>
      (data ??= fetch(portfolioApiUrl)
        .then((res) => res.json())
        .catch((err) => {
          data = undefined; // let the next call retry after a network error
          throw err;
        }));
    return registerWebMcpTools(manifestUrl, async (name, input) => runTool(name as ToolName, await load(), input));
  }, [portfolioApiUrl, manifestUrl]);

  return null;
}
