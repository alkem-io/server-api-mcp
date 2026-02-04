# Tasks: Deployable MCP Server Package

**Feature**: Deployable MCP Server Package
**Spec**: [spec.md](spec.md)
**Created**: 2026-02-04
**Feature Branch**: `002-deploy-mcp-package`

## Implementation Strategy

**MVP Scope**: User Story 1 (Docker Container) - enables immediate Kubernetes deployment
**Incremental Delivery**: Docker first, then NPM package, then Traefik integration

## Dependencies Graph

```
T001-T004 (Setup: Test Framework)
        ↓
T005-T007 (Foundational: KratosAuth Migration)
        ↓
┌─────────────────────────────────────────┐
│ US1 (Docker): T008-T012                 │
│ US4 (Traefik): T016-T017                │
│ US2 (NPM): T013-T015                   │
└─────────────────────────────────────────┘
        ↓
US3 (Multi-Client): T018-T022
        ↓
Polish: T023-T027
```

## Parallel Execution

- **US1 (Docker)**: Dockerfile creation (T008) and k8s manifests (T009) can run in parallel with T005-T007 if KratosAuth is already working
- **US2 (NPM)**: package.json updates (T013) and .npmignore creation (T014) can run in parallel
- **US4 (Traefik)**: k8s/ingress.yaml can be created in parallel with US1 Docker work
- **Polish**: T023-T027 are independent and can be run in parallel

---

## Phase 1: Setup - Test Framework Configuration

**Goal**: Establish Jest test framework with type definitions per Constitution IV

**Independent Test Criteria**: Tests run successfully with `npm test`, Jest configuration works with TypeScript

### Tasks

- [x] T001 Create Jest configuration file at `/root/source/alkemio/server-api-mcp/jest.config.js`
- [x] T002 Add TypeScript Jest types at `/root/source/alkemio/server-api-mcp/package.json` (devDependencies)
- [x] T003 Create test utilities at `/root/source/alkemio/server-api-mcp/tests/test-utils.ts`
- [x] T004 Create initial smoke test at `/root/source/alkemio/server-api-mcp/tests/smoke.test.ts`

---

## Phase 2: Foundational - KratosAuth Migration

**⚠️ BLOCKER**: This phase MUST complete before any Docker/K8s work. The current @alkemio/client-lib usage violates Constitution III.

**Goal**: Migrate from @alkemio/client-lib to direct Kratos HTTP per Constitution III

**Independent Test Criteria**: Auth service unit tests pass, Kratos HTTP flow works against test instance

### Tasks

- [x] T005 Create KratosAuth service at `/root/source/alkemio/server-api-mcp/src/services/KratosAuth.ts`
- [x] T006 Update index.ts at `/root/source/alkemio/server-api-mcp/src/index.ts` to use KratosAuth
- [x] T007 Add auth integration test at `/root/source/alkemio/server-api-mcp/tests/kratos-auth.test.ts`

---

## Phase 3: User Story 1 - MCP Server Deployment via Docker Container

**Goal**: Create Docker container image with multi-stage build for Kubernetes deployment

**Independent Test Criteria**: Docker image builds successfully, container runs and exposes MCP endpoint on port 1339

**Story Label**: [US1]

### Implementation Tasks

- [x] T008 Create Dockerfile at `/root/source/alkemio/server-api-mcp/Dockerfile`
- [x] T009 Create k8s directory structure at `/root/source/alkemio/server-api-mcp/k8s/`
- [x] T010 Create k8s/deployment.yaml at `/root/source/alkemio/server-api-mcp/k8s/deployment.yaml`
- [x] T011 Create k8s/service.yaml at `/root/source/alkemio/server-api-mcp/k8s/service.yaml`
- [x] T012 Create k8s/secret.yaml at `/root/source/alkemio/server-api-mcp/k8s/secret.yaml`
- [x] T012a Create K8s secrets documentation at `/root/source/alkemio/server-api-mcp/docs/k8s-secrets.md`

---

## Phase 4: User Story 2 - MCP Server Deployment via NPM Package

**Goal**: Configure package.json for NPM distribution with bin entry point

**Independent Test Criteria**: Package publishes successfully to npm registry, bin command works globally

**Story Label**: [US2]

### Implementation Tasks

- [x] T013 [P] Update package.json bin field at `/root/source/alkemio/server-api-mcp/package.json`
- [x] T014 [P] Create .npmignore at `/root/source/alkemio/server-api-mcp/.npmignore`
- [x] T015 [P] Create docker-compose.yml at `/root/source/alkemio/server-api-mcp/docker-compose.yml`

---

