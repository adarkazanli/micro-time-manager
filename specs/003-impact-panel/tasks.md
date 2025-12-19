# Tasks: Schedule Impact Panel

**Input**: Design documents from `/specs/003-impact-panel/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included per Constitution IV (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: SvelteKit web application
- **Source**: `src/lib/` for components, stores, services, types
- **Tests**: `tests/unit/`, `tests/e2e/`
- **Routes**: `src/routes/`

---

## Phase 1: Setup (Types & Constants)

**Purpose**: Add new types and constants required by all user stories

- [x] T001 Add RiskLevel type to src/lib/types/index.ts
- [x] T002 Add ProjectedTask interface to src/lib/types/index.ts
- [x] T003 Add ImpactPanelState interface to src/lib/types/index.ts
- [x] T004 Verify WARNING_THRESHOLD_MS constant exists in src/lib/types/index.ts (reuse existing, do not duplicate)

---

## Phase 2: Foundational (Projection Service)

**Purpose**: Core projection calculation logic that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Write unit test for calculateProjectedStart in tests/unit/projection.test.ts
- [x] T006 Write unit test for calculateRiskLevel threshold boundaries in tests/unit/projection.test.ts
- [x] T007 Write unit test for createProjectedTasks in tests/unit/projection.test.ts
- [x] T008 Implement calculateProjectedStart function in src/lib/services/projection.ts
- [x] T009 Implement calculateRiskLevel function in src/lib/services/projection.ts
- [x] T010 Implement createProjectedTasks function in src/lib/services/projection.ts
- [x] T011 Add JSDoc documentation to all projection service functions in src/lib/services/projection.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Real-Time Schedule Impact (Priority: P1)

**Goal**: Display a visual panel showing all tasks with status indicators (completed=grayed, current=highlighted, pending=normal)

**Independent Test**: Start a day with multiple tasks, verify panel displays all tasks with correct styling

### Tests for User Story 1

- [x] T012 [P] [US1] Write unit test for ImpactTaskRow display status styling in tests/unit/ImpactTaskRow.test.ts (describe block: "display status styling")
- [ ] T013 [P] [US1] Write e2e test for impact panel visibility during tracking in tests/e2e/impact-panel.test.ts

### Implementation for User Story 1

- [x] T014 [P] [US1] Create ImpactTaskRow component skeleton in src/lib/components/ImpactTaskRow.svelte
- [x] T015 [US1] Implement ImpactTaskRow props interface (task: ProjectedTask) in src/lib/components/ImpactTaskRow.svelte
- [x] T016 [US1] Implement completed task styling (gray) in src/lib/components/ImpactTaskRow.svelte
- [x] T017 [US1] Implement current task highlighting in src/lib/components/ImpactTaskRow.svelte
- [x] T018 [US1] Implement pending task default styling in src/lib/components/ImpactTaskRow.svelte
- [x] T019 [US1] Implement scheduled time display in src/lib/components/ImpactTaskRow.svelte (FR-015: show scheduled start times)
- [x] T020 [P] [US1] Create ImpactPanel component skeleton in src/lib/components/ImpactPanel.svelte
- [x] T021 [US1] Implement ImpactPanel props interface in src/lib/components/ImpactPanel.svelte
- [x] T022 [US1] Implement derived state for projectedTasks using $derived.by in src/lib/components/ImpactPanel.svelte
- [x] T023 [US1] Render list of ImpactTaskRow components in src/lib/components/ImpactPanel.svelte
- [x] T024 [US1] Update +page.svelte with side-by-side layout (timer left, panel right) in src/routes/+page.svelte
- [x] T025 [US1] Import and render ImpactPanel in tracking view in src/routes/+page.svelte
- [x] T026 [US1] Add panel header with task count display in src/lib/components/ImpactPanel.svelte

**Checkpoint**: Panel displays all tasks with correct status styling - US1 complete

---

## Phase 4: User Story 2 - Fixed Task Risk Indicators (Priority: P1)

**Goal**: Show green/yellow/red risk indicators on fixed tasks based on projected timing

**Independent Test**: Setup schedule with fixed tasks, run overtime, verify indicators change color appropriately

### Tests for User Story 2

- [x] T027 [P] [US2] Write unit test for risk indicator color determination in tests/unit/ImpactTaskRow.test.ts (describe block: "risk indicators" - separate from T012's block)
- [ ] T028 [P] [US2] Write e2e test for risk indicator color changes on overtime in tests/e2e/impact-panel.test.ts

### Implementation for User Story 2

- [x] T029 [US2] Implement risk indicator component for fixed tasks in src/lib/components/ImpactTaskRow.svelte
- [x] T030 [US2] Add green indicator styling (buffer > 5 min) in src/lib/components/ImpactTaskRow.svelte
- [x] T031 [US2] Add yellow indicator styling (0 < buffer <= 5 min) in src/lib/components/ImpactTaskRow.svelte
- [x] T032 [US2] Add red indicator styling (buffer <= 0) in src/lib/components/ImpactTaskRow.svelte
- [x] T033 [US2] Connect timerStore.elapsedMs to projection recalculation in src/lib/components/ImpactPanel.svelte
- [x] T034 [US2] Verify real-time indicator updates (within 1 second per SC-003) in src/lib/components/ImpactPanel.svelte
- [x] T035 [US2] Add buffer time tooltip or display on fixed task indicators in src/lib/components/ImpactTaskRow.svelte

**Checkpoint**: Fixed tasks show appropriate risk colors that update in real-time - US2 complete

---

## Phase 5: User Story 3 - Reorder Tasks to Resolve Conflicts (Priority: P2)

**Goal**: Allow drag-and-drop reordering of flexible tasks to resolve schedule conflicts

**Independent Test**: Create schedule conflict (red indicator), drag flexible task past fixed task, verify indicator turns green

### Tests for User Story 3

- [x] T036 [P] [US3] Write unit test for reorderTasks validation (prevents fixed/completed/current moves) in tests/unit/sessionStore.test.ts
- [ ] T037 [P] [US3] Write e2e test for drag-drop reorder success in tests/e2e/impact-panel.test.ts
- [ ] T038 [P] [US3] Write e2e test for fixed task drag prevention in tests/e2e/impact-panel.test.ts

### Implementation for User Story 3

- [x] T039 [US3] Add reorderTasks action to sessionStore in src/lib/stores/sessionStore.svelte.ts
- [x] T040 [US3] Implement validation: cannot move fixed tasks in src/lib/stores/sessionStore.svelte.ts
- [x] T041 [US3] Implement validation: cannot move completed tasks in src/lib/stores/sessionStore.svelte.ts
- [x] T042 [US3] Implement validation: cannot move current task in src/lib/stores/sessionStore.svelte.ts
- [x] T043 [US3] Update sortOrder fields after reorder in src/lib/stores/sessionStore.svelte.ts
- [x] T044 [US3] Add isDraggable computation to ImpactTaskRow in src/lib/components/ImpactTaskRow.svelte
- [x] T045 [US3] Add drag handle UI (only for draggable tasks) in src/lib/components/ImpactTaskRow.svelte
- [x] T046 [US3] Implement ondragstart handler in src/lib/components/ImpactTaskRow.svelte
- [x] T047 [US3] Implement ondragend handler in src/lib/components/ImpactTaskRow.svelte
- [x] T048 [US3] Add ondragover handler to ImpactPanel in src/lib/components/ImpactPanel.svelte
- [x] T049 [US3] Add ondrop handler to ImpactPanel in src/lib/components/ImpactPanel.svelte
- [x] T050 [US3] Add drop target visual feedback in src/lib/components/ImpactPanel.svelte
- [x] T051 [US3] Wire drop handler to sessionStore.reorderTasks in src/lib/components/ImpactPanel.svelte
- [x] T052 [US3] Verify indicator recalculation after reorder in src/lib/components/ImpactPanel.svelte

**Checkpoint**: Users can drag flexible tasks to resolve conflicts - US3 complete

---

## Phase 6: User Story 4 - Persistent Schedule Changes (Priority: P3)

**Goal**: Persist task reordering across page reloads

**Independent Test**: Reorder tasks, refresh page, verify new order is maintained

### Tests for User Story 4

- [x] T053 [P] [US4] Write unit test for storage.saveTasks with updated sortOrder in tests/unit/storage.test.ts
- [ ] T054 [P] [US4] Write e2e test for reorder persistence across reload in tests/e2e/impact-panel.test.ts

### Implementation for User Story 4

- [x] T055 [US4] Update storage.saveTasks to handle sortOrder updates in src/lib/services/storage.ts
- [x] T056 [US4] Call storage.saveTasks after reorderTasks in sessionStore in src/lib/stores/sessionStore.svelte.ts
- [x] T057 [US4] Verify restored tasks maintain reordered sortOrder in src/routes/+page.svelte
- [x] T058 [US4] Add confirmation of persistence in sessionStore.reorderTasks in src/lib/stores/sessionStore.svelte.ts

**Checkpoint**: Reordered schedules persist across reloads - US4 complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, edge cases, and final validation

- [x] T059 [P] Add JSDoc documentation to ImpactPanel component in src/lib/components/ImpactPanel.svelte
- [x] T060 [P] Add JSDoc documentation to ImpactTaskRow component in src/lib/components/ImpactTaskRow.svelte
- [x] T061 Handle edge case: no flexible tasks to move (hide drag handles) in src/lib/components/ImpactPanel.svelte
- [x] T062 Handle edge case: all tasks completed (panel shows summary state) in src/lib/components/ImpactPanel.svelte
- [ ] T063 Handle edge case: fixed task still red after all possible reorders in src/lib/components/ImpactPanel.svelte
- [ ] T064 Handle edge case: multiple fixed tasks where resolving one conflict causes another (show cascading effect) in src/lib/components/ImpactPanel.svelte
- [ ] T065 Handle edge case: current task is last flexible before at-risk fixed task (show warning, no reorder possible) in src/lib/components/ImpactPanel.svelte
- [x] T066 Run npm run check and fix any TypeScript errors
- [x] T067 Run npm run lint and fix any linting issues
- [x] T068 Run npm test and ensure all unit tests pass
- [x] T069 Run npm run test:e2e and ensure all e2e tests pass
- [x] T070 Update docs/USER_GUIDE.md with impact panel usage instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run parallel to US1)
- **User Story 3 (Phase 5)**: Depends on US1 and US2 (needs panel and indicators to test reordering)
- **User Story 4 (Phase 6)**: Depends on US3 (needs reordering to test persistence)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Can run parallel to US1
- **User Story 3 (P2)**: Requires US1 (panel exists) and US2 (indicators to verify) - NOT parallel
- **User Story 4 (P3)**: Requires US3 (reorder functionality) - NOT parallel

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Component skeleton before implementation details
- Core functionality before visual polish
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (all parallel)**:
- T001, T002, T003, T004 - different type definitions

**Phase 2 (tests parallel, then implementation)**:
- T005, T006, T007 - different test cases
- T008, T009, T010 - sequential (functions build on each other)

**Phase 3 & 4 (can run in parallel)**:
- US1 and US2 can proceed simultaneously after Foundational
- T012+T013 parallel, T014+T020 parallel, T027+T028 parallel

**Phase 5 (tests parallel)**:
- T036, T037, T038 - different test files

---

## Parallel Example: User Stories 1 & 2

```bash
# After Foundational phase completes, launch both stories:

