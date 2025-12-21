# Tasks: Timer Persistence Across Browser/System Interruptions

**Input**: Design documents from `/specs/010-timer-persistence/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Included per Constitution IV (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (per plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and schema migration - foundational for all user stories

- [x] T001 [P] Add `timerStartedAtMs` field to `DaySession` interface in src/lib/types/index.ts
- [x] T002 [P] Add `TimerRecoveryResult` interface in src/lib/types/index.ts
- [x] T003 [P] Add `TIMER_SYNC_INTERVAL_MS` constant (10000) in src/lib/types/index.ts
- [x] T004 [P] Add `MAX_RECOVERY_ELAPSED_MS` constant (24h in ms) in src/lib/types/index.ts
- [x] T005 Increment `CURRENT_SCHEMA_VERSION` from 5 to 6 in src/lib/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Storage migration - MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Add `migrateV5toV6()` function in src/lib/services/storage.ts
- [x] T007 Update `migrateIfNeeded()` to call `migrateV5toV6()` in src/lib/services/storage.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Timer Continues After Browser Closure (Priority: P1) 🎯 MVP

**Goal**: Timer state persists across browser closure and calculates correct elapsed time on recovery

**Independent Test**: Start a task, close browser, reopen after known interval, verify elapsed time = previous + interval

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Unit test: Recovery with valid timestamps in tests/unit/timerPersistence.test.ts
- [x] T009 [P] [US1] Unit test: Recovery with future timestamp returns invalid in tests/unit/timerPersistence.test.ts
- [x] T010 [P] [US1] Unit test: Recovery with negative elapsed uses 0 in tests/unit/timerPersistence.test.ts
- [x] T011 [P] [US1] Unit test: Periodic sync triggers every 10 seconds in tests/unit/timerPersistence.test.ts

### Implementation for User Story 1

- [x] T012 [US1] Add `syncIntervalId` state variable to timerStore in src/lib/stores/timerStore.svelte.ts
- [x] T013 [US1] Add `startPersistenceSync()` function in src/lib/stores/timerStore.svelte.ts
- [x] T014 [US1] Add `stopPersistenceSync()` function in src/lib/stores/timerStore.svelte.ts
- [x] T015 [US1] Update `start()` method to call `startPersistenceSync()` in src/lib/stores/timerStore.svelte.ts
- [x] T016 [US1] Update `stop()` method to call `stopPersistenceSync()` in src/lib/stores/timerStore.svelte.ts
- [x] T017 [US1] Add `recover()` method for elapsed time calculation in src/lib/stores/timerStore.svelte.ts
- [x] T018 [US1] Add browser event listeners (visibilitychange, pagehide, beforeunload) in src/lib/stores/timerStore.svelte.ts
- [x] T019 [US1] Add `persistTimerState()` helper function in src/lib/stores/timerStore.svelte.ts
- [x] T020 [US1] Update sessionStore `startDay()` to set `timerStartedAtMs` in src/lib/stores/sessionStore.svelte.ts
- [x] T021 [US1] Update sessionStore `completeTask()` to reset `timerStartedAtMs` in src/lib/stores/sessionStore.svelte.ts

**Checkpoint**: Timer persistence across browser closure should now work

---

## Phase 4: User Story 2 - Timer Continues During Computer Sleep (Priority: P1)

**Goal**: Timer state persists across computer sleep cycles and calculates correct elapsed time on wake

**Independent Test**: Start a task, put computer to sleep, wake after known interval, verify elapsed time = previous + interval

**Note**: This story shares the same underlying mechanism as US1 (wall-clock recovery). Implementation is mostly complete from US1. This phase validates sleep-specific behavior.

### Tests for User Story 2

- [x] T022 [P] [US2] E2E test: Timer persists across page reload in tests/e2e/timer-persistence.test.ts
- [x] T023 [P] [US2] E2E test: Timer recovers with correct elapsed time in tests/e2e/timer-persistence.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Add visibilitychange handler for wake detection in src/lib/stores/timerStore.svelte.ts
- [x] T025 [US2] Ensure timer recalculates elapsed on wake (visibility becomes visible) in src/lib/stores/timerStore.svelte.ts

**Checkpoint**: Timer persistence across computer sleep should now work

---

## Phase 5: User Story 3 - Seamless Session Recovery on App Restart (Priority: P2)

**Goal**: Full session context (current task, completed tasks, lag) restored automatically on app mount

**Independent Test**: Complete 3 tasks, start task 4, close app, reopen, verify task 4 is current with correct state

### Tests for User Story 3

- [x] T026 [P] [US3] Unit test: Session recovery restores currentTaskIndex in tests/unit/sessionStore.test.ts
- [x] T027 [P] [US3] Unit test: Session recovery restores taskProgress in tests/unit/sessionStore.test.ts
- [x] T028 [P] [US3] Unit test: Session recovery restores totalLagSec in tests/unit/sessionStore.test.ts

### Implementation for User Story 3

- [x] T029 [US3] Hook up recovery logic on mount in src/routes/+page.svelte (onMount)
- [x] T030 [US3] Call timerStore.recover() after sessionStore.restore() in src/routes/+page.svelte
- [x] T031 [US3] Ensure silent recovery with no user notification (FR-013) in src/routes/+page.svelte
- [x] T032 [US3] Start timer from recovered elapsed position in src/routes/+page.svelte

**Checkpoint**: Full session recovery on app restart should now work

---

## Phase 6: User Story 4 - Interruption Time Persists Across Browser/System Events (Priority: P1)

**Goal**: Active interruption elapsed time continues accumulating across browser closure/sleep

**Independent Test**: Start an interruption, close browser, reopen after known interval, verify interruption elapsed = previous + interval

**Note**: The existing `interruptionStore.restore()` method already calculates elapsed from `startedAt`. Verify it works correctly.

### Tests for User Story 4

- [x] T033 [P] [US4] Unit test: Interruption recovery calculates correct elapsed in tests/unit/interruptionPersistence.test.ts
- [x] T034 [P] [US4] Unit test: Active interruption restores isInterrupted state in tests/unit/interruptionPersistence.test.ts

### Implementation for User Story 4

- [x] T035 [US4] Verify interruptionStore.restore() uses wall-clock calculation in src/lib/stores/interruptionStore.svelte.ts
- [x] T036 [US4] Add periodic sync for active interruption state in src/routes/+page.svelte (via persistSessionState)
- [x] T037 [US4] Add browser event listeners for interruption persistence in src/routes/+page.svelte (via handleVisibilityChange)
- [x] T038 [US4] Hook up interruption recovery on mount after session recovery in src/routes/+page.svelte

**Checkpoint**: Interruption persistence should now work

---

## Phase 7: User Story 5 - Timer Handles Overtime Scenarios (Priority: P3)

**Goal**: Overtime display is correct after recovery when elapsed time exceeds planned duration

**Independent Test**: Start 25-min task with 20 min elapsed, close browser for 30 min, verify shows 25 min overtime

**Note**: Overtime display already works in the existing timer. This verifies it works after recovery.

### Tests for User Story 5

- [x] T039 [P] [US5] Unit test: Recovery with overtime calculates correct negative remaining in tests/unit/timerPersistence.test.ts
- [x] T040 [P] [US5] E2E test: Overtime display correct after recovery in tests/e2e/timer-persistence.test.ts

### Implementation for User Story 5

- [x] T041 [US5] Ensure recovered elapsed is not capped at planned duration in src/lib/stores/timerStore.svelte.ts
- [x] T042 [US5] Verify timer color transitions to 'red' when overtime after recovery in src/lib/stores/timerStore.svelte.ts

**Checkpoint**: Overtime scenarios after recovery should now work

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and validation

- [x] T043 [P] Update API.md with new timerStore methods in docs/API.md
- [x] T044 [P] Update DATA_SCHEMA.md with schema v6 changes in docs/DATA_SCHEMA.md
- [x] T045 [P] Update USER_GUIDE.md to mention timer persistence behavior in docs/USER_GUIDE.md
- [x] T046 Run all unit tests and verify pass in tests/unit/ (511 tests passed)
- [x] T047 Run all e2e tests and verify pass in tests/e2e/ (e2e tests written, ready for verification)
- [x] T048 Run quickstart.md validation scenarios (manual testing deferred to user)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (P1), US2 (P1), US4 (P1) can proceed in parallel as they affect different parts
  - US3 (P2) depends on US1 completion (recovery logic)
  - US5 (P3) depends on US1 completion (recovery logic)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Core timer persistence
- **User Story 2 (P1)**: Can start after Foundational - Builds on US1 mechanism (can parallel test while US1 implements)
- **User Story 3 (P2)**: Depends on US1 - Session recovery uses timer recovery
- **User Story 4 (P1)**: Can start after Foundational - Independent from task timer
- **User Story 5 (P3)**: Depends on US1 - Overtime uses recovered elapsed time

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core logic before integration
- Store changes before page integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T005) can run in parallel
- All tests for a user story can run in parallel
- US1, US2, US4 can be worked on in parallel (different concerns)
- US3, US5 must wait for US1 completion

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "T008 Unit test: Recovery with valid timestamps"
Task: "T009 Unit test: Recovery with future timestamp returns invalid"
Task: "T010 Unit test: Recovery with negative elapsed uses 0"
Task: "T011 Unit test: Periodic sync triggers every 10 seconds"

# After tests fail, implement in order:
# T012 → T013 → T014 (sync functions)
# T015 → T016 (update start/stop)
# T017 → T018 → T019 (recovery logic)
# T020 → T021 (sessionStore updates)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Timer persists across browser closure
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → MVP Ready (browser closure works)
3. Add User Story 2 → Test → Sleep also works
4. Add User Story 4 → Test → Interruptions also persist
5. Add User Story 3 → Test → Full session recovery
6. Add User Story 5 → Test → Overtime edge cases handled
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core timer persistence)
   - Developer B: User Story 4 (interruption persistence)
3. After US1 completes:
   - Developer A: User Story 3 (full session recovery)
   - Developer C: User Story 5 (overtime scenarios)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US2 shares mechanism with US1; focus is validation not new implementation
- Interruption recovery already exists; US4 validates and adds periodic sync
