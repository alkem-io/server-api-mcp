# Feature Specification: Deployable MCP Server Package

**Feature Branch**: `002-deploy-mcp-package`
**Created**: 2026-02-04
**Status**: Draft
**Input**: User description: "create a deployable package of the mcp server in the alkemio infrastructure. We use self-hosted kubernetes cluster with traefik as a reverse-proxy - so it can be done either by npm package or docker container, both with proper networking configuration. The MCP server will be consumed by librechat, claude code and github copilot - integrate it in a flexible way."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - MCP Server Deployment via Docker Container (Priority: P1)

As an infrastructure operator, I want to deploy the Alkemio MCP server as a Docker container in our Kubernetes cluster so that Claude Code, GitHub Copilot, and LibreChat can consume the MCP tools through a consistent endpoint.

**Why this priority**: Docker/Kubernetes is the standard deployment model for Alkemio infrastructure, enabling automatic scaling, health monitoring, and integration with existing Traefik reverse-proxy.

**Independent Test**: Can be fully tested by deploying the container to a K8s cluster and verifying MCP endpoints are accessible via Traefik Ingress.

**Acceptance Scenarios**:

1. **Given** a configured Kubernetes cluster with Traefik, **When** the MCP server container is deployed, **Then** the MCP server exposes its endpoints via Traefik-registered URLs
2. **Given** the MCP server is running, **When** a client (Claude Code) connects to the MCP endpoint, **Then** the client discovers available tools and can execute them successfully
3. **Given** Traefik is configured with proper labels/annotations, **When** requests arrive at the MCP endpoint, **Then** Traefik routes traffic to the MCP server with appropriate TLS termination

---

### User Story 2 - MCP Server Deployment via NPM Package (Priority: P2)

As a developer, I want to deploy the Alkemio MCP server as an npm package so that I can run it as a standalone service or embed it within existing Node.js applications.

**Why this priority**: NPM deployment provides flexibility for development environments, custom integrations, and scenarios where containerization is not practical.

**Independent Test**: Can be fully tested by installing the package via npm and verifying the MCP server starts and responds to MCP protocol messages.

**Acceptance Scenarios**:

1. **Given** the npm package is installed, **When** the MCP server is started, **Then** it listens on a configurable port and exposes MCP tools
2. **Given** environment variables are configured, **When** the server starts, **Then** it authenticates with Kratos and can execute GraphQL queries against Alkemio

---

### User Story 3 - Multi-Client MCP Integration (Priority: P1)

As a user, I want to connect LibreChat, Claude Code, and GitHub Copilot to the Alkemio MCP server so that I can access Alkemio GraphQL functionality from any of these AI platforms.

**Why this priority**: Flexible multi-client integration maximizes the value of the MCP server investment across different AI tools.

**Independent Test**: Can be fully tested by configuring each client to connect to the MCP endpoint and verifying tool discovery/execution works from each platform.

**Acceptance Scenarios**:

1. **Given** the MCP server is deployed, **When** LibreChat is configured with the MCP endpoint, **Then** LibreChat can call Alkemio tools through the MCP protocol
2. **Given** the MCP server is deployed, **When** Claude Code is configured with the MCP endpoint, **Then** Claude Code can call Alkemio tools through the MCP protocol
3. **Given** the MCP server is deployed, **When** GitHub Copilot is configured with the MCP endpoint, **Then** GitHub Copilot can call Alkemio tools through the MCP protocol

---

### User Story 4 - Traefik Reverse-Proxy Integration (Priority: P1)

As an infrastructure operator, I want the MCP server to integrate with Traefik so that the server is automatically discoverable and accessible via properly configured URLs.

**Why this priority**: Traefik is the standard reverse-proxy for the Alkemio infrastructure, providing automatic service discovery, TLS termination, and load balancing.

**Independent Test**: Can be fully tested by verifying Traefik dashboards show the MCP server as a registered service and that external clients can reach the MCP endpoints.

**Acceptance Scenarios**:

1. **Given** Traefik is configured with Kubernetes ingress, **When** the MCP server pod starts, **Then** Traefik automatically discovers the service and creates routing rules
2. **Given** the MCP server is registered with Traefik, **When** a client requests the MCP endpoint URL, **Then** the request is properly routed to the MCP server with TLS termination at Traefik

