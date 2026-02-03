# Research Findings

## Decision 1: Runtime & Framework Selection

**Decision**: Use Node.js runtime with existing mcp-framework

**Rationale**: The mcp-framework is Node.js-specific (uses stdio transport, child processes, Node.js streams). Reimplementing MCP transport for Bun would be a significant engineering effort outside MVP scope.

**Alternatives considered**:
- Bun + custom MCP transport: Rejected - requires reimplementing ~1000 LOC of transport layer
- TypeScript node script: Rejected - mcp-framework provides tool registration, discovery, and execution framework out of box

## Decision 2: GraphQL Client Selection

**Decision**: Continue using graphql-request

**Rationale**: Eden (elysiajs/eden) is a type-safe fetch library for REST endpoints, NOT a GraphQL client. graphql-request (~8KB, fetch-based) works with Bun natively via fetch.

**Source**: Eden documentation confirms it uses Elysia route inference, not GraphQL

## Decision 3: Authentication Pattern

**Decision**: Use direct Kratos HTTP API calls (no client library)

**Rationale**: Direct HTTP provides:
- Full control over authentication flow and token lifecycle
- No dependency on @alkemio/client-lib wrapper
- Direct access to Kratos non-interactive flow endpoints
- Proper token refresh handling

**Token handling**: POST to Kratos /self-service/login API with email/password credentials. Extract session token from response. Use Bearer token for subsequent GraphQL calls.

## Decision 4: Architecture Confirmation

**Architecture confirmed**:
```
Node.js runtime
├── mcp-framework (MCP protocol handling)
├── @alkemio/client-lib (Kratos auth + GraphQL)
└── graphql-request (GraphQL queries/mutations)
```

**Complexity**: MCP transport layer is managed by mcp-framework; no custom transport needed.

## Open Questions Resolved

| Question | Resolution |
|----------|-------------|
| Can Bun be used? | No - mcp-framework requires Node.js |
| Can Eden replace graphql-request? | No - Eden is REST-only |
| What's the auth pattern? | Singleton service with @alkemio/client-lib |