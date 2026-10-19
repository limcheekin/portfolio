import { useEffect } from 'react';
import { runTool, type ToolName } from '../lib/portfolio-query';
import type { Portfolio } from '../lib/portfolio-schema';

/**
 * In-browser WebMCP tools (navigator.modelContext), registered only where the browser provides the API.
 * The tool list and JSON Schemas come from src/lib/portfolio-tools.ts via BaseLayout (built at build time, so
 * zod stays out of the bundle); answers come from the same handlers as the MCP server at /mcp.
 */
interface WebMCPToolsProps {
  portfolioApiUrl: string;
  tools: Array<{ name: ToolName; description: string; inputSchema: object }>;
}

export default function WebMCPTools({ portfolioApiUrl, tools }: WebMCPToolsProps) {
  useEffect(() => {
    const mc = (navigator as any).modelContext;
    if (!mc) return;

    let data: Promise<Portfolio> | undefined;
    const load = () =>
      (data ??= fetch(portfolioApiUrl)
        .then((res) => res.json())
        .catch((err) => {
          data = undefined; // let the next call retry after a network error
          throw err;
        }));
    const text = (value: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });

    for (const tool of tools) {
      try {
        mc.registerTool({
          ...tool,
          async execute(input: object = {}) {
            try {
              return text(runTool(tool.name, await load(), input));
            } catch (err) {
              return { ...text({ error: (err as Error).message }), isError: true };
            }
          },
        });
      } catch {
        // WebMCP not supported in this browser — silently skip
      }
    }

    return () => {
      for (const tool of tools) {
        try {
          mc.unregisterTool(tool.name);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [portfolioApiUrl, tools]);

  return null;
}
