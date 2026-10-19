// Bundles the MCP server (mcp/server.ts) into one Node ESM file for the nginx image. Not under dist/: the
// server is code to run, not a file to publish.
import { build } from 'esbuild';

await build({
  entryPoints: ['mcp/server.ts'],
  outfile: 'build/mcp/server.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  logLevel: 'info',
});
