# Tasks: Alkemio MCP Server

**Input**: Design documents from `/specs/001-alkemio-mcp-server/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL for this MVP phase - the constitution requires >90% coverage but test setup is deferred per plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Status Key

- **[x]**: Task complete
- **[ ]**: Task not started
- **✅**: Phase/story complete
- **⏳**: Phase/story in progress

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow the existing project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan (src/, src/tools/, src/services/, src/resources/)
- [x] T002 Initialize Node.js project with TypeScript, mcp-framework, graphql-request dependencies
- [x] T003 [P] Configure TypeScript (tsconfig.json)
- [x] T004 [P] Create .env.example with required environment variables

**Status**: Complete - project structure exists

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement Kratos HTTP authentication service in src/services/KratosAuth.ts
  - Direct HTTP calls to Kratos /self-service/login API
  - Extract session token from response
  - Provide Bearer token for GraphQL calls
- [x] T006 [P] Create singleton pattern for authentication service access
- [x] T007 Configure MCP server entry point in src/index.ts with authentication initialization
- [x] T008 [P] Setup error handling infrastructure for authentication failures
- [x] T009 [P] Configure environment variable loading with dotenv

**Status**: Complete - authentication via @alkemio/client-lib implemented (note: plan.md indicates migration to direct Kratos HTTP is in progress per research.md Decision 3)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Server Authentication (Priority: P1) 🎯 MVP

**Goal**: Authenticate against Alkemio platform using Kratos credentials at server startup

**Independent Test**: Verify by starting server with valid/invalid credentials and observing authentication success/failure

### Implementation for User Story 1

- [x] T010 [US1] Implement AlkemioService.initialize() method in src/services/AlkemioService.ts
  - Connect to Alkemio platform using credentials
  - Handle authentication success/failure
- [x] T011 [US1] Add authentication validation on server startup in src/index.ts
  - Reject startup with clear error on auth failure (FR-008)
- [x] T012 [US1] Implement isReady() check for authentication state
- [x] T013 [US1] Add getApiToken() method to provide Bearer token for GraphQL operations
- [x] T014 [US1] Implement testSpaceAccess() for connectivity health check

**Status**: Complete - AlkemioService provides authentication

**Checkpoint**: User Story 1 complete - server can authenticate with Alkemio platform

---

## Phase 4: User Story 2 - Query Operations (Priority: P1) 🎯 MVP

**Goal**: Execute GraphQL queries against the Alkemio API to retrieve platform data

**Independent Test**: Execute any query tool and verify valid GraphQL response matching schema

### Implementation for User Story 2

- [x] T015 [P] [US2] Create ListSpacesTool in src/tools/ListSpacesTool.ts
  - Query: `spaces` - List all accessible spaces
  - Input schema: `{}` (no input required)
  - Uses authenticated GraphQL client
- [ ] T016 [P] [US2] Create GetSpaceTool in src/tools/GetSpaceTool.ts
  - Query: `space(ID: UUID!)` - Get specific space by ID
  - Input schema: `{ ID: string }` (required)
- [ ] T017 [P] [US2] Create ListAccountsTool in src/tools/ListAccountsTool.ts
  - Query: `accounts` - List all accounts
  - Input schema: `{}`
- [ ] T018 [P] [US2] Create GetCurrentUserTool in src/tools/GetCurrentUserTool.ts
  - Query: `me` - Get current authenticated user info
  - Input schema: `{}`
- [ ] T019 [P] [US2] Create ListOrganizationsTool in src/tools/ListOrganizationsTool.ts
  - Query: `organizations` - List organizations
  - Input schema: `{ filter?, limit?, random? }`
- [ ] T020 [P] [US2] Create GetOrganizationTool in src/tools/GetOrganizationTool.ts
  - Query: `organization(ID: UUID!)` - Get specific organization
  - Input schema: `{ ID: string }`
- [ ] T021 [P] [US2] Create ListUsersTool in src/tools/ListUsersTool.ts
  - Query: `users` - List users
  - Input schema: `{ filter?, limit?, ids? }`
- [ ] T022 [P] [US2] Create GetUserTool in src/tools/GetUserTool.ts
  - Query: `user(ID: UUID!)` - Get specific user
  - Input schema: `{ ID: string }`
- [ ] T023 [P] [US2] Create ActivityFeedTool in src/tools/ActivityFeedTool.ts
  - Query: `activityFeed` - Get user activity feed
  - Input schema: `{ after?, args?, before?, first?, last? }`
- [ ] T024 [P] [US2] Create ExploreSpacesTool in src/tools/ExploreSpacesTool.ts
  - Query: `exploreSpaces` - Explore spaces
  - Input schema: `{ options?: ExploreSpacesInput }`
- [ ] T025 [P] [US2] Create LookupEntitiesTool in src/tools/LookupEntitiesTool.ts
  - Query: `lookup` - Lookup entities
  - Input schema: `{}`
- [ ] T026 [US2] Add GraphQL error handling for query operations
  - Handle GRAPHQL_ERROR, VALIDATION_ERROR, NETWORK_ERROR per contracts

**Checkpoint**: User Story 2 complete - all query operations accessible

---

## Phase 5: User Story 3 - Mutation Operations (Priority: P1) 🎯 MVP

**Goal**: Execute GraphQL mutations against the Alkemio API to create/update/delete entities

**Independent Test**: Execute a mutation and verify corresponding change in platform state

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create CreateSpaceTool in src/tools/CreateSpaceTool.ts
  - Mutation: `createSpace` - Create a new space
  - Input schema per contracts/mcp-tool-interface.yaml
- [ ] T028 [P] [US3] Create UpdateSpaceTool in src/tools/UpdateSpaceTool.ts
  - Mutation: `updateSpace` - Update an existing space
  - Input schema: `{ ID: UUID!, profileData?, contextData?, updateData }`
- [ ] T029 [P] [US3] Create DeleteSpaceTool in src/tools/DeleteSpaceTool.ts
  - Mutation: `deleteSpace` - Delete a space
  - Input schema: `{ ID: UUID! }`
- [ ] T030 [P] [US3] Create CreatePostTool in src/tools/CreatePostTool.ts
  - Mutation: `createPost` - Create a new post
  - Input schema: `{ profileData?, postData }`
- [ ] T031 [P] [US3] Create UpdatePostTool in src/tools/UpdatePostTool.ts
  - Mutation: `updatePost` - Update an existing post
  - Input schema: `{ ID: UUID!, postData?, profileData? }`
- [ ] T032 [P] [US3] Create DeletePostTool in src/tools/DeletePostTool.ts
  - Mutation: `deletePost` - Delete a post
  - Input schema: `{ ID: UUID! }`
- [ ] T033 [P] [US3] Create CreateWhiteboardTool in src/tools/CreateWhiteboardTool.ts
  - Mutation: `createWhiteboard` - Create a new whiteboard
  - Input schema: `{ profileData?, contentData?, whiteboardData }`
- [ ] T034 [P] [US3] Create UpdateWhiteboardTool in src/tools/UpdateWhiteboardTool.ts
  - Mutation: `updateWhiteboard` - Update a whiteboard
  - Input schema: `{ ID: UUID!, contentData?, profileData? }`
- [ ] T035 [P] [US3] Create DeleteWhiteboardTool in src/tools/DeleteWhiteboardTool.ts
  - Mutation: `deleteWhiteboard` - Delete a whiteboard
  - Input schema: `{ ID: UUID! }`
- [ ] T036 [US3] Add authorization error handling for mutations
  - Handle insufficient permissions per contracts

**Checkpoint**: User Story 3 complete - all mutation operations accessible

---

## Phase 6: User Story 4 - MCP Protocol Compliance (Priority: P2)

**Goal**: Ensure tools are discoverable and usable by MCP clients

**Independent Test**: Connect MCP client and verify tool manifest matches exposed operations

### Implementation for User Story 4

- [x] T037 [US4] Configure MCP server transport (HTTP streaming) in src/index.ts
- [x] T038 [US4] Ensure all tools extend MCPTool base class with proper exports
- [x] T039 [P] [US4] Verify tool auto-discovery via mcp-framework (tools/ directory pattern)
- [ ] T040 [US4] Validate tool manifest generation for all query/mutation tools
- [ ] T041 [US4] Test client connection and tool invocation workflow

**Checkpoint**: User Story 4 complete - MCP clients can discover and use Alkemio tools

---

## Phase 7: Admin Mutations (Extended Scope)

**Purpose**: Admin-level mutation operations for platform management

- [ ] T042 [P] Create AddIframeUrlTool in src/tools/AddIframeUrlTool.ts
- [ ] T043 [P] Create AdminDeleteUserAccountTool in src/tools/AdminDeleteUserAccountTool.ts
- [ ] T044 [P] Create AdminBackfillAuthIdsTool in src/tools/AdminBackfillAuthIdsTool.ts
- [ ] T045 [P] Create AdminEnsureCommunicationsAccessTool in src/tools/AdminEnsureCommunicationsAccessTool.ts
- [ ] T046 [P] Create AdminDeleteKratosIdentityTool in src/tools/AdminDeleteKratosIdentityTool.ts
- [ ] T047 [P] Create AdminPruneNotificationsTool in src/tools/AdminPruneNotificationsTool.ts
- [ ] T048 [P] Create AdminUpdateContributorAvatarsTool in src/tools/AdminUpdateContributorAvatarsTool.ts
- [ ] T049 [P] Create AdminUpdateGeoLocationTool in src/tools/AdminUpdateGeoLocationTool.ts
- [ ] T050 [P] Create AddNotificationEmailBlacklistTool in src/tools/AddNotificationEmailBlacklistTool.ts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T051 [P] Remove ExampleTool.ts (placeholder file)
- [ ] T052 [P] Documentation updates in README.md for all implemented tools
- [ ] T053 Code cleanup and refactoring across all tools
- [ ] T054 [P] Run quickstart.md validation workflow
- [ ] T055 Security hardening - validate all GraphQL inputs via Zod schemas

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately ✅ COMPLETE
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories ✅ COMPLETE
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Admin Mutations (Phase 7)**: Can proceed after US3 patterns established
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Authentication - ✅ COMPLETE - Foundation for all other stories
- **User Story 2 (P1)**: Query Operations - Can proceed now (depends on US1)
- **User Story 3 (P1)**: Mutation Operations - Can proceed now (depends on US1)
- **User Story 4 (P2)**: MCP Compliance - Partially complete, depends on US2/US3 for full validation

### Within Each User Story

- Models/entities before services
- Services before tools
- Core implementation before integration
- Story complete (all tasks checked and independently tested) before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All query tools marked [P] can run in parallel
- All mutation tools marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational
3. ✅ Complete Phase 3: User Story 1 (Authentication)
4. ⏳ Complete Phase 4: User Story 2 (Queries) - 1/12 tools complete
5. ⏳ Complete Phase 5: User Story 3 (Mutations) - 0/9 tools complete
6. Deploy/demo if ready

### Incremental Delivery

1. ✅ Setup + Foundational → Foundation ready
2. ⏳ Add User Story 2 → Query tools → Test independently
3. ⏳ Add User Story 3 → Mutation tools → Test independently
4. Add User Story 4 validation → Test MCP protocol compliance
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Constitution defers test setup - focus on tool implementation for MVP