# Developer A: User Story 1
Task: "Write unit test for ImpactTaskRow display status styling in tests/unit/ImpactTaskRow.test.ts"
Task: "Write e2e test for impact panel visibility during tracking in tests/e2e/impact-panel.test.ts"
Task: "Create ImpactTaskRow component skeleton in src/lib/components/ImpactTaskRow.svelte"
...

# Developer B: User Story 2
Task: "Write unit test for risk indicator color determination in tests/unit/ImpactTaskRow.test.ts"
Task: "Write e2e test for risk indicator color changes on overtime in tests/e2e/impact-panel.test.ts"
Task: "Implement risk indicator component for fixed tasks in src/lib/components/ImpactTaskRow.svelte"
...
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (projection service)
3. Complete Phase 3: User Story 1 (panel display)
4. Complete Phase 4: User Story 2 (risk indicators)
5. **STOP and VALIDATE**: Panel shows tasks with risk colors
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Panel with indicators (MVP!)
3. Add US3 → Drag-drop reordering
4. Add US4 → Persistence
5. Each story adds value without breaking previous stories

### Single Developer Strategy

1. Phase 1 → Phase 2 (sequential, foundation first)
2. Phase 3 → Phase 4 (can interleave US1 and US2 tasks)
3. Phase 5 (reordering)
4. Phase 6 (persistence)
5. Phase 7 (polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution IV: Tests MUST be written first and FAIL before implementation
