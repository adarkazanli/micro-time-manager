# Research: Ad-Hoc Task Creation

**Feature**: 009-ad-hoc-tasks
**Date**: 2025-12-20

## Research Questions

### R1: How to extend ConfirmedTask type for ad-hoc tracking?

**Decision**: Add optional `isAdHoc?: boolean` property to ConfirmedTask interface

**Rationale**:
- Optional property maintains backward compatibility with existing tasks
- Boolean flag is the simplest approach (vs. separate type or union)
- Spec explicitly states: "AdHocTask extends ConfirmedTask with isAdHoc: boolean flag"
- Existing tasks default to `undefined`/`false` (imported from file)
- New ad-hoc tasks explicitly set `isAdHoc: true`

**Alternatives Considered**:
- Separate `AdHocTask` type: Rejected - would require type guards throughout codebase
- `source: 'imported' | 'ad-hoc'` enum: Rejected - more verbose for a binary distinction

### R2: How to insert ad-hoc tasks at correct position?

**Decision**: Calculate insertion index based on task type and current session state

**Rationale**:
- **Fixed tasks**: Insert based on `plannedStart` time, maintaining chronological order among fixed tasks
- **Flexible tasks**: Insert immediately after current task (before other pending flexible tasks)
- Existing `reorderTasks()` method handles sortOrder updates
- Projection service automatically recalculates when task list changes

**Implementation Pattern** (from existing codebase):
```typescript
// For flexible: insert after currentTaskIndex
const insertIndex = session.currentTaskIndex + 1;

// For fixed: find correct position based on plannedStart
const insertIndex = tasks.findIndex(t =>
  t.type === 'fixed' && t.plannedStart > newTask.plannedStart
);
```

**Alternatives Considered**:
- Always insert at end: Rejected - violates FR-006 (correct positioning)
- Let user choose position: Rejected - adds complexity, unclear benefit

### R3: What validation is needed for ad-hoc task creation?

**Decision**: Reuse existing validation patterns from EditTaskDialog and parser

**Rationale**:
- Task name: Required, 1-200 characters (MAX_TASK_NAME_LENGTH constant)
- Duration: Required, parsed via `parseDuration()` utility, must be > 0 and ≤ 86400 (MAX_DURATION_SECONDS)
- Start time (fixed only): Required when type is 'fixed', uses HTML5 time input
- Type: Defaults to 'flexible', switches to 'fixed' when start time entered (per clarification Q1)

**Warning Validations** (allow creation with warning):
- FR-013: Fixed task with past start time → show warning, mark as missed potential
- FR-014: Fixed task overlapping another fixed task → show conflict warning

**Alternatives Considered**:
- Block past time / overlap creation: Rejected - spec says "warn but allow"
- Real-time validation: Rejected - overengineering for simple form

### R4: How to implement keyboard shortcut (Ctrl/Cmd + T)?

**Decision**: Global keydown listener on +page.svelte with proper focus management

**Rationale**:
- Assumption in spec: "keyboard shortcut follows existing patterns (Ctrl/Cmd + T)"
- +page.svelte already handles global state and dialog management
- Use `event.metaKey` for Mac, `event.ctrlKey` for Windows/Linux
- Prevent default browser behavior (Ctrl+T opens new tab in some browsers)
- Only activate when session is running (FR-016)

**Implementation Pattern**:
```typescript
function handleGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 't') {
    event.preventDefault();
    if (sessionStore.isActive) {
      showAddTaskDialog = true;
    }
  }
}
```

**Alternatives Considered**:
- svelte:window in AddTaskDialog: Rejected - component may not be mounted
- Different shortcut (Ctrl+N): Rejected - spec explicitly says Ctrl/Cmd+T

### R5: How to handle storage serialization for isAdHoc field?

**Decision**: Extend SerializedTask interface in storage.ts with optional isAdHoc

