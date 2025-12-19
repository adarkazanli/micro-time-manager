# Tasks: Interruption Tracking

**Input**: Design documents from `/specs/004-interruption-tracking/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Unit tests included per Constitution IV (Test-First Development). E2E tests included for user workflow validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project Structure**: SvelteKit application at repository root
- Source: `src/lib/` (components, stores, services, types)
- Tests: `tests/unit/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add interruption types and storage infrastructure that all user stories depend on

- [x] T001 [P] Add InterruptionCategory type and Interruption interface in src/lib/types/index.ts
- [x] T002 [P] Add InterruptionSummary interface and InterruptionState interface in src/lib/types/index.ts
- [x] T003 [P] Add STORAGE_KEY_INTERRUPTIONS, MAX_INTERRUPTION_NOTE_LENGTH, INTERRUPTION_CATEGORIES constants in src/lib/types/index.ts
- [x] T004 Update CURRENT_SCHEMA_VERSION from 2 to 3 in src/lib/types/index.ts
- [x] T005 Add migrateV2toV3() function in src/lib/services/storage.ts
- [x] T006 Add saveInterruptions(), loadInterruptions(), clearInterruptions() methods in src/lib/services/storage.ts

---

## Phase 2: Foundational (Core Store)

**Purpose**: Create interruptionStore that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No UI work can begin until this phase is complete

### Tests for Foundation

- [x] T007 [P] Create test file with describe blocks for interruptionStore in tests/unit/interruptionStore.test.ts
- [x] T008 [P] Add tests for startInterruption() - success case, already interrupted, no task active in tests/unit/interruptionStore.test.ts
- [x] T009 [P] Add tests for endInterruption() - success case, not interrupted, duration calculation in tests/unit/interruptionStore.test.ts
- [x] T010 [P] Add tests for updateInterruption() - category update, note update, invalid ID in tests/unit/interruptionStore.test.ts
- [x] T011 [P] Add tests for getTaskSummary() - empty, single interruption, multiple interruptions in tests/unit/interruptionStore.test.ts
- [x] T012 [P] Add tests for reset() and restore() methods in tests/unit/interruptionStore.test.ts

### Implementation for Foundation

- [x] T013 Create interruptionStore with $state variables (isInterrupted, activeInterruption, elapsedMs, interruptions) in src/lib/stores/interruptionStore.svelte.ts
- [x] T014 Implement startInterruption(taskId) method with timer creation in src/lib/stores/interruptionStore.svelte.ts
- [x] T015 Implement endInterruption() method with duration calculation and persistence in src/lib/stores/interruptionStore.svelte.ts
- [x] T016 Implement updateInterruption(id, updates) method in src/lib/stores/interruptionStore.svelte.ts
- [x] T017 Implement getTaskSummary(taskId) derived computation in src/lib/stores/interruptionStore.svelte.ts
- [x] T018 Implement reset() and restore() methods in src/lib/stores/interruptionStore.svelte.ts
- [x] T019 Add autoEndInterruption() helper for edge case handling in src/lib/stores/interruptionStore.svelte.ts

**Checkpoint**: Foundation ready - all tests pass, store is fully functional

---

## Phase 3: User Story 1 - Log an Interruption (Priority: P1) 🎯 MVP

**Goal**: User can click "Interrupt" button or press "I" key to pause task timer and start interruption timer

**Independent Test**: Start a task, click Interrupt, verify task timer pauses and interruption timer starts

### Tests for User Story 1

- [ ] T020 [P] [US1] Add e2e test for clicking Interrupt button in tests/e2e/interruption-tracking.test.ts
- [ ] T021 [P] [US1] Add e2e test for pressing "I" key shortcut in tests/e2e/interruption-tracking.test.ts
- [ ] T022 [P] [US1] Add e2e test verifying Interrupt is disabled when no task active in tests/e2e/interruption-tracking.test.ts

### Implementation for User Story 1

