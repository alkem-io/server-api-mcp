# Data Model

## Key Entities

### Kratos Authentication Session

Represents the authenticated session obtained via Kratos login flow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiToken` | string | Yes | OAuth/OIDC token from Kratos authentication |
| `isAuthenticated` | boolean | Yes | Session validity flag |
| `config` | AlkemioClientConfig | Yes | Environment-based configuration |

### GraphQL Operation

Represents a query or mutation operation conforming to schema.graphql.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | GraphQL query/mutation string |
| `variables` | Record<string, any> | No | Operation variables |
| `operationName` | string | No | Named operation for error tracing |

### MCP Tool

Represents an exposed operation available to MCP clients.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Tool identifier ( kebab-case) |
| `description` | string | Yes | Human-readable purpose |
| `schema` | ZodSchema | Yes | Input validation |
| `execute(input: T)` | async function | Yes | Operation handler |

### MCP Resource

Represents a data resource exposed to MCP clients.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uri` | string | Yes | Resource identifier |
| `name` | string | Yes | Resource name |
| `mimeType` | string | Yes | Content type (e.g., application/json) |
| `read()` | async function | Yes | Resource content loader |

## Validation Rules

- All GraphQL operations MUST validate inputs before execution (Security-First principle)
- Authentication MUST be verified before any operation
- Token refresh is not in scope for MVP (constitution FR-007)

## State Transitions

```
NOT_AUTHENTICATED -> AUTHENTICATED (via enableAuthentication())
AUTHENTICATED -> INVALID (token expired, no auto-refresh for MVP)
```