# Tasks: Ad-Hoc Task Creation

**Input**: Design documents from `/specs/009-ad-hoc-tasks/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Test-First Development required per constitution. Unit, component, and e2e tests included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Title | Priority | Description |
|-------|-------|----------|-------------|
| US1 | Create Ad-Hoc Fixed Task | P1 | Add fixed-time tasks during active session |
| US2 | Create Ad-Hoc Flexible Task | P2 | Add flexible tasks during active session |
| US3 | Quick Task Entry | P2 | Keyboard shortcut and fast entry UX |
| US4 | Track Ad-Hoc Tasks in Analytics | P3 | Distinguish ad-hoc vs imported in analytics/exports |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type system foundation that all stories depend on

- [x] T001 Add `isAdHoc?: boolean` property to ConfirmedTask interface in src/lib/types/index.ts
- [x] T002 Add `isAdHoc?: boolean` to SerializedTask interface in src/lib/services/storage.ts
- [x] T003 Update `serializeTask()` to include isAdHoc field in src/lib/services/storage.ts
- [x] T004 Update `deserializeTask()` to handle isAdHoc field in src/lib/services/storage.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core store method that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational

- [x] T005 [P] Write unit tests for addTask() validation in tests/unit/sessionStore.test.ts
- [x] T006 [P] Write unit tests for addTask() insertion logic in tests/unit/sessionStore.test.ts

### Implementation

- [x] T007 Add AddTaskInput type definition to src/lib/stores/sessionStore.svelte.ts
- [x] T008 Implement `addTask()` method with validation in src/lib/stores/sessionStore.svelte.ts
- [x] T009 Implement insertion logic for fixed tasks (chronological order) in src/lib/stores/sessionStore.svelte.ts
- [x] T010 Implement insertion logic for flexible tasks (after current) in src/lib/stores/sessionStore.svelte.ts
- [x] T011 Add TaskProgress record creation in addTask() in src/lib/stores/sessionStore.svelte.ts
- [x] T012 Add storage persistence calls in addTask() in src/lib/stores/sessionStore.svelte.ts
- [x] T013 Run unit tests to verify addTask() implementation passes

**Checkpoint**: Foundation ready - addTask() method complete and tested

---

## Phase 3: User Story 1 - Create Ad-Hoc Fixed Task (Priority: P1) 🎯 MVP

**Goal**: Users can add fixed-time tasks (like meetings) during an active day session

**Independent Test**: Create a fixed task during active session, verify it appears at correct chronological position with risk indicators

### Tests for User Story 1

- [ ] T014 [P] [US1] Write component tests for AddTaskDialog fixed task flow in tests/component/AddTaskDialog.test.ts
- [ ] T015 [P] [US1] Write e2e test for fixed task creation in tests/e2e/ad-hoc-tasks.spec.ts

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create AddTaskDialog.svelte component skeleton in src/lib/components/AddTaskDialog.svelte
- [ ] T017 [US1] Implement form fields (name, duration, type, startTime) in src/lib/components/AddTaskDialog.svelte
- [ ] T018 [US1] Implement form validation logic in src/lib/components/AddTaskDialog.svelte
- [ ] T019 [US1] Add past-time warning display (FR-013) in src/lib/components/AddTaskDialog.svelte
- [ ] T020 [US1] Add overlap warning display (FR-014) in src/lib/components/AddTaskDialog.svelte
- [ ] T021 [US1] Implement submit handler calling sessionStore.addTask() in src/lib/components/AddTaskDialog.svelte
- [ ] T022 [US1] Add AddTaskDialog styling (follow EditTaskDialog patterns) in src/lib/components/AddTaskDialog.svelte
- [ ] T023 [US1] Add "Add Task" button to ImpactPanel header in src/lib/components/ImpactPanel.svelte
- [ ] T024 [US1] Add showAddTaskDialog state and dialog integration in src/lib/components/ImpactPanel.svelte
- [ ] T025 [US1] Conditionally show Add Task button only during active session (FR-016) in src/lib/components/ImpactPanel.svelte
- [ ] T026 [US1] Run e2e test to verify fixed task creation flow

**Checkpoint**: User Story 1 complete - Fixed tasks can be created and appear at correct position

---

## Phase 4: User Story 2 - Create Ad-Hoc Flexible Task (Priority: P2)

**Goal**: Users can add flexible tasks that insert after the current task and can be reordered

**Independent Test**: Create a flexible task during active session, verify it appears after current task and can be dragged

### Tests for User Story 2

- [ ] T027 [P] [US2] Write component tests for AddTaskDialog flexible task flow in tests/component/AddTaskDialog.test.ts
- [ ] T028 [P] [US2] Write e2e test for flexible task creation and reorder in tests/e2e/ad-hoc-tasks.spec.ts

### Implementation for User Story 2

- [ ] T029 [US2] Add context-based type switching (flexible → fixed when startTime entered) in src/lib/components/AddTaskDialog.svelte
- [ ] T030 [US2] Conditionally show/hide startTime field based on type selection in src/lib/components/AddTaskDialog.svelte
- [ ] T031 [US2] Run e2e test to verify flexible task creation and reorder

**Checkpoint**: User Story 2 complete - Flexible tasks insert after current task and can be reordered

---

## Phase 5: User Story 3 - Quick Task Entry (Priority: P2)

**Goal**: Users can quickly add tasks via keyboard shortcut without leaving current workflow

**Independent Test**: Press Ctrl/Cmd+T during active session, verify dialog opens and task can be created quickly

### Tests for User Story 3

- [ ] T032 [P] [US3] Write e2e test for keyboard shortcut (Ctrl/Cmd+T) in tests/e2e/ad-hoc-tasks.spec.ts

### Implementation for User Story 3

- [ ] T033 [US3] Add global keydown handler for Ctrl/Cmd+T in src/routes/+page.svelte
- [ ] T034 [US3] Add showAddTaskDialog state to +page.svelte in src/routes/+page.svelte
- [ ] T035 [US3] Wire AddTaskDialog to +page.svelte for keyboard shortcut access in src/routes/+page.svelte
- [ ] T036 [US3] Ensure keyboard shortcut only works during active session in src/routes/+page.svelte
- [ ] T037 [US3] Add form reset on dialog open/close in src/lib/components/AddTaskDialog.svelte
- [ ] T038 [US3] Implement Enter key submit and Escape key close in src/lib/components/AddTaskDialog.svelte
- [ ] T039 [US3] Run e2e test to verify keyboard shortcut workflow

**Checkpoint**: User Story 3 complete - Keyboard shortcut provides quick task entry

---

## Phase 6: User Story 4 - Track Ad-Hoc Tasks in Analytics (Priority: P3)

**Goal**: Users can see planned vs. unplanned work breakdown in analytics and exports

**Independent Test**: Complete ad-hoc and imported tasks, verify analytics shows breakdown and exports include Source column

### Tests for User Story 4

- [ ] T040 [P] [US4] Write unit tests for analytics ad-hoc tracking in tests/unit/analytics.test.ts
- [ ] T041 [P] [US4] Write unit tests for export Source column in tests/unit/export.test.ts

### Implementation for User Story 4

- [ ] T042 [P] [US4] Add adHocTaskCount and importedTaskCount to AnalyticsSummary in src/lib/services/analytics.ts
- [ ] T043 [P] [US4] Compute ad-hoc vs imported counts in analytics service in src/lib/services/analytics.ts
- [ ] T044 [US4] Display ad-hoc vs imported breakdown in AnalyticsDashboard in src/lib/components/AnalyticsDashboard.svelte
- [ ] T045 [P] [US4] Add `source` field to TaskExportRow in src/lib/types/index.ts
- [ ] T046 [US4] Populate source column in Excel export in src/lib/services/export.ts
- [ ] T047 [US4] Populate source column in CSV export in src/lib/services/export.ts
- [ ] T048 [US4] Run unit tests to verify analytics and export integration

**Checkpoint**: User Story 4 complete - Analytics and exports distinguish ad-hoc tasks

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and quality assurance

- [ ] T049 [P] Update USER_GUIDE.md with ad-hoc task creation instructions in docs/USER_GUIDE.md
- [ ] T050 [P] Update API.md with addTask() method documentation in docs/API.md
- [ ] T051 [P] Update DATA_SCHEMA.md with isAdHoc field documentation in docs/DATA_SCHEMA.md
- [ ] T052 Run npm run check to verify TypeScript compilation
- [ ] T053 Run npm run lint to verify code style compliance
- [ ] T054 Run npm run test to verify all tests pass
- [ ] T055 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 and US2 share AddTaskDialog component
  - US3 depends on AddTaskDialog from US1
  - US4 is fully independent once Foundational is complete
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates AddTaskDialog component
- **User Story 2 (P2)**: Can start after US1 (shares AddTaskDialog) - Adds flexible task handling
- **User Story 3 (P2)**: Can start after US1 (uses AddTaskDialog) - Adds keyboard shortcut
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Fully independent

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Component skeleton before form fields
- Validation before submission logic
- Integration after component is complete
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase**:
```
T001, T002, T003, T004 - Must be sequential (type changes cascade)
```

**Foundational Phase**:
```
T005 + T006 can run in parallel (different test files)
T007 → T008 → T009, T010, T011, T012 (sequential within store)
```

**User Story 4** (can run in parallel with US1-US3):
```
T040 + T041 can run in parallel (different test files)
T042 + T043 + T045 can run in parallel (different files)
```

---

## Parallel Example: User Story 1

```bash
# Launch tests in parallel:
Task: "Write component tests for AddTaskDialog fixed task flow" (T014)
Task: "Write e2e test for fixed task creation" (T015)

