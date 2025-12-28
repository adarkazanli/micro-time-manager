# Tasks: Mobile Responsive Design

**Input**: Design documents from `/specs/013-mobile-responsive/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: E2E tests included as this is a UI feature requiring viewport validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Based on plan.md: SvelteKit project with components in `src/lib/components/`

---

## Phase 1: Setup (Foundation Styles)

**Purpose**: Add base responsive styles and viewport configuration

- [ ] T001 Verify viewport meta tag exists in src/app.html (width=device-width, initial-scale=1)
- [ ] T002 Add responsive CSS variables to src/app.css (touch-target-min, mobile-padding, timer sizes)
- [ ] T003 [P] Create touch detection utility in src/lib/utils/touch.ts (isTouchDevice derived)

---

## Phase 2: Foundational (Main Layout)

**Purpose**: Main page layout responsive adjustments - MUST complete before component work

**⚠️ CRITICAL**: These layout changes affect all user stories

- [ ] T004 Add responsive layout classes to src/routes/+page.svelte (single-column mobile, padding adjustments)
- [ ] T005 [P] Add base responsive text sizing to body/html in src/app.css (16px min on mobile)

**Checkpoint**: Base responsive layout ready - component work can now begin

---

## Phase 3: User Story 1 - Mobile Task Tracking (Priority: P1) 🎯 MVP

**Goal**: Users can view and interact with task list on mobile with readable text and touch-friendly targets

**Independent Test**: Open app at 375px viewport width, verify all tasks visible in single column with no horizontal scroll

### E2E Tests for User Story 1

- [ ] T006 [P] [US1] Create mobile viewport test scaffold in tests/e2e/mobile-responsive.test.ts
- [ ] T007 [P] [US1] Add test: task list displays in single column at 375px viewport
- [ ] T008 [P] [US1] Add test: no horizontal scroll at 320px viewport width

### Implementation for User Story 1

- [ ] T009 [P] [US1] Add responsive layout to ImpactPanel.svelte (full width mobile, single column)
- [ ] T010 [P] [US1] Add responsive typography to TimerDisplay.svelte (text-2xl mobile → text-4xl desktop)
- [ ] T011 [US1] Add responsive row layout to ImpactTaskRow.svelte (44px min height, truncate task name)
- [ ] T012 [US1] Add responsive layout to TaskRow.svelte (44px height, hide duration on mobile)
- [ ] T013 [US1] Add responsive layout to SchedulePreview.svelte (full width, max-height 60vh mobile)

**Checkpoint**: Task list displays correctly on mobile - core MVP complete

---

## Phase 4: User Story 2 - Mobile Schedule Impact Viewing (Priority: P1)

**Goal**: Users can view Impact Panel with projected times and risk indicators on mobile

**Independent Test**: View Impact Panel at 375px, verify projected times, task names, and risk colors are visible

### E2E Tests for User Story 2

- [ ] T014 [P] [US2] Add test: Impact Panel shows task name, time, status at 375px viewport

### Implementation for User Story 2

- [ ] T015 [US2] Add responsive status indicators to ImpactTaskRow.svelte (icon only on mobile)
- [ ] T016 [US2] Add responsive risk indicator styling in ImpactTaskRow.svelte (bolder colors on mobile)
- [ ] T017 [US2] Ensure projected time display adapts in ImpactTaskRow.svelte (stack below name if needed)

**Checkpoint**: Impact Panel fully readable on mobile

---

## Phase 5: User Story 3 - Mobile Task Actions (Priority: P2)

**Goal**: Users can start, complete, and manage tasks with touch-friendly controls

**Independent Test**: Tap a task row on mobile, verify action buttons appear with 44px touch targets

### E2E Tests for User Story 3

- [ ] T018 [P] [US3] Add test: tap task row reveals action buttons on mobile
- [ ] T019 [P] [US3] Add test: action buttons have 44px minimum touch targets

### Implementation for User Story 3

- [ ] T020 [US3] Add tap-to-reveal state to ImpactTaskRow.svelte (expandedRowId, toggle on tap)
- [ ] T021 [US3] Add conditional action button rendering in ImpactTaskRow.svelte (show on tap for mobile)
- [ ] T022 [US3] Add 44px touch targets to action buttons in ImpactTaskRow.svelte (min-h-11 min-w-11)
- [ ] T023 [US3] Add touch-and-hold drag activation to ImpactTaskRow.svelte (500ms delay, touchstart/end/move)
- [ ] T024 [US3] Add active state feedback to buttons in ImpactTaskRow.svelte (active:scale-95, active:bg-*)
- [ ] T025 [P] [US3] Add responsive button sizing to TaskControls.svelte (44px on mobile)

**Checkpoint**: All task actions work smoothly on touch devices

---

## Phase 6: User Story 4 - Mobile Warnings and Alerts (Priority: P2)

**Goal**: Schedule conflicts, overflow warnings, and alerts display clearly on mobile

**Independent Test**: Create schedule conflict, view warning banner at 375px - should be readable

### E2E Tests for User Story 4

- [ ] T026 [P] [US4] Add test: conflict warning banner visible and readable at 375px viewport

### Implementation for User Story 4

- [ ] T027 [P] [US4] Add responsive layout to ConflictWarning.svelte (full width, increased padding, 44px dismiss button)
- [ ] T028 [P] [US4] Add responsive layout to FixedTaskWarning.svelte (full width, larger risk icon)
- [ ] T029 [P] [US4] Add responsive layout to ScheduleOverflowWarning.svelte (visible badge, 16px min text)
- [ ] T030 [US4] Add tap-to-expand for overflow details in ScheduleOverflowWarning.svelte (mobile-only)

**Checkpoint**: All warnings and alerts clearly visible on mobile

---

## Phase 7: User Story 5 - Tablet and Landscape Support (Priority: P3)

**Goal**: Layout optimized for tablet (768-1024px) and landscape orientation

**Independent Test**: View app at 768px and 1024px widths, verify layout uses space effectively

### E2E Tests for User Story 5

- [ ] T031 [P] [US5] Add test: layout adapts appropriately at 768px (tablet) viewport
- [ ] T032 [P] [US5] Add test: layout works in landscape (896x414 viewport)

### Implementation for User Story 5

- [ ] T033 [P] [US5] Add tablet breakpoint adjustments to ImpactPanel.svelte (md: classes)
- [ ] T034 [P] [US5] Add tablet breakpoint adjustments to SchedulePreview.svelte (md: max-height 70vh)
- [ ] T035 [P] [US5] Add responsive form layout to AddTaskDialog.svelte (full screen mobile, centered tablet+)
- [ ] T036 [P] [US5] Add responsive form layout to EditTaskDialog.svelte (full screen mobile, centered tablet+)
- [ ] T037 [P] [US5] Add responsive layout to SettingsPanel.svelte (single column mobile, two columns tablet)
- [ ] T038 [P] [US5] Add responsive chart layout to AnalyticsDashboard.svelte (stacked mobile, grid tablet)
- [ ] T039 [P] [US5] Add responsive button sizing to ExportButton.svelte (icon only mobile, full text tablet)
- [ ] T040 [P] [US5] Add responsive button sizing to FileUploader.svelte (compact mobile, full tablet)

**Checkpoint**: App looks great on tablet and in landscape mode

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting all user stories

- [ ] T041 [P] Add mobile usage notes to docs/USER_GUIDE.md
- [ ] T042 Run Lighthouse mobile audit and verify score 90+ (SC-001)
- [ ] T043 Audit all interactive elements for 44px touch targets (SC-002)
- [ ] T044 Test horizontal scroll at 320px, 375px, 414px viewports (SC-003)
- [ ] T044a Test timer visibility when mobile keyboard opens (verify timer not hidden by keyboard)
- [ ] T045 Run existing e2e tests to ensure no regressions
- [ ] T046 Run npm test && npm run lint to verify code quality

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority - complete US1 first as MVP, then US2
  - US3 and US4 are P2 - can proceed after US1/US2 or in parallel
  - US5 is P3 - complete after core mobile stories
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **User Story 2 (P1)**: Can start after Foundational - Independent of US1 but same priority
- **User Story 3 (P2)**: Can start after Foundational - Builds on ImpactTaskRow from US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Independent warning components
- **User Story 5 (P3)**: Can start after Foundational - Independent tablet/landscape adjustments

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Layout changes before interaction changes
- Core component changes before dependent components
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003 can run in parallel (Phase 1)
- T004, T005 can run in parallel (Phase 2)
- T006, T007, T008 tests can run in parallel (Phase 3)
- T009, T010 component updates can run in parallel (Phase 3)
- All US4 warning component tasks (T027-T029) can run in parallel
- All US5 tasks (T033-T040) can run in parallel (different files)

---

## Parallel Example: User Story 5

```bash
# Launch all User Story 5 tasks together (all different files):
Task: "Add tablet breakpoint adjustments to ImpactPanel.svelte"
Task: "Add tablet breakpoint adjustments to SchedulePreview.svelte"
Task: "Add responsive form layout to AddTaskDialog.svelte"
Task: "Add responsive form layout to EditTaskDialog.svelte"
Task: "Add responsive layout to SettingsPanel.svelte"
Task: "Add responsive chart layout to AnalyticsDashboard.svelte"
Task: "Add responsive button sizing to ExportButton.svelte"
Task: "Add responsive button sizing to FileUploader.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T013)
4. **STOP and VALIDATE**: Test at 375px and 320px viewports
5. Demo/deploy if ready - app is now mobile-usable!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (Core mobile MVP!)
3. Add User Story 2 → Test independently → Deploy (Full P1 complete)
4. Add User Story 3 → Test independently → Deploy (Touch interactions)
5. Add User Story 4 → Test independently → Deploy (Warnings visible)
6. Add User Story 5 → Test independently → Deploy (Tablet support)
7. Polish phase → Final validation → Release

### Component Modification Summary

| Component | User Stories | Complexity |
|-----------|-------------|------------|
| ImpactPanel.svelte | US1, US5 | Medium |
| ImpactTaskRow.svelte | US1, US2, US3 | High (most changes) |
| TimerDisplay.svelte | US1 | Low |
| TaskRow.svelte | US1 | Low |
| SchedulePreview.svelte | US1, US5 | Low |
| ConflictWarning.svelte | US4 | Low |
| FixedTaskWarning.svelte | US4 | Low |
| ScheduleOverflowWarning.svelte | US4 | Low |
| TaskControls.svelte | US3 | Low |
| AddTaskDialog.svelte | US5 | Medium |
| EditTaskDialog.svelte | US5 | Medium |
| SettingsPanel.svelte | US5 | Medium |
| AnalyticsDashboard.svelte | US5 | Medium |
| ExportButton.svelte | US5 | Low |
| FileUploader.svelte | US5 | Low |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- ImpactTaskRow.svelte is the most complex - requires careful attention in US1, US2, US3