## Phase 5: User Story 4 - Traefik Reverse-Proxy Integration

**Goal**: Configure Kubernetes Ingress with Traefik annotations for external access

**Independent Test Criteria**: Ingress creates in K8s cluster, Traefik registers the service, HTTPS endpoint responds

**Story Label**: [US4]

### Implementation Tasks

- [x] T016 [P] Create k8s/ingress.yaml at `/root/source/alkemio/server-api-mcp/k8s/ingress.yaml`
- [x] T017 [P] Create k8s/middleware.yaml at `/root/source/alkemio/server-api-mcp/k8s/middleware.yaml`

---

## Phase 6: User Story 3 - Multi-Client MCP Integration

**Goal**: Document and verify MCP client configurations for LibreChat, Claude Code, and GitHub Copilot

**Independent Test Criteria**: Each client can discover MCP tools and execute them successfully

**Story Label**: [US3]

### Implementation Tasks

- [x] T018 [P] Create client configuration docs at `/root/source/alkemio/server-api-mcp/docs/claude-code-config.md`
- [x] T019 [P] Create LibreChat config docs at `/root/source/alkemio/server-api-mcp/docs/librechat-config.md`
- [x] T020 [P] Create GitHub Copilot config docs at `/root/source/alkemio/server-api-mcp/docs/github-copilot-config.md`
- [x] T021 [P] Create MCP client connection test at `/root/source/alkemio/server-api-mcp/tests/mcp-client.test.ts`
  **Description**: Write integration test verifying Claude Code, LibreChat, and GitHub Copilot can connect to MCP server and discover tools. Use `mcp-client` library or raw HTTP to simulate client connections.
  **Acceptance**: Test passes for all three clients, verifies tool discovery response
- [x] T022 [P] Add integration test for all tools at `/root/source/alkemio/server-api-mcp/tests/tools-integration.test.ts`
  **Description**: Execute each MCP tool via client SDK and verify successful response
  **Acceptance**: All 25+ tools have at least one integration test

---

## Phase 7: Polish - Cross-Cutting Concerns

**Goal**: Complete observability, documentation, and cleanup for production deployment

**Independent Test Criteria**: All documentation complete, tests pass, ready for production deployment

### Implementation Tasks

- [x] T023 Create logging configuration at `/root/source/alkemio/server-api-mcp/src/utils/logger.ts`
- [x] T023a Create OpenTelemetry configuration at `/root/source/alkemio/server-api-mcp/src/utils/otel.ts`
  **Description**: Initialize OpenTelemetry with Jaeger/LightStep exporter. Configure trace propagation for MCP tool calls.
  **Acceptance**: Spans created for each GraphQL operation, exported to configured collector
- [x] T023b Add tracing to GraphQL client at `/root/source/alkemio/server-api-mcp/src/services/AlkemioService.ts`
- [x] T024 Create metrics endpoint at `/root/source/alkemio/server-api-mcp/src/metrics.ts`
- [x] T025 Update README.md at `/root/source/alkemio/server-api-mcp/README.md` with deployment instructions
- [x] T026 Create health check endpoint at `/root/source/alkemio/server-api-mcp/src/health.ts`
  **Description**: Implement `/health` endpoint returning JSON with status: "ok", version, uptime. Configure K8s liveness/readiness probes to hit this endpoint.
  **Acceptance**: Returns 200 with JSON body; K8s probes configured to use it
- [x] T027 Update .env.example at `/root/source/alkemio/server-api-mcp/.env.example` with all required env vars

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 27 |
| Completed Tasks | 27 (100%) |
| Test Framework Tasks | 4 (T001-T004) - COMPLETE |
| Foundational Tasks | 3 (T005-T007) - COMPLETE |
| US1 (Docker) Tasks | 5 (T008-T012) - COMPLETE |
| US2 (NPM) Tasks | 3 (T013-T015) - COMPLETE |
| US4 (Traefik) Tasks | 2 (T016-T017) - COMPLETE |
| US3 (Multi-Client) Tasks | 5 (T018-T022) - COMPLETE |
| Polish Tasks | 5 (T023-T027) - COMPLETE | |

**Parallel Execution Opportunities**:
- Docker (T008-T012) can run after foundational (T005-T007)
- NPM updates (T013-T015) can run in parallel with Docker
- Traefik ingress (T016-T017) can run in parallel with Docker
- Documentation tasks (T018-T020) can run in parallel with any phase
- Polish phase (T023-T027) can run after all user stories complete

**Suggested MVP Scope**:
- Docker container (US1) with health check
- K8s manifests (k8s/*.yaml)
- Traefik ingress (US4)