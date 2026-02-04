# syntax=docker/dockerfile:1.4
# Stage 1: Build
FROM --platform=linux/amd64 node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY schema.graphql ./
RUN npm run build

# Stage 2: Runtime
FROM --platform=linux/amd64 node:22-slim AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/schema.graphql ./
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
ENV MCP_SERVER_PORT=1339
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:1339/', r => process.exit(r.statusCode === 200 ? 0 : 1))"
USER node
EXPOSE 1339
CMD ["node", "dist/index.js"]