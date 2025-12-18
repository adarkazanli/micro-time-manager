# Tasks: Day Tracking Timer

**Input**: Design documents from `/specs/002-day-tracking/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests included per Constitution IV (Test-First Development)

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## User Stories Summary

| Story | Priority | Title | Independence |
|-------|----------|-------|--------------|
| US1 | P1 | Start Day and View Timer | Core functionality - no dependencies |
| US2 | P1 | Complete Task and Auto-Advance | Depends on US1 timer infrastructure |
| US3 | P2 | Timer State Visual Feedback | Independent - visual enhancement |
| US4 | P2 | Schedule Lag Indicator | Depends on US2 for completion tracking |
| US5 | P3 | Fixed Task Warnings | Depends on US4 for lag calculation |

---

## Phase 1: Setup

**Purpose**: Extend existing project with 002-day-tracking types and constants

- [x] T001 Add timer-related type definitions to src/lib/types/index.ts (TimerColor, SessionStatus, ProgressStatus, TaskProgress, DaySession, TimerState, TabInfo, FixedTaskWarning, DaySummary)
- [x] T002 Add new localStorage constants to src/lib/types/index.ts (STORAGE_KEY_SESSION, STORAGE_KEY_TAB, WARNING_THRESHOLD_MS, TAB_STALE_THRESHOLD_MS, TAB_HEARTBEAT_INTERVAL_MS, PERSIST_INTERVAL_MS)
- [x] T003 Update CURRENT_SCHEMA_VERSION from 1 to 2 in src/lib/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core timer service and storage infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational

- [x] T004 [P] Unit test for createTimer service in tests/unit/timer.test.ts - test performance.now() usage, RAF updates, stop/start, recovery offset
- [x] T005 [P] Unit test for tabSync service in tests/unit/tabSync.test.ts - test leadership claim, heartbeat, BroadcastChannel messaging
- [x] T006 [P] Unit test for storage service extension in tests/unit/storage.test.ts - test saveSession, getSession, clearSession, schema migration v1→v2

### Implementation for Foundational

- [x] T007 Implement createTimer factory function in src/lib/services/timer.ts per timer-service.contract.ts (performance.now(), requestAnimationFrame, offset recovery)
- [x] T008 Implement createTabSync factory function in src/lib/services/tabSync.ts per timer-service.contract.ts (BroadcastChannel, localStorage fallback, heartbeat)
- [x] T009 Extend storage service in src/lib/services/storage.ts with saveSession(), getSession(), clearSession(), getTabInfo(), saveTabInfo(), clearTabInfo()
- [x] T010 Implement schema migration function migrateV1toV2() in src/lib/services/storage.ts

**Checkpoint**: Foundation ready - timer service, tab sync, and storage all tested and working

---

## Phase 3: User Story 1 - Start Day and View Timer (Priority: P1) 🎯 MVP

**Goal**: User can click "Start Day" and see a countdown timer for the current task

**Independent Test**: Import a schedule, click "Start Day", verify timer counts down while displaying current task name and type badge

### Tests for User Story 1

- [x] T011 [P] [US1] Unit test for timerStore in tests/unit/timerStore.test.ts - test start, stop, reset, snapshot, elapsedMs, remainingMs, displayTime
- [x] T012 [P] [US1] Unit test for sessionStore.startDay() in tests/unit/sessionStore.test.ts - test session creation, task progress initialization, error on empty tasks
- [ ] T013 [P] [US1] E2E test for start day flow in tests/e2e/day-tracking.test.ts - test "Start Day" button creates session and starts timer

### Implementation for User Story 1

- [x] T014 [US1] Create timerStore with Svelte 5 runes in src/lib/stores/timerStore.svelte.ts - implement TimerStoreContract interface
- [x] T015 [US1] Create sessionStore with startDay() method in src/lib/stores/sessionStore.svelte.ts - implement startDay() from SessionStoreContract
- [x] T016 [P] [US1] Create TimerDisplay.svelte component in src/lib/components/TimerDisplay.svelte - display countdown with formatted time
- [x] T017 [P] [US1] Create CurrentTask.svelte component in src/lib/components/CurrentTask.svelte - display task name and type badge (fixed/flexible)
- [x] T018 [US1] Create TaskControls.svelte component with "Start Day" button in src/lib/components/TaskControls.svelte
- [x] T019 [US1] Integrate timer components into main page in src/routes/+page.svelte - add tracking view with timer display, current task, controls
- [x] T020 [US1] Add formatTime utility function to src/lib/utils/time.ts - format milliseconds as MM:SS or H:MM:SS with negative support

**Checkpoint**: User Story 1 complete - user can start day and see countdown timer with task info

---

## Phase 4: User Story 2 - Complete Task and Auto-Advance (Priority: P1)

**Goal**: User can complete a task and the next task automatically starts

**Independent Test**: Start a task, click "Complete Task", verify next task begins with its timer

### Tests for User Story 2

- [x] T021 [P] [US2] Unit test for sessionStore.completeTask() in tests/unit/sessionStore.test.ts - test actual time recording, auto-advance, lag calculation
- [x] T022 [P] [US2] Unit test for sessionStore.endDay() in tests/unit/sessionStore.test.ts - test summary generation when last task completed
- [ ] T023 [P] [US2] E2E test for task completion flow in tests/e2e/day-tracking.test.ts - test "Complete Task" advances to next, last task shows summary

### Implementation for User Story 2

- [x] T024 [US2] Add completeTask() method to sessionStore in src/lib/stores/sessionStore.svelte.ts - record actual duration, update lag, advance to next task
- [x] T025 [US2] Add endDay() method to sessionStore in src/lib/stores/sessionStore.svelte.ts - generate DaySummary when all tasks complete
- [x] T026 [US2] Add "Complete Task" button to TaskControls.svelte in src/lib/components/TaskControls.svelte
- [x] T027 [US2] Create DaySummary.svelte component in src/lib/components/DaySummary.svelte - display end-of-day statistics
- [x] T028 [US2] Add calculateLag utility function to src/lib/utils/time.ts - calculate cumulative lag from task progress
- [x] T029 [US2] Integrate DaySummary into main page in src/routes/+page.svelte - show summary when session status is 'complete'

**Checkpoint**: User Stories 1 AND 2 complete - user can start day, complete tasks, and see summary at end

---

## Phase 5: User Story 3 - Timer State Visual Feedback (Priority: P2)

**Goal**: Timer color changes based on remaining time (green → yellow → red)

**Independent Test**: Observe timer color as time progresses through running, warning, and overdrawn states

### Tests for User Story 3

- [x] T030 [P] [US3] Unit test for timer color thresholds in tests/unit/timerStore.test.ts - test green >5min, yellow ≤5min, red ≤0
- [ ] T031 [P] [US3] Component test for TimerDisplay color changes in tests/component/TimerDisplay.test.ts - verify CSS class changes

### Implementation for User Story 3

- [x] T032 [US3] Add color derivation to timerStore in src/lib/stores/timerStore.svelte.ts - derive color from remainingMs using thresholds
- [x] T033 [US3] Add color-based Tailwind classes to TimerDisplay.svelte in src/lib/components/TimerDisplay.svelte - green-500, yellow-500, red-500

**Checkpoint**: User Story 3 complete - timer visually indicates time pressure

---

## Phase 6: User Story 4 - Schedule Lag Indicator (Priority: P2)

**Goal**: User sees how far ahead or behind schedule they are

**Independent Test**: Complete tasks faster/slower than planned, verify lag indicator updates correctly

### Tests for User Story 4

- [x] T034 [P] [US4] Unit test for lag calculation in tests/unit/sessionStore.test.ts - test ahead, behind, on-schedule, hour formatting (combined with T035)
- [x] T035 [P] [US4] Unit test for lagDisplay formatting in tests/unit/sessionStore.test.ts - test "On schedule", "X min ahead/behind", "X hr Y min ahead/behind"
- [ ] T036 [P] [US4] Component test for LagIndicator in tests/component/LagIndicator.test.ts - verify display and color coding (skipped: inline implementation)

### Implementation for User Story 4

- [x] T037 [US4] Add lagSec and lagDisplay derivations to sessionStore in src/lib/stores/sessionStore.svelte.ts
- [x] T038 [US4] Lag indicator display implemented inline in src/routes/+page.svelte (no separate component)
- [x] T039 [US4] Add formatLag utility function to src/lib/utils/time.ts - format seconds as "X min ahead/behind" or "X hr Y min ahead/behind"
- [x] T040 [US4] Integrate LagIndicator into main page in src/routes/+page.svelte

**Checkpoint**: User Story 4 complete - user can see overall schedule health

---

## Phase 7: User Story 5 - Fixed Task Warnings (Priority: P3)

**Goal**: User is warned when current pace will make them late for a fixed task

**Independent Test**: Create schedule with fixed task, run behind on flexible task, observe warning message

### Tests for User Story 5

- [x] T041 [P] [US5] Unit test for detectFixedTaskConflict in tests/unit/sessionStore.test.ts - test warning generation, warning clear, no warning cases
- [ ] T042 [P] [US5] Component test for FixedTaskWarning in tests/component/FixedTaskWarning.test.ts - verify warning display and dismissal

### Implementation for User Story 5

- [x] T043 [US5] Add fixedTaskWarning derivation to sessionStore in src/lib/stores/sessionStore.svelte.ts - implement detectFixedTaskConflict logic
- [x] T044 [US5] Create FixedTaskWarning.svelte component in src/lib/components/FixedTaskWarning.svelte - display "At current pace, you will be X minutes late for [Task Name]"
- [x] T045 [US5] Integrate FixedTaskWarning into main page in src/routes/+page.svelte

**Checkpoint**: User Story 5 complete - user gets proactive warnings about fixed task conflicts

---

## Phase 8: Edge Cases & Persistence

**Purpose**: Handle edge cases from spec.md and ensure state persistence

### Tests for Edge Cases

- [x] T046 [P] Unit test for page refresh recovery in tests/unit/sessionStore.test.ts - test restore() method recalculates elapsed time
- [ ] T047 [P] Unit test for multi-tab detection in tests/unit/tabSync.test.ts - test secondary tab gets warning, controls disabled
- [x] T048 [P] Unit test for missed fixed task handling in tests/unit/sessionStore.test.ts - test markMissed() skips task correctly
- [ ] T049 [P] E2E test for page refresh in tests/e2e/day-tracking.test.ts - refresh mid-task, verify timer resumes correctly

### Implementation for Edge Cases

- [x] T050 Add restore() method to sessionStore in src/lib/stores/sessionStore.svelte.ts - restore session from localStorage, recalculate elapsed
- [x] T051 Add markMissed() method to sessionStore in src/lib/stores/sessionStore.svelte.ts - mark fixed tasks as missed if start time passed
- [x] T052 Implement visibility change persistence in src/routes/+page.svelte - persist state on document.visibilitychange
- [x] T053 Implement periodic persistence (5s interval) in src/routes/+page.svelte
- [x] T054 Add multi-tab warning UI to TaskControls.svelte in src/lib/components/TaskControls.svelte - show warning, disable controls if not leader
- [x] T055 Initialize tab sync and session recovery on app load in src/routes/+page.svelte

**Checkpoint**: All edge cases handled - app is resilient to refresh, multi-tab, and missed tasks

- [x] T056 [P] Add "no schedule" error handling to TaskControls.svelte - show message prompting schedule import when confirmedTasks array is empty in src/lib/components/TaskControls.svelte

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final validation

- [ ] T057 [P] Update USER_GUIDE.md with day tracking instructions in docs/USER_GUIDE.md
- [ ] T058 [P] Update API.md with timer store and session store contracts in docs/API.md
- [ ] T059 [P] Update DATA_SCHEMA.md with new localStorage schema v2 in docs/DATA_SCHEMA.md
- [ ] T060 Run full test suite (npm test && npm run test:e2e) and fix any failures
- [ ] T061 Run quickstart.md validation - verify all steps work as documented
- [ ] T062 Review bundle size impact - ensure <50KB gzipped constraint met

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001-T003)
    ↓
Phase 2: Foundational (T004-T010)  ← BLOCKS ALL USER STORIES
    ↓
┌───────────────────────────────────────────────────────┐
│  User Stories can proceed in parallel or sequentially │
├───────────────────────────────────────────────────────┤
│  Phase 3: US1 (T011-T020) - Start Day & Timer         │
│      ↓                                                │
│  Phase 4: US2 (T021-T029) - Complete Task             │
│      ↓ (US4 depends on US2 for lag)                   │
│  Phase 5: US3 (T030-T033) - Visual Feedback ←─┐       │
│      ↓                                        │       │
│  Phase 6: US4 (T034-T040) - Lag Indicator ────┘       │
│      ↓                                                │
│  Phase 7: US5 (T041-T045) - Fixed Task Warnings       │
└───────────────────────────────────────────────────────┘
    ↓
Phase 8: Edge Cases (T046-T055)
    ↓
Phase 9: Polish (T056-T061)
```