- [ ] T023 [P] [US1] Create InterruptButton component with disabled state prop in src/lib/components/InterruptButton.svelte
- [ ] T024 [P] [US1] Create InterruptionTimer component showing elapsed time in src/lib/components/InterruptionTimer.svelte
- [ ] T025 [US1] Add handleInterrupt() function in src/routes/+page.svelte that calls timerStore.stop() and interruptionStore.startInterruption()
- [ ] T026 [US1] Add global keydown listener for "I" key in src/routes/+page.svelte (skip when in input fields)
- [ ] T027 [US1] Integrate InterruptButton in timer-column section of src/routes/+page.svelte
- [ ] T028 [US1] Integrate InterruptionTimer (visible when interrupted) in timer-section of src/routes/+page.svelte
- [ ] T029 [US1] Store pausedTaskElapsedMs in +page.svelte for resume functionality

**Checkpoint**: User Story 1 complete - user can log interruptions via button or keyboard

---

## Phase 4: User Story 2 - Resume Work After Interruption (Priority: P1)

**Goal**: User can click "Resume" button or press "R" key to end interruption and resume task timer immediately

**Independent Test**: With active interruption, click Resume, verify task timer resumes at correct position and interruption is recorded

### Tests for User Story 2

- [ ] T030 [P] [US2] Add e2e test for clicking Resume button in tests/e2e/interruption-tracking.test.ts
- [ ] T031 [P] [US2] Add e2e test for pressing "R" key shortcut in tests/e2e/interruption-tracking.test.ts
- [ ] T032 [P] [US2] Add e2e test for editing category/note after resume in tests/e2e/interruption-tracking.test.ts

### Implementation for User Story 2

- [ ] T033 [US2] Add Resume state to InterruptButton component (toggle based on isInterrupted) in src/lib/components/InterruptButton.svelte
- [ ] T034 [P] [US2] Create EditInterruptionDialog component with category radios and note textarea in src/lib/components/EditInterruptionDialog.svelte
- [ ] T035 [US2] Add handleResume() function in src/routes/+page.svelte that calls interruptionStore.endInterruption() and timerStore.start()
- [ ] T036 [US2] Add global keydown listener for "R" key in src/routes/+page.svelte
- [ ] T037 [US2] Add lastInterruptionId state and Edit link trigger in src/routes/+page.svelte
- [ ] T038 [US2] Integrate EditInterruptionDialog in src/routes/+page.svelte

**Checkpoint**: User Stories 1 AND 2 complete - full interrupt/resume flow works

---

## Phase 5: User Story 3 - View Interruption Summary on Main Screen (Priority: P2)

**Goal**: User can see current task's interruption count and total time on the main tracking screen

**Independent Test**: Log multiple interruptions for a task, verify count and total time display correctly

### Tests for User Story 3

- [ ] T039 [P] [US3] Add e2e test for summary display with interruptions in tests/e2e/interruption-tracking.test.ts
- [ ] T040 [P] [US3] Add e2e test for summary hidden when no interruptions in tests/e2e/interruption-tracking.test.ts

### Implementation for User Story 3

- [ ] T041 [P] [US3] Create InterruptionSummary component showing count and formatted total time in src/lib/components/InterruptionSummary.svelte
- [ ] T042 [US3] Add formatInterruptionTime() helper function in src/lib/utils/duration.ts
- [ ] T043 [US3] Add derived currentTaskSummary computation using interruptionStore.getTaskSummary() in src/routes/+page.svelte
- [ ] T044 [US3] Integrate InterruptionSummary below lag-section in src/routes/+page.svelte

**Checkpoint**: User Stories 1, 2, AND 3 complete - users have full visibility into interruptions

---

## Phase 6: User Story 4 - View Full Interruption Log (Priority: P3)

**Goal**: User can view a detailed log of all interruptions from the session

**Independent Test**: Log several interruptions with different categories, open log view, verify all details displayed

### Tests for User Story 4

- [ ] T045 [P] [US4] Add e2e test for opening interruption log view in tests/e2e/interruption-tracking.test.ts
- [ ] T046 [P] [US4] Add e2e test for interruption entry details display in tests/e2e/interruption-tracking.test.ts

### Implementation for User Story 4

- [ ] T047 [P] [US4] Create InterruptionLog component with list of interruption entries in src/lib/components/InterruptionLog.svelte
- [ ] T048 [US4] Add InterruptionLogEntry sub-component showing timestamp, duration, category, note, task name in src/lib/components/InterruptionLog.svelte
- [ ] T049 [US4] Add menu button/link to open InterruptionLog in src/routes/+page.svelte
- [ ] T050 [US4] Add showInterruptionLog state and toggle handler in src/routes/+page.svelte

