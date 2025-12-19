# Tasks: Analytics Dashboard

**Input**: Design documents from `/specs/006-analytics-dashboard/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Included based on Constitution IV (Test-First Development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure (SvelteKit SPA):
- Source: `src/lib/` for components, services, types
- Tests: `tests/unit/` for service tests
- Routes: `src/routes/` for page integration

---

## Phase 1: Setup (Types & Service Foundation)

**Purpose**: Add TypeScript types and create analytics service with tests

- [x] T001 Add ConcentrationRating type to src/lib/types/index.ts
- [x] T002 Add AnalyticsSummary interface to src/lib/types/index.ts
- [x] T003 Add TaskPerformance interface to src/lib/types/index.ts
- [x] T004 Add concentration threshold constants to src/lib/types/index.ts

---

## Phase 2: Foundational (Analytics Service)

**Purpose**: Core analytics calculation service that ALL user stories depend on

**⚠️ CRITICAL**: No component work can begin until this phase is complete

- [x] T005 [P] Create tests/unit/analytics.test.ts with test structure
- [x] T006 [P] Add getConcentrationRating tests in tests/unit/analytics.test.ts
- [x] T007 [P] Add calculateAnalyticsSummary tests in tests/unit/analytics.test.ts
- [x] T008 [P] Add calculateTaskPerformance tests in tests/unit/analytics.test.ts
- [x] T009 Create src/lib/services/analytics.ts with getConcentrationRating function
- [x] T010 Add calculateAnalyticsSummary function to src/lib/services/analytics.ts
- [x] T011 Add calculateTaskPerformance function to src/lib/services/analytics.ts
- [x] T012 Run tests to verify analytics service passes all tests

**Checkpoint**: Analytics service ready - component implementation can now begin

---

## Phase 3: User Story 1 - View Day Summary Metrics (Priority: P1) 🎯 MVP

**Goal**: Display total planned time, actual time, tasks completed count, and schedule adherence

**Independent Test**: Complete at least one task, open analytics panel, verify summary metrics display correctly

### Implementation for User Story 1

- [x] T013 [US1] Create src/lib/components/DaySummaryCard.svelte with props interface
- [x] T014 [US1] Add total planned time display to DaySummaryCard.svelte
- [x] T015 [US1] Add total actual time display to DaySummaryCard.svelte
- [x] T016 [US1] Add tasks completed count (e.g., "5 of 8") to DaySummaryCard.svelte
- [x] T017 [US1] Add schedule adherence percentage to DaySummaryCard.svelte
- [x] T018 [US1] Add Tailwind styling to DaySummaryCard.svelte

**Checkpoint**: Day summary metrics display independently with correct calculations

---

## Phase 4: User Story 2 - View Concentration Score (Priority: P1)

**Goal**: Display concentration score with rating label (Excellent, Good, Fair, Needs improvement)

**Independent Test**: Complete tasks with/without interruptions, verify concentration score shows correct percentage and rating

### Implementation for User Story 2

- [x] T019 [US2] Create src/lib/components/ConcentrationScore.svelte with props interface
- [x] T020 [US2] Add concentration score percentage display to ConcentrationScore.svelte
- [x] T021 [US2] Add rating badge with color coding to ConcentrationScore.svelte
- [x] T022 [US2] Add formula explanation text to ConcentrationScore.svelte
- [x] T023 [US2] Add Tailwind styling with rating-specific colors to ConcentrationScore.svelte

**Checkpoint**: Concentration score displays with correct rating and color coding

---

## Phase 5: User Story 3 - View Task Performance Details (Priority: P2)

**Goal**: Display per-task metrics with planned vs actual duration and variance

**Independent Test**: Complete multiple tasks, view task list showing planned, actual, and variance for each

### Implementation for User Story 3

- [x] T024 [US3] Create src/lib/components/TaskPerformanceRow.svelte with props interface
- [x] T025 [US3] Add task name display to TaskPerformanceRow.svelte
- [x] T026 [US3] Add planned and actual duration display to TaskPerformanceRow.svelte
- [x] T027 [US3] Add variance display with over/under color coding to TaskPerformanceRow.svelte
- [x] T028 [US3] Add per-task interruption count and time to TaskPerformanceRow.svelte
- [x] T029 [US3] Create src/lib/components/TaskPerformanceList.svelte container
- [x] T030 [US3] Add task list rendering with TaskPerformanceRow to TaskPerformanceList.svelte
- [x] T031 [US3] Add Tailwind styling to TaskPerformanceRow.svelte and TaskPerformanceList.svelte

**Checkpoint**: Task performance list displays all tasks with correct metrics and visual indicators

---

## Phase 6: User Story 4 - View Interruption Summary (Priority: P2)

**Goal**: Display aggregated interruption count and total time

**Independent Test**: Log interruptions during session, verify summary shows correct count and total time

### Implementation for User Story 4

- [x] T032 [US4] Add interruption summary section to DaySummaryCard.svelte
- [x] T033 [US4] Display total interruption count in DaySummaryCard.svelte
- [x] T034 [US4] Display total interruption time in DaySummaryCard.svelte
- [x] T035 [US4] Add positive messaging for zero interruptions in DaySummaryCard.svelte

**Checkpoint**: Interruption summary displays with correct metrics and appropriate messaging

---

## Phase 7: Integration (Analytics Dashboard)

**Purpose**: Create main dashboard container and integrate with main page

- [x] T036 Create src/lib/components/AnalyticsDashboard.svelte with props interface
- [x] T037 Add dashboard header with title and close button to AnalyticsDashboard.svelte
- [x] T038 Integrate DaySummaryCard component into AnalyticsDashboard.svelte
- [x] T039 Integrate ConcentrationScore component into AnalyticsDashboard.svelte
- [x] T040 Integrate TaskPerformanceList component into AnalyticsDashboard.svelte
- [x] T041 Add $derived reactive calculations from stores in AnalyticsDashboard.svelte
- [x] T042 Add empty state message when no session data in AnalyticsDashboard.svelte
- [x] T043 Add Tailwind styling and layout to AnalyticsDashboard.svelte

---

## Phase 8: Main Page Integration

**Purpose**: Add analytics button and panel to main application

- [x] T044 Import AnalyticsDashboard component in src/routes/+page.svelte
- [x] T045 Add isAnalyticsOpen state variable in src/routes/+page.svelte
- [x] T046 Add "Analytics" button to secondary controls in src/routes/+page.svelte
- [x] T047 Disable analytics button when session status is idle in src/routes/+page.svelte
- [x] T048 Add AnalyticsDashboard overlay panel in src/routes/+page.svelte
- [x] T049 Wire onClose handler to toggle analytics visibility in src/routes/+page.svelte

**Checkpoint**: Analytics panel accessible from main interface during and after sessions

---

## Phase 9: Polish & Documentation

**Purpose**: Edge cases, documentation, and final validation

- [x] T050 [P] Add edge case handling for zero work time in src/lib/services/analytics.ts
- [x] T051 [P] Add edge case handling for zero planned duration in src/lib/services/analytics.ts
- [x] T052 [P] Update docs/USER_GUIDE.md with "Viewing Analytics" section
- [x] T053 [P] Update docs/API.md with Analytics Service documentation
- [x] T054 [P] Update docs/DATA_SCHEMA.md with AnalyticsSummary and TaskPerformance types
- [x] T055 Run npm test && npm run lint to verify all tests pass
- [x] T056 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (types must exist for service)
- **User Stories (Phases 3-6)**: All depend on Foundational (analytics service)
  - US1 and US2 can proceed in parallel (different components)
  - US3 and US4 can proceed in parallel (different components)
- **Integration (Phase 7)**: Depends on US1, US2, US3, US4 components
- **Main Page (Phase 8)**: Depends on Integration (AnalyticsDashboard)
- **Polish (Phase 9)**: Can start after Phase 8

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Creates DaySummaryCard
- **User Story 2 (P1)**: Can start after Foundational - Creates ConcentrationScore
- **User Story 3 (P2)**: Can start after Foundational - Creates TaskPerformanceList
- **User Story 4 (P2)**: Depends on US1 - Adds to DaySummaryCard

### Parallel Opportunities

- T005-T008: All test files can be written in parallel
- T013-T018 and T019-T023: US1 and US2 can proceed in parallel
- T024-T031 and T032-T035: US3 and US4 can proceed in parallel (US4 depends on DaySummaryCard existing)
- T050-T054: All polish tasks can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch all test setup tasks together:
Task: "Create tests/unit/analytics.test.ts with test structure"
Task: "Add getConcentrationRating tests in tests/unit/analytics.test.ts"
Task: "Add calculateAnalyticsSummary tests in tests/unit/analytics.test.ts"
Task: "Add calculateTaskPerformance tests in tests/unit/analytics.test.ts"
```

## Parallel Example: User Stories 1 & 2

```bash
# After Foundational complete, launch US1 and US2 in parallel:
# Developer A (US1):
Task: "Create src/lib/components/DaySummaryCard.svelte with props interface"

# Developer B (US2):
Task: "Create src/lib/components/ConcentrationScore.svelte with props interface"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (analytics service with tests)
3. Complete Phase 3: User Story 1 (DaySummaryCard)
4. **STOP and VALIDATE**: Test day summary metrics independently
5. Can demo basic analytics with summary metrics only

### Incremental Delivery

1. Setup + Foundational → Analytics service ready
2. Add US1 (Day Summary) → Test independently → Demo
3. Add US2 (Concentration Score) → Test independently → Demo
4. Add US3 (Task Performance) → Test independently → Demo
5. Add US4 (Interruption Summary) → Test independently → Demo
6. Integration + Main Page → Full feature complete
7. Polish → Documentation and edge cases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Constitution IV requires tests before implementation (Phase 2)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US4 modifies DaySummaryCard from US1 - schedule accordingly
