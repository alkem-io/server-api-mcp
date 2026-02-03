# Feature Specification: Alkemio MCP Server

**Feature Branch**: `001-alkemio-mcp-server`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "create mcp server that has a sole purpose to interface with the alkemio api defined in schema.graphql. We need only the queries and mutations. The authentication happens via ory kratos email:password non-interactive flow."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Server Authentication (Priority: P1)

As an AI model or LLM application using the MCP server,
I want to authenticate against the Alkemio platform using my Kratos credentials,
So that I can access the Alkemio API with proper authorization.

**Why this priority**: Authentication is the foundation of all operations. Without it, no queries or mutations can execute.

**Independent Test**: Can be verified by attempting any authenticated GraphQL operation without valid credentials and observing rejection.

**Acceptance Scenarios**:

1. **Given** the MCP server is configured with valid Kratos email and password, **When** the server starts, **Then** it MUST authenticate with Alkemio using Ory Kratos non-interactive flow.
2. **Given** authentication credentials are invalid, **When** the server attempts to start, **Then** it MUST reject startup with clear authentication error.
3. **Given** an active authenticated session, **When** the token expires, **Then** operations MUST fail with authentication error (MVP: no automatic refresh).

---

### User Story 2 - Query Operations (Priority: P1)

As an AI model using the MCP server,
I want to execute GraphQL queries against the Alkemio API,
So that I can retrieve data about Spaces, Users, Organizations, and other platform entities.

**Why this priority**: Queries represent read operations essential for AI agents to understand platform state.

**Independent Test**: Can be verified by executing a query and receiving valid GraphQL response matching schema.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** I request a query operation, **Then** the system MUST forward the query to the Alkemio GraphQL endpoint.
2. **Given** a valid query syntax, **When** I execute it, **Then** I MUST receive results conforming to the schema.graphql specification.
3. **Given** an invalid query, **When** I execute it, **Then** I MUST receive a GraphQL error with descriptive message.

---

### User Story 3 - Mutation Operations (Priority: P1)

As an AI model using the MCP server,
I want to execute GraphQL mutations against the Alkemio API,
So that I can create, update, or delete platform entities.

**Why this priority**: Mutations enable write operations critical for AI agents to take action on behalf of users.

**Independent Test**: Can be verified by executing a mutation and observing the corresponding change in platform state.

**Acceptance Scenarios**:

1. **Given** an authenticated session with appropriate permissions, **When** I request a mutation operation, **Then** the system MUST forward the mutation to the Alkemio GraphQL endpoint.
2. **Given** a valid mutation with required inputs, **When** I execute it, **Then** I MUST receive confirmation matching the mutation return type.
3. **Given** insufficient permissions for a mutation, **Then** the system MUST return an authorization error.

---

### User Story 4 - MCP Protocol Compliance (Priority: P2)

As a Claude Desktop or MCP-compatible client,
I want to discover and use tools exposed by the Alkemio MCP server,
So that I can integrate Alkemio operations into AI workflows.

**Why this priority**: MCP protocol compliance ensures tools are discoverable and usable by MCP clients.

**Independent Test**: Can be verified by connecting a client and observing tool manifest matching exposed operations.

**Acceptance Scenarios**:

1. **Given** a running MCP server, **When** a client connects, **Then** the server MUST provide a manifest of available tools.
2. **Given** the tool manifest, **When** a client invokes a tool, **Then** the server MUST execute the corresponding GraphQL operation.

---

### Edge Cases

- What happens when the Alkemio API is unreachable? The system MUST provide clear connection error.
- What happens when GraphQL response contains errors? The system MUST surface errors to the caller.
- What happens with malformed authentication credentials? The system MUST reject with authentication failure.
- What happens during network interruptions? The system MUST handle reconnections gracefully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The server MUST authenticate via Ory Kratos using email/password non-interactive flow.
- **FR-002**: The server MUST expose GraphQL queries per schema.graphql Query type.
- **FR-003**: The server MUST expose GraphQL mutations per schema.graphql Mutation type.
- **FR-004**: The server MUST NOT expose GraphQL subscriptions (explicitly out of scope).
- **FR-005**: The server MUST implement MCP protocol for tool discovery and execution.
- **FR-006**: The server MUST validate all GraphQL operations against schema.graphql.
- **FR-007**: The server MUST use session tokens from Kratos authentication. Token refresh is not in scope for MVP.
- **FR-008**: The server MUST reject operations when authentication is invalid or expired.

### Key Entities

- **Kratos Authentication Session**: Represents the authenticated session obtained via Kratos login flow.
- **GraphQL Operation**: Represents a query or mutation operation conforming to schema.graphql.
- **MCP Tool**: Represents an exposed operation available to MCP clients.
- **Authentication Token**: Represents the OAuth/OIDC token obtained from Kratos authentication.

## Clarifications

### Session 2026-02-03

- Q: Token refresh strategy? → A: No automatic refresh for MVP (token expiration = session end)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can authenticate and execute queries within 30 seconds of server startup.
- **SC-002**: All Query operations from schema.graphql are accessible via MCP tools.
- **SC-003**: All Mutation operations from schema.graphql are accessible via MCP tools.
- **SC-004**: Authentication failures are clearly communicated with actionable error messages.