**Checkpoint**: All user stories complete - full feature is functional

---

## Phase 7: Edge Cases & Integration

**Purpose**: Handle edge cases and ensure proper integration with existing stores

- [ ] T051 Add auto-end interruption check in sessionStore.completeTask() in src/lib/stores/sessionStore.svelte.ts
- [ ] T052 Add auto-end interruption check in sessionStore.endDay() in src/lib/stores/sessionStore.svelte.ts
- [ ] T053 Add interruption state restore on session recovery in src/routes/+page.svelte onMount
- [ ] T054 Clear interruptions in sessionStore.reset() by calling interruptionStore.reset() in src/routes/+page.svelte

---

## Phase 8: Polish & Documentation

**Purpose**: Documentation updates and final validation

- [ ] T055 [P] Update API.md with interruptionStore methods and types in docs/API.md
- [ ] T056 [P] Update USER_GUIDE.md with "Managing Interruptions" section in docs/USER_GUIDE.md
- [ ] T057 [P] Update DATA_SCHEMA.md with Interruption entity and storage key in docs/DATA_SCHEMA.md
- [ ] T058 [P] Add feature entry to CHANGELOG.md
- [ ] T059 Run npm test && npm run lint to verify all tests pass
- [ ] T060 Manual validation of quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all UI work
- **User Stories (Phases 3-6)**: All depend on Phase 2 completion
  - US1 and US2 are both P1 priority but US2 depends on US1 components
  - US3 and US4 can proceed after US1+US2 are complete
- **Edge Cases (Phase 7)**: Depends on US1+US2 being complete
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - Foundation of the feature
- **User Story 2 (P1)**: Depends on US1's InterruptButton and page integration
- **User Story 3 (P2)**: Can start after Phase 2, but uses store from US1/US2
- **User Story 4 (P3)**: Can start after Phase 2, but uses store from US1/US2

### Within Each User Story

- Tests marked [P] can run in parallel
- Component creation marked [P] can run in parallel
- Integration tasks depend on components being created

### Parallel Opportunities

**Phase 1**: T001, T002, T003 can run in parallel (different sections of types file)
**Phase 2**: T007-T012 (tests) can run in parallel; T013-T019 are sequential
**Phase 3**: T020-T022 (tests) in parallel; T023-T024 (components) in parallel
**Phase 4**: T030-T032 (tests) in parallel; T034 in parallel with T033
**Phase 5**: T039-T040 (tests) in parallel; T041 standalone
**Phase 6**: T045-T046 (tests) in parallel; T047-T048 standalone
**Phase 8**: T055-T058 can all run in parallel

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch all foundation tests together:
Task: "Create test file for interruptionStore"
Task: "Add tests for startInterruption()"
Task: "Add tests for endInterruption()"
Task: "Add tests for updateInterruption()"
Task: "Add tests for getTaskSummary()"
Task: "Add tests for reset() and restore()"
```

## Parallel Example: User Story 1 Components

```bash
# Launch both components together:
Task: "Create InterruptButton component"
Task: "Create InterruptionTimer component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (types + storage)
2. Complete Phase 2: Foundation (interruptionStore with tests)
3. Complete Phase 3: User Story 1 (log interruption)
4. Complete Phase 4: User Story 2 (resume from interruption)
5. **STOP and VALIDATE**: Test interrupt/resume flow independently
6. Deploy/demo MVP - users can now track interruptions!

### Incremental Delivery

1. Complete Setup + Foundation → Core store ready
2. Add US1 + US2 → Test independently → Deploy (MVP!)
3. Add US3 → Test independently → Deploy (Summary display)
4. Add US4 → Test independently → Deploy (Full log view)
5. Add Edge Cases + Polish → Complete feature

### Task Count Summary

| Phase | Task Count |
|-------|------------|
| Phase 1: Setup | 6 |
| Phase 2: Foundation | 13 |
| Phase 3: US1 | 10 |
| Phase 4: US2 | 9 |
| Phase 5: US3 | 6 |
| Phase 6: US4 | 6 |
| Phase 7: Edge Cases | 4 |
| Phase 8: Polish | 6 |
| **Total** | **60** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US1 + US2 together form the MVP (interrupt/resume flow)
- US3 adds visibility, US4 adds analysis capability
- Constitution IV requires tests before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
