# Feature Specification: Analytics Dashboard

**Feature Branch**: `006-analytics-dashboard`
**Created**: 2025-12-19
**Status**: Draft
**Input**: User description: "Viewing Analytics with concentration score, metrics, and task performance"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Day Summary Metrics (Priority: P1)

As a user who has completed tasks during my work day, I want to see a summary of my overall performance metrics so that I can understand how effectively I used my time.

**Why this priority**: This is the core value proposition of analytics - providing users immediate insight into their day's productivity. Without summary metrics, there's no analytics feature.

**Independent Test**: Can be fully tested by completing at least one task and viewing the analytics panel. Delivers immediate value by showing total planned time, actual time, and task completion rate.

**Acceptance Scenarios**:

1. **Given** a user has completed at least one task, **When** they open the analytics view, **Then** they see total planned time, total actual time, tasks completed count, and schedule adherence percentage.
2. **Given** a user has not started any tasks, **When** they attempt to view analytics, **Then** they see a message indicating no data is available yet.
3. **Given** a user has tasks in progress, **When** they view analytics, **Then** they see real-time metrics that update as the session progresses.

---

### User Story 2 - View Concentration Score (Priority: P1)

As a user who wants to improve my focus, I want to see my concentration score calculated from work time and interruption time so that I can track my ability to stay focused.

**Why this priority**: The concentration score is a key differentiating metric that provides actionable insight into focus quality, directly supporting the app's core purpose of time management.

**Independent Test**: Can be fully tested by completing tasks with and without interruptions, then viewing the concentration score with its rating label.

**Acceptance Scenarios**:

1. **Given** a user has logged work time with interruptions, **When** they view their concentration score, **Then** they see a percentage calculated as (Work Time - Interruption Time) / Work Time × 100.
2. **Given** a concentration score of 90% or higher, **When** displayed, **Then** it shows an "Excellent" rating.
3. **Given** a concentration score between 80-89%, **When** displayed, **Then** it shows a "Good" rating.
4. **Given** a concentration score between 70-79%, **When** displayed, **Then** it shows a "Fair" rating.
5. **Given** a concentration score below 70%, **When** displayed, **Then** it shows a "Needs improvement" rating.
6. **Given** a user has no interruptions logged, **When** they view concentration score, **Then** they see 100% with "Excellent" rating.

---

### User Story 3 - View Task Performance Details (Priority: P2)

As a user who wants to improve my time estimation, I want to see detailed performance metrics for each task so that I can identify which tasks took longer or shorter than planned.

**Why this priority**: Task-level details help users improve future planning. This builds on the summary metrics but provides granular insights.

**Independent Test**: Can be fully tested by completing multiple tasks and viewing individual task metrics showing planned vs actual duration and variance.

**Acceptance Scenarios**:

1. **Given** a user has completed multiple tasks, **When** they view task performance, **Then** they see a list of all tasks with planned duration, actual duration, and variance for each.
2. **Given** a task took longer than planned, **When** displayed, **Then** the variance shows as positive (over time) with appropriate visual indication.
3. **Given** a task took less time than planned, **When** displayed, **Then** the variance shows as negative (under time) with appropriate visual indication.
4. **Given** a task had interruptions, **When** viewing task performance, **Then** they see the interruption count and total interruption time for that task.

---

### User Story 4 - View Interruption Summary (Priority: P2)

As a user who wants to reduce distractions, I want to see aggregated interruption metrics so that I can understand my interruption patterns.

**Why this priority**: Interruption insights help users identify focus problems. Builds on existing interruption data to provide actionable summary.

**Independent Test**: Can be fully tested by logging interruptions during a session and viewing the interruption count and total time in analytics.

**Acceptance Scenarios**:

1. **Given** a user has logged interruptions, **When** they view analytics, **Then** they see total interruption count and total interruption time.
2. **Given** a user has no interruptions, **When** they view interruption metrics, **Then** they see zero count and zero time with positive messaging.

---

### Edge Cases

- What happens when a user views analytics with no completed tasks? Display empty state with guidance message.
- What happens when work time is zero (no tasks completed)? Concentration score displays as "—" (em dash) with tooltip "Complete a task to see your concentration score".
- How does system handle tasks with zero planned duration? Variance calculation treats as infinite variance, displayed as "N/A".
- What happens when all tasks are still pending? Show planned totals only, with actual metrics showing zero/empty.
- How are in-progress tasks handled in calculations? Include elapsed time for current task in totals, clearly marked as "in progress".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate and display total planned time as the sum of all task durations.
- **FR-002**: System MUST calculate and display total actual time as the sum of time spent on all tasks (completed and in-progress).
- **FR-003**: System MUST calculate and display tasks completed as a count and ratio (e.g., "5 of 8").
- **FR-004**: System MUST calculate schedule adherence as a percentage comparing actual vs planned time.
- **FR-005**: System MUST calculate concentration score using the formula: (Work Time - Interruption Time) / Work Time × 100.
- **FR-006**: System MUST display concentration score with a rating label based on defined thresholds (Excellent: 90%+, Good: 80-89%, Fair: 70-79%, Needs improvement: <70%).
- **FR-007**: System MUST display total interruption count across all tasks.
- **FR-008**: System MUST display total interruption time across all tasks.
- **FR-009**: System MUST display per-task performance metrics including planned duration, actual duration, and variance.
- **FR-010**: System MUST display per-task interruption count and time.
- **FR-011**: System MUST provide visual differentiation for over-time (positive variance) vs under-time (negative variance).
- **FR-012**: System MUST handle edge cases gracefully with appropriate empty states and explanatory messages.
- **FR-013**: System MUST update metrics in real-time as the session progresses.
- **FR-014**: System MUST be accessible from the main interface during and after a work session.

### Key Entities

- **DaySummary**: Aggregated metrics for the entire work session including total planned time, total actual time, tasks completed count, schedule adherence percentage, concentration score, total interruption count, and total interruption time.
- **TaskPerformance**: Per-task metrics including task reference, planned duration, actual duration, variance (over/under), interruption count for task, and interruption time for task.
- **ConcentrationRating**: Classification of concentration score into rating tiers (Excellent, Good, Fair, Needs improvement) with associated thresholds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their day summary metrics within 1 second of opening the analytics panel.
- **SC-002**: Concentration score calculation matches the defined formula with 100% accuracy.
- **SC-003**: All metrics update in real-time (within 1 second) as the user completes tasks or logs interruptions.
- **SC-004**: 100% of edge cases display appropriate empty states rather than errors or broken UI.
- **SC-005**: Users can identify their best and worst performing tasks within 5 seconds of viewing task performance.
- **SC-006**: Analytics are viewable both during an active session and after session completion.

## Assumptions

- Analytics are calculated from data already captured by existing features (task tracking, interruption logging).
- The analytics view is a panel or section within the existing application, not a separate page.
- Historical analytics (multi-day trends) are out of scope for this feature.
- Export functionality for analytics data is handled by a separate feature.
- Work time is defined as total actual task time, not wall clock time.
- Interruption time is already being tracked by the interruption tracking feature.
