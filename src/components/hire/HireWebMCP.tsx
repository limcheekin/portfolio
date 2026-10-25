import { useEffect } from 'react';
import { runHireTool, type HireToolName } from '../../lib/hire/tools-runtime';
import { registerWebMcpTools } from '../../lib/webmcp';

/**
 * WebMCP tools for /hire/: get_hire_checklist and assess_agent, computed in the page (no network call beyond the
 * schema manifest). zod and the MCP SDK stay out of the browser: only the zod-free runtime is imported.
 */
export default function HireWebMCP({ manifestUrl }: { manifestUrl: string }) {
  useEffect(
    () => registerWebMcpTools(manifestUrl, (name, input) => runHireTool(name as HireToolName, input)),
    [manifestUrl],
  );
  return null;
}
