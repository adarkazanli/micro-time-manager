# Research: Note Capture

**Feature**: 005-note-capture
**Date**: 2025-12-19

## Overview

This document captures research findings for the note capture feature implementation.

## Research Topics

### 1. Keyboard Shortcut Implementation

**Decision**: Use `keydown` event listener on `window` with platform detection for Ctrl/Cmd

**Rationale**:
- Svelte's `on:keydown` directive on window provides clean event handling
- `navigator.platform` or `navigator.userAgentData` can detect macOS for Cmd key
- Matches pattern used in existing codebase for keyboard shortcuts (I/R for interruptions)

**Alternatives Considered**:
- `svelte:window` binding - Selected (cleaner Svelte integration)
- Document-level event listener - Rejected (less Svelte-idiomatic)
- Third-party library (hotkeys-js) - Rejected (violates constitution V: YAGNI)

**Implementation Pattern**:
```typescript
function handleKeydown(event: KeyboardEvent) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? event.metaKey : event.ctrlKey;

  if (modifier && event.key === 'n') {
    event.preventDefault();
    openNoteInput();
  }
}
```

### 2. Inline Input UX Pattern

**Decision**: Conditionally rendered input at top of day tracking view with auto-focus

**Rationale**:
- Inline input aligns with clarified requirement (not modal)
- Top placement ensures visibility regardless of scroll position
- Auto-focus enables immediate typing without mouse interaction
- Minimal DOM changes = fast perceived performance

**Alternatives Considered**:
- Floating input (fixed position) - Rejected (can obscure content)
- Expanding current task card - Rejected (ties to specific view state)
- Toast-style popover - Rejected (may feel disconnected from context)

**Implementation Pattern**:
```svelte
{#if isNoteInputOpen}
  <div class="note-input-container" transition:slide={{ duration: 150 }}>
    <NoteInput
      onSave={handleSaveNote}
      onCancel={() => isNoteInputOpen = false}
    />
  </div>
{/if}
```

### 3. Search Implementation

**Decision**: Client-side case-insensitive substring matching with reactive filtering

**Rationale**:
- All notes in localStorage = no network latency
- Typical volume (10-50 notes) doesn't require indexing
- Reactive filter via Svelte derived state = automatic UI updates
- Case-insensitive matches user expectations for search

**Alternatives Considered**:
- Full-text search library (Fuse.js) - Rejected (overkill for scale, bundle size)
- Regex-based search - Rejected (complexity without benefit)
- Exact match only - Rejected (poor UX)

**Implementation Pattern**:
```typescript
const filteredNotes = $derived.by(() => {
  let result = notes;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(n => n.content.toLowerCase().includes(query));
  }

  if (taskFilter) {
    result = result.filter(n => n.taskId === taskFilter);
  }

  return result;
});
```

### 4. Character Counter UX

**Decision**: Display remaining characters, change color at thresholds

**Rationale**:
- "X remaining" is more actionable than "Y/500"
- Color feedback (gray → yellow → red) provides progressive warning
- Matches UX patterns users expect from Twitter/SMS-style inputs

**Alternatives Considered**:
- Character count only - Rejected (less immediate feedback)
- Progress bar - Rejected (overkill for text input)
- No counter until near limit - Rejected (surprise truncation)

**Thresholds**:
- Gray: >50 remaining
- Yellow: 10-50 remaining
- Red: <10 remaining

### 5. Notes View Access Pattern

**Decision**: Toggle button/icon in main toolbar, opens slide-in panel

**Rationale**:
- Consistent with existing patterns (not a modal, not a separate page)
- Panel can show notes while keeping context visible
- Toggle allows quick access/dismiss

**Alternatives Considered**:
- Separate route/page - Rejected (loses task context)
- Modal dialog - Rejected (contradicts inline clarification spirit)
- Accordion in sidebar - Rejected (no sidebar in current design)

### 6. Storage Schema Extension

**Decision**: Add `tm_notes` key to localStorage, increment schema version to 4

**Rationale**:
- Follows established pattern from interruptions (schema v2→3)
- Separate key allows independent clearing without affecting other data
- Migration initializes empty array if missing

**Schema Version**: 3 → 4
- Add `tm_notes` key (initialize as empty array)
- No transformation of existing data

### 7. Timestamp Format

**Decision**: ISO 8601 strings for storage, formatted relative time for display

**Rationale**:
- ISO strings match existing patterns (interruptions, session)
- Relative time ("2 min ago", "Today 10:30") more scannable than absolute
- Can show full timestamp on hover/long-press for precision

**Display Logic**:
- <1 hour: "X min ago"
- Same day: "Today HH:MM"
- Yesterday: "Yesterday HH:MM"
- Older: "MMM DD HH:MM"

## Integration Points

### With sessionStore
- Read current task ID for auto-association
- Clear notes when session resets (configurable?)
- Restore notes on session recovery

### With storage service
- Add saveNotes() method
- Add loadNotes() method
- Add clearNotes() method
- Update schema migration logic (v3→v4)

### With +page.svelte
- Add keyboard listener for Ctrl/Cmd+N
- Render NoteInput conditionally
- Add Notes toggle button to toolbar area
- Render NotesView panel when open

## Unresolved Items

None - all technical decisions resolved.

## References

- Existing pattern: `interruptionStore.svelte.ts` for store structure
- Existing pattern: `storage.ts` for localStorage wrapper
- Existing pattern: `InterruptionLog.svelte` for list display component