# After tests written, component development:
Task: "Create AddTaskDialog.svelte component skeleton" (T016)
# Then sequential implementation within AddTaskDialog
```

## Parallel Example: User Story 4 (Independent)

```bash
# Can run entirely in parallel with US1-US3:
Task: "Write unit tests for analytics ad-hoc tracking" (T040)
Task: "Write unit tests for export Source column" (T041)

# After tests:
Task: "Add adHocTaskCount to AnalyticsSummary" (T042)
Task: "Compute ad-hoc counts in analytics" (T043)
Task: "Add source field to TaskExportRow" (T045)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T013)
3. Complete Phase 3: User Story 1 (T014-T026)
4. **STOP and VALIDATE**: Test fixed task creation independently
5. Deploy/demo if ready - users can add fixed tasks!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP: Fixed tasks)
3. Add User Story 2 → Test independently → Deploy (Flexible tasks)
4. Add User Story 3 → Test independently → Deploy (Keyboard shortcut)
5. Add User Story 4 → Test independently → Deploy (Analytics integration)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 → User Story 2 → User Story 3
   - Developer B: User Story 4 (independent)
3. Stories complete and integrate independently

---

## Notes

- All file paths are relative to repository root
- Constitution requires Test-First Development
- Follow EditTaskDialog patterns for AddTaskDialog styling
- Existing projection service handles recalculations automatically
- No schema migration needed (isAdHoc is optional field)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
