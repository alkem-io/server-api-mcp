<!--
================================================================================
SYNC IMPACT REPORT - Constitution v2.0.1
================================================================================
Version change: 2.0.0 -> 2.0.1 (PATCH)
Changes:
  - Removed "token lifecycle management" and "token refresh" mandates from Principle III
  - Removed "Token refresh logic MUST handle expiration gracefully" from Security Requirements
  - Aligned constitution with MVP scope (no automatic refresh for token expiration)
Templates requiring updates: None (constitution check already passes)
Follow-up TODOs: None
================================================================================
-->

# Alkemio MCP Server Constitution

## Core Principles

### I. Security-First

All system interactions MUST prioritize security. All credentials MUST be stored in environment variables with no exceptions. The system MUST implement optimized token consumption to minimize authentication overhead. All GraphQL operations MUST validate inputs before execution. Rationale: MCP servers expose programmatic access; security lapses expose entire platform.

### II. Spec-Driven Development

All features MUST begin with a formal specification before implementation. The system MUST support both queries and mutations per the Alkemio GraphQL schema. Subscriptions MUST be excluded from scope - only read/write operations are permitted. Rationale: Spec-driven development ensures AI agents can reliably implement and validate features against defined contracts.

### III. Authentication Integration

The server MUST authenticate via Ory Kratos using HTTP API calls directly (no client library wrapper). All authentication MUST use the Kratos non-interactive email/password flow. Tokens MUST be obtained via direct Kratos HTTP endpoints. Rationale: Direct HTTP access provides full control over authentication flow and reduces dependency surface area.

### IV. Testing Excellence

The codebase MUST maintain greater than 90% unit test coverage. All critical paths MUST have dedicated test coverage. Tests MUST validate authentication flows, token management, and GraphQL operations. Rationale: High coverage enables AI agents to validate changes with confidence in a 100% AI-centric development process.

### V. Fast Feedback Loops

Development tooling MUST prioritize fastest feedback loops possible. The system MUST use the mcp-framework package for MCP protocol handling. Tests MUST run in under 30 seconds for the full suite. The system MUST NOT require heavy observability or performance optimization for this iteration. Rationale: AI-native development requires rapid iteration; tooling configuration directly impacts development velocity.

## Additional Constraints

### MCP Framework Requirement

The system MUST use the `mcp-framework` package for Model Context Protocol implementation. All MCP tools MUST extend the `MCPTool` base class. All MCP resources MUST extend the `MCPResource` base class. Tool discovery MUST follow the auto-discovery pattern in the tools/ directory.

### Security Requirements

Credentials MUST never be committed to version control. All environment variables MUST be documented in `.env.example` with placeholder values. The server MUST validate all GraphQL inputs against the Alkemio schema.

### Scope Boundaries

Mutations and queries MUST be implemented per the provided Alkemio schema. Subscriptions are explicitly out of scope for this project iteration. Performance optimization and observability are explicitly deferred to future constitution amendments.

## Development Workflow

### Test-First Development

All code changes MUST be accompanied by corresponding tests before implementation. Tests MUST fail before implementation begins. The Red-Green-Refactor cycle MUST be followed strictly. All tests MUST achieve pass status before merging.

### Code Review Standards

All changes MUST verify constitution compliance before merging. Complexity additions MUST be justified in documentation. No temporary workarounds or "just this once" exceptions are permitted.

## Governance

This constitution supersedes all other development practices. Amendments MUST be documented with version increment rationale. All constitution changes MUST update the version string according to semantic versioning rules:
- MAJOR: Backward incompatible changes to principles or governance
- MINOR: New principles added or materially expanded guidance
- PATCH: Clarifications, wording fixes, non-semantic refinements

Compliance with this constitution MUST be verified during all code reviews.

**Version**: 2.0.1 | **Ratified**: 2026-02-03 | **Last Amended**: 2026-02-03