### User Story Dependencies

- **US1 (P1)**: No dependencies - core timer functionality
- **US2 (P1)**: Depends on US1 timer infrastructure
- **US3 (P2)**: Independent - can start after US1
- **US4 (P2)**: Depends on US2 for task completion and lag calculation
- **US5 (P3)**: Depends on US4 for lag calculation

### Within Each Phase

- Tests MUST be written first and FAIL before implementation
- Types before services
- Services before stores
- Stores before components
- Components before page integration

### Parallel Opportunities

**Phase 2 (Foundational):**
```
T004, T005, T006 can run in parallel (different test files)
T007, T008 can run in parallel (different service files)
```

**Phase 3 (US1):**
```
T011, T012, T013 can run in parallel (different test files)
T016, T017 can run in parallel (different component files)
```

**Phase 4-7 (US2-US5):**
```
All test tasks within each phase marked [P] can run in parallel
```

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "T011 [P] [US1] Unit test for timerStore in tests/unit/timerStore.test.ts"
Task: "T012 [P] [US1] Unit test for sessionStore.startDay() in tests/unit/sessionStore.test.ts"
Task: "T013 [P] [US1] E2E test for start day flow in tests/e2e/day-tracking.test.ts"

# Launch parallel components for User Story 1:
Task: "T016 [P] [US1] Create TimerDisplay.svelte component"
Task: "T017 [P] [US1] Create CurrentTask.svelte component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010)
3. Complete Phase 3: User Story 1 (T011-T020)
4. Complete Phase 4: User Story 2 (T021-T029)
5. **STOP and VALIDATE**: User can start day, track tasks, complete day
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → User can start day and see timer (MVP Core!)
3. Add US2 → User can complete tasks and see summary (MVP Complete!)
4. Add US3 → Timer has visual feedback (Enhanced UX)
5. Add US4 → Lag indicator shows schedule health (Power User Feature)
6. Add US5 → Fixed task warnings (Advanced Feature)

### Task Counts

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 3 | 0 |
| Foundational | 7 | 5 |
| US1 (P1) | 10 | 5 |
| US2 (P1) | 9 | 3 |
| US3 (P2) | 4 | 2 |
| US4 (P2) | 7 | 3 |
| US5 (P3) | 5 | 2 |
| Edge Cases | 11 | 5 |
| Polish | 6 | 3 |
| **Total** | **62** | **28** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests use TDD approach per Constitution IV
- Timer uses performance.now() per Constitution III
- All state persisted to localStorage per Constitution II
- Commit after each task or logical group