---

### Edge Cases

- What happens when the MCP server container crashes? K8s restart policies should recover automatically
- How does the system handle Traefik restarts? Connection pooling should handle brief outages
- What happens when Kratos authentication fails? Server should report auth errors clearly to clients
- What happens when Kratos token expires? The server requires restart to re-authenticate (automatic refresh deferred to future iteration per Constitution 2.0.1)
- How are environment secrets (passwords, API keys) managed securely? Use K8s secrets, not plaintext

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Docker container image containing the MCP server and all dependencies
- **FR-002**: System MUST provide an npm package that can be installed and run as a standalone service
- **FR-003**: The MCP server MUST expose HTTP endpoints compatible with MCP protocol over HTTP streaming transport
- **FR-004**: Traefik MUST be able to route traffic to the MCP server pod/container using standard K8s service annotations
- **FR-005**: The MCP server MUST authenticate with Kratos using direct HTTP API calls per Constitution III, using non-interactive email/password flow. Tokens obtained during server startup are used for all subsequent API calls.
- **FR-006**: Claude Code, LibreChat, and GitHub Copilot MUST be able to discover and execute MCP tools from the deployed server
- **FR-007**: The deployment MUST support configurable network ports, authentication credentials, and Alkemio API endpoints via environment variables
- **FR-008**: The server MUST report health status for K8s liveness/readiness probes
- **FR-009**: Container resource allocation is delegated to Kubernetes scheduler for optimal node placement

### Key Entities

- **MCP Server Container/Package**: The deployable unit containing the Node.js MCP server, Kratos authentication, and GraphQL client
- **Traefik Ingress Route**: Configuration for exposing MCP endpoints to external clients
- **Kubernetes Service**: K8s service definition for internal service discovery
- **Environment Configuration**: Environment variables for API endpoints, authentication credentials, and network settings

## Non-Functional Requirements *(optional)*

### Observability
- JSON-structured logging using Winston or Pino for machine-parseable logs
- OpenTelemetry integration for distributed tracing across MCP tool executions
- Prometheus-compatible `/metrics` endpoint for key metrics (request latency, auth success/failure, tool invocation counts)

### Testing Strategy
- Integration tests via kubectl port-forward for local verification
- Manual verification scripts for deployment smoke tests
- Documented curl commands for endpoint testing without full client configuration

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can deploy the MCP server to Kubernetes in under 10 minutes following documented procedures
- **SC-002**: All three clients (Claude Code, LibreChat, GitHub Copilot) successfully discover and execute MCP tools within 30 seconds of connection
- **SC-003**: The MCP server maintains 99% uptime when deployed in K8s with proper replica configuration
- **SC-004**: Server startup time is under 15 seconds from pod creation to ready state
- **SC-005**: Authentication with Kratos completes within 5 seconds of server startup

## Assumptions

- Kubernetes cluster with Traefik ingress controller is already configured
- Kratos authentication service is accessible from the MCP server deployment
- Alkemio GraphQL API endpoint is available and accessible
- Docker daemon is available for building container images
- NPM registry access is available for publishing the package
- TLS certificates are managed by Traefik/cert-manager for HTTPS endpoints

## Out of Scope

- Automated CI/CD pipeline setup for building and publishing artifacts (may be future work)
- Custom authentication mechanisms beyond Kratos email/password flow
- Multi-region deployment or geographic load balancing
- Detailed monitoring/alerting configuration (beyond basic health checks)

## Clarifications

### Session 2026-02-04
- Q: What observability stack should be implemented? → A: JSON-structured logging (Winston/Pino), OpenTelemetry for distributed tracing, Prometheus metrics endpoint
- Q: How should Kratos authentication sessions be managed? → A: Use long-lived Kratos session with automatic refresh on auth failures only
- Q: What container resource constraints should be defined? → A: No explicit resource limits initially, allow K8s scheduler to determine based on node capacity
- Q: How should Traefik integration be configured? → A: Rely on automatic Traefik discovery via Kubernetes provider annotations
- Q: What testing strategy should be used for deployment verification? → A: Integration tests via kubectl port-forward, manual verification scripts, documented curl commands