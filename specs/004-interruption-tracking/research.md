# Research: Interruption Tracking

**Feature**: 004-interruption-tracking
**Date**: 2025-12-19

## Overview

This document captures research findings for implementing interruption tracking in the Micro Time Manager application.

## Research Areas

### 1. Timer Coordination Strategy

**Decision**: Pause existing task timer, start separate interruption timer

**Rationale**:
- Keeps task elapsed time accurate (excludes interruption time)
- Allows independent tracking of interruption duration
- Follows existing timerStore pattern - create a parallel interruptionTimer that uses the same `createTimer` service

**Alternatives Considered**:
- Single timer with state flag: Rejected - complicates elapsed time calculation
- Accumulate interruption time in task: Rejected - loses granular interruption data

### 2. State Management Architecture

**Decision**: New `interruptionStore.svelte.ts` following existing store patterns

**Rationale**:
- Consistent with sessionStore and timerStore patterns
- Uses Svelte 5 runes ($state, $derived)
- Keeps interruption logic isolated from task/session logic
- Coordinates with timerStore via method calls (not shared state)

**Implementation Approach**:
```typescript
// interruptionStore manages:
// - isInterrupted: boolean
// - activeInterruption: Interruption | null
// - interruptions: Interruption[] (per session)
// - interruptionTimer: elapsed ms for current interruption

// Coordination:
// startInterruption() -> timerStore.stop() (pause task)
// endInterruption() -> timerStore.start(duration, elapsed) (resume task)
```

### 3. Data Persistence Strategy

**Decision**: Extend existing storage service with interruption methods

**Rationale**:
- Maintains single source of truth for localStorage access
- Follows existing pattern (saveSession, getSession, etc.)
- Schema version increment (v2 → v3) for migration safety

**Storage Keys**:
- `tm_interruptions` - Array of interruption records
- Stored with session, cleared on session reset

### 4. Keyboard Shortcut Implementation

**Decision**: Global keydown listener in +page.svelte with conditional activation

**Rationale**:
- Consistent with how app already handles global interactions
- "I" and "R" are intuitive (Interrupt/Resume)
- Only active when task is running (I) or interruption is active (R)
- Must not trigger when typing in input fields

**Implementation**:
```typescript
function handleKeydown(e: KeyboardEvent) {
  // Skip if in input/textarea
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

  if (e.key.toLowerCase() === 'i' && sessionStore.isActive && !interruptionStore.isInterrupted) {
    handleInterrupt();
  }
  if (e.key.toLowerCase() === 'r' && interruptionStore.isInterrupted) {
    handleResume();
  }
}
```

### 5. Interruption Categories

**Decision**: Fixed enum with 5 categories: Phone, Luci, Colleague, Personal, Other

**Rationale**:
- User-specified categories cover their use cases
- "Luci" is a custom category for this user (person/pet)
- "Other" provides catch-all
- Fixed list simplifies UI (radio buttons or segmented control)

**Type Definition**:
```typescript
export type InterruptionCategory = 'Phone' | 'Luci' | 'Colleague' | 'Personal' | 'Other';
```

### 6. UI Component Strategy

**Decision**: Four new components + modification to existing page

**Components**:
1. `InterruptButton.svelte` - Toggle button showing "Interrupt" or "Resume"
2. `InterruptionTimer.svelte` - Shows elapsed interruption time (when active)
3. `InterruptionSummary.svelte` - Shows count + total time for current task
4. `EditInterruptionDialog.svelte` - Modal for editing category/note after resume

**Integration Points**:
- InterruptButton added to TaskControls area (timer-column)
- InterruptionTimer shown in timer-section when interrupted
- InterruptionSummary shown below lag-section
- EditInterruptionDialog opened after resume (optional quick tap to edit)

### 7. Edit Flow After Resume

**Decision**: Show small "Edit" link/button next to most recent interruption in summary

**Rationale**:
- Per clarification: Immediate resume (no dialog on resume)
- User can tap "Edit" to add category/note within a few seconds
- Non-blocking flow maintains <3 second resume target

**UX Flow**:
1. User clicks Resume → task timer resumes immediately
2. Interruption appears in summary with "Edit" link
3. User can click Edit to open EditInterruptionDialog
4. Dialog allows category selection and note entry
5. Save updates the interruption record

### 8. Edge Case Handling

**Decision**: Auto-end interruptions on task/session completion

**Scenarios**:
- Task completed while interrupted → Auto-end interruption, record it, then complete task
- Session ended while interrupted → Auto-end interruption, record it, then end session
- Page navigation while interrupted → State persisted to localStorage, timer continues on return
- Very short interruptions (<5s) → Still recorded (user explicitly triggered)

**Implementation**: Check `interruptionStore.isInterrupted` in `completeTask()` and `endDay()` methods

## Best Practices Applied

### From Existing Codebase

1. **Store Pattern**: Follow timerStore/sessionStore pattern with getters and methods
2. **Type Safety**: All entities typed in `types/index.ts`
3. **Service Isolation**: Storage operations through storage service
4. **Component Props**: Explicit TypeScript interfaces for component props
5. **Test Coverage**: Unit tests for store logic, e2e for user flows

### From Constitution

1. **Performance**: Reuse existing `createTimer` service with performance.now()
2. **Offline-First**: All data in localStorage, no network calls
3. **Simplicity**: Minimal new abstractions, extend existing patterns
4. **Documentation**: Update API.md, USER_GUIDE.md, DATA_SCHEMA.md

## Dependencies

No new external dependencies required. Uses:
- Existing `createTimer` service
- Existing storage service patterns
- Existing Svelte 5 runes syntax
- Existing Tailwind CSS utilities

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Timer coordination bugs | Comprehensive unit tests for start/stop sequences |
| State sync between stores | Clear API contract; stores communicate via methods only |
| Keyboard shortcuts conflicting | Guard with isActive checks; skip when in inputs |
| localStorage quota | Interruption data is small; session-scoped cleanup |
