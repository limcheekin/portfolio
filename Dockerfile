# Stage 1: Build
FROM node:20-alpine AS build
# git: the sitemap's per-page lastmod comes from commit history, fetched during the build (scripts/sitemap-lastmod.mjs)
RUN apk add --no-cache git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve (nginx for the static site, Node for the MCP server nginx proxies at /mcp)
FROM nginx:alpine
RUN apk add --no-cache nodejs
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/build/mcp/server.mjs /opt/mcp/server.mjs
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx-agent-file-headers.conf /etc/nginx/snippets/agent-file-headers.conf
COPY docker/40-mcp-server.sh /docker-entrypoint.d/40-mcp-server.sh
RUN chmod +x /docker-entrypoint.d/40-mcp-server.sh
ENV PORTFOLIO_DIR=/usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
