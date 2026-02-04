# Implementation Plan: Deployable MCP Server Package

**Branch**: `002-deploy-mcp-package` | **Date**: 2026-02-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-deploy-mcp-package/spec.md`

## Summary

Create a deployable MCP server package for the Alkemio infrastructure, supporting both Docker container and NPM package distribution. The server exposes Alkemio GraphQL API as MCP tools via the mcp-framework, authenticating via Ory Kratos. Target deployment is a self-hosted Kubernetes cluster with Traefik reverse-proxy, serving Claude Code, LibreChat, and GitHub Copilot clients.

## Technical Context

**Language/Version**: Node.js 22.x (>=18.19.0 required) | TypeScript 5.3
**Primary Dependencies**: mcp-framework 0.2.13, graphql-request 6.1, @alkemio/client-lib 0.35, dotenv 16.5
**Storage**: N/A (stateless MCP server - no persistent storage required)
**Testing**: No test framework yet - needs to be established
**Target Platform**: Linux containers (Docker/Kubernetes)
**Project Type**: Single-node CLI tool with MCP server capabilities
**Performance Goals**: Startup <15s, auth <5s, 99% uptime with K8s replicas
**Constraints**: All credentials in env vars, Kratos non-interactive auth only
**Scale/Scope**: Single server instance with horizontal scaling via K8s

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Security-First | Credentials in env vars | ✅ PASS | Already follows - uses dotenv, .env.example documented |
| I. Security-First | Input validation | ✅ PASS | mcp-framework handles MCP protocol validation |
| II. Spec-Driven Development | GraphQL schema available | ✅ PASS | schema.graphql and graphql_schema.json exist |
| II. Spec-Driven Development | No subscriptions | ✅ PASS | Out of scope per spec |
| III. Authentication | Direct Kratos HTTP | ⚠️ CHECK | Current impl uses @alkemio/client-lib - needs migration |
| IV. Testing Excellence | >90% coverage | ❌ FAIL | No tests exist yet |
| IV. Testing Excellence | Auth flows tested | ❌ FAIL | No test infrastructure |
| V. Fast Feedback Loops | mcp-framework usage | ✅ PASS | Using mcp-framework for MCP handling |
| V. Fast Feedback Loops | Tests <30s | ❌ UNKNOWN | Test framework not yet configured |

**Gate Decision**: ⚠️ PROCEED WITH CONDITIONS
- Must add Jest/Vitest before implementation
- Must migrate from @alkemio/client-lib to direct Kratos HTTP
- Must create test suite for auth flows and GraphQL operations

## Project Structure

### Documentation (this feature)

```text
specs/002-deploy-mcp-package/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
.
├── src/
│   ├── index.ts            # Server entry point (MCPServer init)
│   ├── services/
│   │   └── AlkemioService.ts  # Authentication + GraphQL client
│   ├── tools/                  # MCP tool implementations (25+ tools)
│   │   └── *.ts
│   └── resources/
│       └── ExampleResource.ts
├── package.json           # NPM package configuration
├── schema.graphql         # Alkemio GraphQL schema
├── .env.example           # Environment documentation
├── Dockerfile             # For container deployment
├── docker-compose.yml     # Optional: local testing
└── k8s/                   # Kubernetes manifests (to be created)
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml
```

**Structure Decision**: Single-node TypeScript project. MCP server entry point at `src/index.ts`, tools auto-discovered by mcp-build. Docker and Kubernetes deployment configs to be created in deployment feature.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| @alkemio/client-lib usage | Kratos auth via client-lib | Direct HTTP needed per Constitution III |

---

## Constitution Check Re-evaluation (Post-Phase 1)

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| I. Security-First | Credentials in env vars | ✅ PASS | All credentials via env vars, K8s secrets |
| I. Security-First | Input validation | ✅ PASS | mcp-framework handles MCP protocol validation |
| II. Spec-Driven Development | GraphQL schema available | ✅ PASS | schema.graphql and contracts/ defined |
| II. Spec-Driven Development | No subscriptions | ✅ PASS | Out of scope per spec |
| III. Authentication | Direct Kratos HTTP | ⚠️ MIGRATION REQ | Need to migrate from client-lib to direct HTTP |
| IV. Testing Excellence | >90% coverage | ❌ FAIL | Test framework not yet configured |
| IV. Testing Excellence | Auth flows tested | ❌ FAIL | Will be added with Jest setup |
| V. Fast Feedback Loops | mcp-framework usage | ✅ PASS | mcp-framework confirmed in use |
| V. Fast Feedback Loops | Tests <30s | ❌ UNKNOWN | Will verify after test setup |

**Post-Design Decision**: Authentication migration to direct Kratos HTTP is deferred to implementation phase 2.
