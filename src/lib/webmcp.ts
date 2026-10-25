/**
 * Shared WebMCP registration, used by the portfolio tools and the HIRE tools. Registers only where the browser
 * provides the API: `document.modelContext` per the WebMCP draft (https://webmachinelearning.github.io/webmcp/),
 * or `navigator.modelContext` in older builds. The tool list and JSON Schemas come from the manifest at
 * `manifestUrl`, fetched only in such browsers, so pages carry no schemas. Call it from an effect (it touches
 * `document`); it returns the cleanup.
 */
interface ManifestTool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: object;
}

export function registerWebMcpTools(
  manifestUrl: string,
  run: (name: string, input: object) => Promise<unknown> | unknown,
): () => void {
  const mc = (document as any).modelContext ?? (navigator as any).modelContext;
  if (!mc) return () => {};

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
              return text(await run(name, input));
            } catch (err) {
              // Invalid input carries the validator's issues so the caller can fix and retry
              const issues = (err as { issues?: unknown }).issues;
              return {
                ...text({ error: (err as Error).message, ...(Array.isArray(issues) ? { issues } : {}) }),
                isError: true,
              };
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
}