**Rationale**:
- Storage service already has serialize/deserialize pattern for ConfirmedTask
- Optional field is backward compatible (existing stored tasks work without migration)
- No schema version bump needed (optional property addition)

**Implementation Pattern**:
```typescript
interface SerializedTask {
  // ... existing fields
  isAdHoc?: boolean;  // NEW: Optional for backward compatibility
}

function serializeTask(task: ConfirmedTask): SerializedTask {
  return {
    // ... existing fields
    isAdHoc: task.isAdHoc ?? false
  };
}
```

**Alternatives Considered**:
- Schema migration v5→v6: Rejected - optional field doesn't require migration
- Separate storage for ad-hoc tasks: Rejected - complicates session management

### R6: How to distinguish ad-hoc tasks in analytics/export?

**Decision**: Filter tasks by `isAdHoc` flag in analytics service and export service

**Rationale**:
- FR-010: Ad-hoc tasks contribute to analytics
- FR-011: Exports must mark ad-hoc tasks separately
- US4: Analytics should show planned vs. unplanned task counts

**Analytics Implementation**:
```typescript
// In AnalyticsSummary computation
const adHocCount = tasks.filter(t => t.isAdHoc).length;
const importedCount = tasks.filter(t => !t.isAdHoc).length;
```

**Export Implementation**:
- Excel: Add "Source" column with "Imported" or "Ad-Hoc" values
- CSV: Same column addition

**Alternatives Considered**:
- Separate export files for ad-hoc: Rejected - fragments user experience
- Group ad-hoc tasks together: Rejected - preserves chronological order better

### R7: What UI pattern for Add Task button placement?

**Decision**: Add "Add Task" button in ImpactPanel header, visible only during active session

**Rationale**:
- ImpactPanel is the primary schedule view during day execution
- FR-016: Button only enabled during active session
- US3: Non-disruptive access - button in consistent location
- EditTaskDialog provides visual pattern reference for dialog styling

**Implementation**:
```svelte
<!-- In ImpactPanel.svelte header -->
{#if sessionActive}
  <button onclick={() => showAddTaskDialog = true}>
    + Add Task
  </button>
{/if}
```

**Alternatives Considered**:
- FAB (floating action button): Rejected - inconsistent with existing UI patterns
- In CurrentTask component: Rejected - less discoverable, clutters task view

## Dependencies Identified

| Dependency | Purpose | Notes |
|------------|---------|-------|
| `parseDuration()` | Parse user duration input | Existing utility in utils/duration.ts |
| `formatDuration()` | Display duration in form | Existing utility in utils/duration.ts |
| `sessionStore.addTask()` | Add task to session | NEW method to implement |
| `storage.saveTasks()` | Persist with isAdHoc field | Extend existing serialization |
| `projection service` | Recalculate schedule | No changes needed - reactive |

## Integration Points

1. **Type System**: Add `isAdHoc?: boolean` to `ConfirmedTask` in types/index.ts
2. **Store Layer**: Add `addTask()` method to sessionStore.svelte.ts
3. **Storage Layer**: Extend serialize/deserialize in storage.ts
4. **UI Layer**: New AddTaskDialog.svelte component
5. **Main Page**: Keyboard shortcut handler in +page.svelte
6. **Analytics**: Filter by isAdHoc in analytics.ts
7. **Export**: Add Source column in export.ts

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Keyboard shortcut conflicts with browser | Medium | Low | Use event.preventDefault(), document behavior |
| Complex dialog slows creation | Low | Medium | Minimal required fields, smart defaults |
| Projection performance with many ad-hoc | Low | Low | Existing projection handles 50 tasks fine |

## Conclusion

All research questions resolved. Implementation follows existing patterns with minimal new abstractions:
- Single optional field addition to ConfirmedTask type
- New store method `addTask()` mirrors existing `updateTask()` pattern
- New dialog component follows EditTaskDialog patterns
- No schema migration needed (backward compatible)
