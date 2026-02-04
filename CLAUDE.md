# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that exposes Alkemio's GraphQL API as discoverable tools and resources. The server uses the `mcp-framework` to create MCP-compliant tools that translate MCP client requests into GraphQL operations against the Alkemio platform.

**Authentication Flow**: The server authenticates using Ory Kratos email/password non-interactive flow via direct HTTP API calls. Tokens are obtained during server initialization and used for all subsequent API calls.

## Development Commands

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript and build MCP (runs tsc && mcp-build)
npm run watch            # Watch mode for development (tsc --watch)
npm start                # Start the server
```

## Architecture

```
src/
├── index.ts             # Server entry point, initializes auth then starts MCP server
├── services/
│   └── KratosAuth.ts    # Direct Kratos HTTP authentication service
├── tools/
│   └── *.ts             # MCP tools extending MCPTool class (auto-discovered)
└── resources/
    └── *.ts             # MCP resources extending MCPResource class
```

**Key Pattern**: Tools use `KratosAuth` service to get authenticated `GraphQLClient` instances with Bearer tokens from Kratos authentication. Each tool calls `getKratosAuthService()` to access the authenticated client.

**Tool Structure** (`src/tools/ExampleTool.ts`):
- Extend `MCPTool<T>` where T is input interface
- Define `name`, `description`, and Zod `schema` for input validation
- Implement `async execute(input: T)` method
- Use `graphql-request` for GraphQL queries against Alkemio API

**Resource Structure** (`src/resources/ExampleResource.ts`):
- Extend `MCPResource`
- Define `uri`, `name`, `description`, `mimeType`
- Implement `async read()` returning `ResourceContent[]`

## Configuration

Environment variables (see `.env.example`):
- `API_ENDPOINT_PRIVATE_GRAPHQL` - Alkemio GraphQL endpoint
- `AUTH_ADMIN_EMAIL` / `AUTH_ADMIN_PASSWORD` - Kratos credentials
- `AUTH_ORY_KRATOS_PUBLIC_BASE_URL` - Kratos public API
- `MCP_SERVER_PORT` - MCP server port (default: 1339)

## GraphQL Schema

The Alkemio API schema is defined in `schema.graphql` (generated from `graphql_schema.json`). Use this to understand available queries and mutations. The functional spec in `functional_spec.md` outlines planned tools for Spaces, Contributors, Posts, and Whiteboards.

## Transport

Uses HTTP streaming transport for web-accessible MCP endpoints. Configure CORS via `transport.options.cors.allowOrigin`.

## Active Technologies
- Node.js + TypeScript (existing codebase uses node_modules) + mcp-framework, graphql-request, direct Kratos HTTP (001-alkemio-mcp-server)
- N/A (stateless MCP server) (001-alkemio-mcp-server)
- Node.js 22.x (>=18.19.0 required) | TypeScript 5.3 + mcp-framework 0.2.13, graphql-request 6.1, @alkemio/client-lib 0.35, dotenv 16.5 (002-deploy-mcp-package)
- N/A (stateless MCP server - no persistent storage required) (002-deploy-mcp-package)

## Recent Changes
- 002-constitution-amendment: Removed bun/elysia/eden/biome requirements. Changed authentication from @alkemio/client-lib to direct Kratos HTTP. Mandated mcp-framework usage.
