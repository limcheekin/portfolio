import { useEffect } from 'react';
import { runTool, type ToolName } from '../lib/portfolio-query';
import type { Portfolio } from '../lib/portfolio-schema';

/**
 * In-browser WebMCP tools (navigator.modelContext), registered only where the browser provides the API.
 * The tool list and JSON Schemas come from /.well-known/mcp.json (written from src/lib/portfolio-tools.ts), fetched
 * only in such browsers, so pages carry no schemas; answers come from the same handlers as the MCP server at /mcp.
 */
interface WebMCPToolsProps {
  portfolioApiUrl: string;
  manifestUrl: string;
}

interface ManifestTool {
  name: ToolName;
  description: string;
  inputSchema: object;
}

export default function WebMCPTools({ portfolioApiUrl, manifestUrl }: WebMCPToolsProps) {
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

    let cancelled = false;
    const registered: string[] = [];
    fetch(manifestUrl)
      .then((res) => res.json())
      .then(({ tools }: { tools: ManifestTool[] }) => {
        if (cancelled) return;
        for (const { name, description, inputSchema } of tools) {
          try {
            mc.registerTool({
              name,
              description,
              inputSchema,
              async execute(input: object = {}) {
                try {
                  return text(runTool(name, await load(), input));
                } catch (err) {
                  return { ...text({ error: (err as Error).message }), isError: true };
                }
              },
            });
            registered.push(name);
          } catch {
            // WebMCP not supported in this browser — silently skip
          }
        }
      })
      .catch(() => {
        // No manifest (offline, blocked): the page works without WebMCP tools
      });

    return () => {
      cancelled = true;
      for (const name of registered) {
        try {
          mc.unregisterTool(name);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [portfolioApiUrl, manifestUrl]);

  return null;
}
