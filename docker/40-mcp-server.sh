#!/bin/sh
# Run by the nginx image's /docker-entrypoint.sh before nginx starts. Keeps the MCP server (proxied by nginx at
# /mcp) running in the background and restarts it if it exits; the static site does not depend on it.
(
  while true; do
    node /opt/mcp/server.mjs
    echo "mcp: server exited with status $?, restarting in 2s" >&2
    sleep 2
  done
) &
