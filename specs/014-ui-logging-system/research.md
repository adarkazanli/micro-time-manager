# Research: UI Logging System

**Feature**: 014-ui-logging-system
**Date**: 2026-01-03

## Overview

This document captures research decisions and patterns for implementing the UI logging system. No major unknowns existed in the Technical Context - the feature builds on established patterns in the codebase.

---

## Decision 1: Log Entry Storage Format

**Decision**: Use JSON array in localStorage with schema versioning, consistent with existing storage patterns.

**Rationale**:
- Matches existing pattern used by `tm_interruptions`, `tm_notes`, `tm_session`
- Storage service already handles JSON serialization/deserialization
- Schema versioning (CURRENT_SCHEMA_VERSION) enables future migrations
- Simple append-then-prune model for the 1000 entry limit

**Alternatives Considered**:
- IndexedDB: More storage capacity but adds complexity; localStorage sufficient for 1000 entries (~500KB max)
- Separate storage per action type: Complicates querying; single array is simpler for chronological view

---

## Decision 2: Log Entry ID Generation

**Decision**: Use `crypto.randomUUID()` for unique log entry IDs.

**Rationale**:
- Already used throughout codebase for taskId, sessionId, interruptionId, noteId
- Browser support is universal for target platforms
- Collision-free without coordination

**Alternatives Considered**:
- Timestamp-based ID: Risk of collision if multiple actions in same millisecond
- Auto-increment counter: Requires additional state management

---

## Decision 3: Logging Service Architecture

**Decision**: Create a dedicated `logging.ts` service module with a `logAction()` function that captures context automatically.

**Rationale**:
- Separation of concerns: logging logic isolated from UI handlers
- Consistent context capture (timestamp, session status, current task) in one place
- Easy to add/modify logging without touching every handler
- Mirrors pattern of existing services (storage.ts, timer.ts, export.ts)

**Alternatives Considered**:
- Inline logging in each handler: Leads to duplication and inconsistent context capture
- Store-based logging: logStore already manages state; service handles capture logic

---

## Decision 4: Real-time Log Viewer Updates

**Decision**: Use Svelte's reactive store pattern - LogViewer subscribes to logStore, which updates on each new entry.

**Rationale**:
- Natural fit with Svelte 5 runes reactivity
- logStore already exposes reactive state via `$state`
- No polling or manual refresh needed
- Matches pattern used by interruptionStore for InterruptionLog component

**Alternatives Considered**:
- Polling interval: Wastes resources and introduces latency
- Event-based pubsub: Adds complexity when store reactivity handles it

---

## Decision 5: Export Format

**Decision**: Export as JSON file with `.json` extension, pretty-printed for readability.

**Rationale**:
- JSON is structured and machine-readable for potential analysis
- Pretty-printing (2-space indent) makes it human-readable in text editors
- Single-file export is simpler than multi-format options
- Matches debugging use case (developer-focused)

**Alternatives Considered**:
- CSV: Loses nested structure of parameters field
- Plain text: Harder to parse programmatically if needed later
- Both JSON and text: YAGNI - one format sufficient for initial implementation

---

## Decision 6: Log Entry Pruning Strategy

**Decision**: Prune oldest entries when adding new entries that would exceed 1000 limit (FIFO).

**Rationale**:
- Simple and predictable behavior
- Recent logs are most relevant for debugging current issues
- Matches user expectation of "last 1000 entries"
- Single write operation (no separate cleanup task)

**Alternatives Considered**:
- LRU-based pruning: Complexity not justified for debugging logs
- Time-based expiry: Harder to reason about; count limit is clearer
- No limit (rely on localStorage quota): Could fill storage, affecting other app data

---

## Decision 7: Integration with SettingsPanel

**Decision**: Add "View Logs" button in SettingsPanel that opens LogViewer as a modal/dialog.

**Rationale**:
- Clarification confirmed: log viewer accessed via Settings panel
- Modal approach matches existing dialogs (EditInterruptionDialog, AddTaskDialog)
- Doesn't disrupt active tracking on the main page
- Can be opened/closed without navigation

**Alternatives Considered**:
- Separate route/page: Overkill for a debugging panel
- Floating button: Clarification rejected this (keeps UI clean)

---

## Best Practices Applied

### From Existing Codebase

1. **Store Pattern**: Follow `interruptionStore.svelte.ts` pattern for logStore
2. **Storage Service**: Extend `storage.ts` with `saveLogs()` / `loadLogs()` methods
3. **Type Definitions**: Add `LogEntry` type to `src/lib/types/index.ts`
4. **Component Testing**: Use `@testing-library/svelte` for LogViewer tests
5. **Error Handling**: Graceful degradation if localStorage fails (log to console, continue operating)

### Performance Considerations

1. **Batch Persistence**: Consider debouncing storage writes if many rapid actions
2. **Lazy Loading**: LogViewer only loads logs when opened (not on app mount)
3. **Virtual Scrolling**: Not needed initially for 1000 entries, but structure for future

---

## No Unresolved Clarifications

All technical decisions are resolved. Ready for Phase 1 design.
