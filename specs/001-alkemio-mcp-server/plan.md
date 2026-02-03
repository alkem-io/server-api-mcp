# Implementation Plan: 001-alkemio-mcp-server

**Branch**: `001-alkemio-mcp-server` | **Date**: 2026-02-03 | **Spec**: [link](../spec.md)
**Input**: Feature specification from `/specs/001-alkemio-mcp-server/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create an MCP server that exposes Alkemio's GraphQL API as discoverable MCP tools. The server authenticates via Ory Kratos email/password non-interactive flow and exposes queries and mutations per schema.graphql. Architecture uses Node.js runtime with mcp-framework for protocol handling, @alkemio/client-lib for authentication, and graphql-request for GraphQL operations.

## Technical Context

**Language/Version**: Node.js + TypeScript (existing codebase uses node_modules)
**Primary Dependencies**: mcp-framework, @alkemio/client-lib, graphql-request
**Storage**: N/A (stateless MCP server)
**Testing**: vitest (per constitution, TBD implementation)
**Target Platform**: Linux server (HTTP transport)
**Project Type**: MCP server (single project)
**Performance Goals**: Startup authentication within 30s, query latency <5s
**Constraints**: Node.js required (mcp-framework not Bun-compatible)
**Scale/Scope**: Single server instance, all queries/mutations per schema.graphql

### Technical Decisions (from research.md)

| Decision | Rationale |
|----------|-----------|
| Node.js runtime | mcp-framework uses Node.js stdio/streams; custom transport too costly |
| graphql-request | Eden is REST-only; graphql-request is fetch-based, works with Bun |
| @alkemio/client-lib singleton | Provides Kratos auth flow + GraphQL client wrapper |

## Constitution Check (Post-Design Evaluation)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitution Principle | Status | Notes |
|------------------------|--------|-------|
| Security-First | PASS | Credentials via env vars; GraphQL input validation via Zod schemas |
| Spec-Driven Development | PASS | Feature spec, data model, contracts in place |
| Authentication Integration | PASS | Direct Kratos HTTP for full control over auth flow |
| Test-First Development | **DEFER** | Test setup TBD - constitution requires >90% coverage |
| Fast Feedback Loops | PASS | mcp-framework mandated; Node.js runtime confirmed |

### Violations Requiring Justification (Post-Design)

No active violations. Constitutional amendments from v1.0.0 to v2.0.0 removed stack-specific tooling mandates (bun/elysia/eden/biome) and now mandate mcp-framework directly.

## Project Structure

### Documentation (this feature)

```text
specs/001-alkemio-mcp-server/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── index.ts             # Server entry point, initializes auth then starts MCP server
├── services/
│   └── AlkemioService.ts # Singleton service wrapping @alkemio/client-lib
├── tools/
│   └── *.ts             # MCP tools extending MCPTool class (auto-discovered)
└── resources/
    └── *.ts             # MCP resources extending MCPResource class

tests/
├── unit/
└── integration/
```

**Structure Decision**: Existing codebase matches the src/ structure documented above. Tools are auto-discovered via pattern matching in the tools/ directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| npm instead of bun | mcp-framework Node.js-only | Bun migration requires transport rewrite (~1000 LOC) |