import { useEffect } from 'react';
import { runTool, type ToolName } from '../lib/portfolio-query';
import type { Portfolio } from '../lib/portfolio-schema';

/**
 * In-browser WebMCP tools, registered only where the browser provides the API: `document.modelContext` per the
 * WebMCP draft (https://webmachinelearning.github.io/webmcp/), or `navigator.modelContext` in older builds.
 * The tool list and JSON Schemas come from /.well-known/mcp.json (written from src/lib/portfolio-tools.ts), fetched
 * only in such browsers, so pages carry no schemas; answers come from the same handlers as the MCP server at /mcp.
 */
interface WebMCPToolsProps {
  portfolioApiUrl: string;
  manifestUrl: string;
}

interface ManifestTool {
  name: ToolName;
  title: string;
  description: string;
  inputSchema: object;
  annotations: object;
}

export default function WebMCPTools({ portfolioApiUrl, manifestUrl }: WebMCPToolsProps) {
  useEffect(() => {
    const mc = (document as any).modelContext ?? (navigator as any).modelContext;
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

    // Aborting the signal unregisters every tool (the draft has no unregisterTool; older builds do).
    const registration = new AbortController();
    const registered: string[] = [];
    fetch(manifestUrl)
      .then((res) => res.json())
      .then(({ tools }: { tools: ManifestTool[] }) => {
        if (registration.signal.aborted) return;
        for (const { name, title, description, inputSchema, annotations } of tools) {
          const tool = {
            name,
            title,
            description,
            inputSchema,
            annotations,
            async execute(input: object = {}) {
              try {
                return text(runTool(name, await load(), input));
              } catch (err) {
                return { ...text({ error: (err as Error).message }), isError: true };
              }
            },
          };
          try {
            // The draft's registerTool returns a promise; older builds return nothing.
            Promise.resolve(mc.registerTool(tool, { signal: registration.signal })).catch(() => {});
            registered.push(name);
          } catch {
            // Registration refused (unsupported shape in this build): the page works without the tool
          }
        }
      })
      .catch(() => {
        // No manifest (offline, blocked): the page works without WebMCP tools
      });

    return () => {
      registration.abort();
      if (typeof mc.unregisterTool !== 'function') return;
      for (const name of registered) {
        try {
          mc.unregisterTool(name);
        } catch {
          // already gone
        }
      }
    };
  }, [portfolioApiUrl, manifestUrl]);

  return null;
}
