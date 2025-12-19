# Quickstart: Note Capture

**Feature**: 005-note-capture
**Date**: 2025-12-19

## Overview

This guide provides step-by-step instructions for implementing the note capture feature. Follow the tasks in order as each builds on the previous.

## Prerequisites

- Completed features: 001-schedule-import, 002-day-tracking, 003-impact-panel, 004-interruption-tracking
- Branch: `005-note-capture` (created from main)
- All tests passing: `npm test`

## Implementation Order

### Phase 1: Foundation

#### Task 1: Add Note Types (src/lib/types/index.ts)

Add the Note interface and constants:

```typescript
// Add to types/index.ts

/** A quick note captured during task execution */
export interface Note {
  noteId: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  taskId: string | null;
}

/** localStorage key for notes */
export const STORAGE_KEY_NOTES = 'tm_notes';

/** Maximum note content length */
export const MAX_NOTE_LENGTH = 500;

/** Update schema version */
export const CURRENT_SCHEMA_VERSION = 4; // was 3
```

#### Task 2: Extend Storage Service (src/lib/services/storage.ts)

Add note persistence methods:

```typescript
// Add migration v3→v4
function migrateV3toV4(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOTES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify([]));
    }
  } catch {
    // Ignore errors during migration
  }
}

// Call in migrateIfNeeded() after v2→v3 migration

// Add methods to storage object
saveNotes(notes: Note[]): boolean {
  // Similar pattern to saveInterruptionState
}

loadNotes(): Note[] {
  // Similar pattern to loadInterruptionState
}

clearNotes(): boolean {
  // Similar pattern to clearInterruptions
}
```

#### Task 3: Create Note Store (src/lib/stores/noteStore.svelte.ts)

Follow the pattern from interruptionStore.svelte.ts:

```typescript
// State
let notesState = $state<Note[]>([]);
let isInputOpenState = $state(false);
let isViewOpenState = $state(false);
let searchQueryState = $state('');
let taskFilterState = $state<string | null>(null);

// Create store with getters and actions
export const noteStore = createNoteStore();
```

### Phase 2: UI Components

#### Task 4: Create NoteInput Component

```svelte
<!-- src/lib/components/NoteInput.svelte -->
<script lang="ts">
  import { MAX_NOTE_LENGTH } from '$lib/types';

  interface Props {
    onSave: (content: string) => void;
    onCancel: () => void;
  }

  let { onSave, onCancel }: Props = $props();
  let content = $state('');

  const remaining = $derived(MAX_NOTE_LENGTH - content.length);
  const canSave = $derived(content.trim().length > 0 && content.length <= MAX_NOTE_LENGTH);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && canSave) {
      e.preventDefault();
      onSave(content.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>
```

#### Task 5: Create NoteRow Component

```svelte
<!-- src/lib/components/NoteRow.svelte -->
<script lang="ts">
  import type { Note, ConfirmedTask } from '$lib/types';

  interface Props {
    note: Note;
    taskName: string | null; // null = "General"
    onEdit: (noteId: string) => void;
    onDelete: (noteId: string) => void;
  }
</script>
```

#### Task 6: Create NotesView Component

```svelte
<!-- src/lib/components/NotesView.svelte -->
<script lang="ts">
  import { noteStore } from '$lib/stores/noteStore.svelte';
  import NoteRow from './NoteRow.svelte';
</script>
```

#### Task 7: Create DeleteConfirmDialog Component

```svelte
<!-- src/lib/components/DeleteConfirmDialog.svelte -->
<script lang="ts">
  interface Props {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }
</script>
```

### Phase 3: Integration

#### Task 8: Integrate in +page.svelte

1. Add keyboard listener for Ctrl/Cmd+N
2. Conditionally render NoteInput at top of view
3. Add Notes toggle button
4. Conditionally render NotesView panel
5. Connect to noteStore for state management

```svelte
<script>
  // Add to existing script
  import { noteStore } from '$lib/stores/noteStore.svelte';
  import NoteInput from '$lib/components/NoteInput.svelte';
  import NotesView from '$lib/components/NotesView.svelte';

  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key === 'n') {
      e.preventDefault();
      noteStore.openInput();
    }
  }
</script>

<svelte:window on:keydown={handleGlobalKeydown} />
```

### Phase 4: Testing

#### Task 9: Unit Tests (tests/unit/noteStore.test.ts)

```typescript
describe('noteStore', () => {
  describe('addNote', () => {
    it('creates note with auto-generated ID and timestamp');
    it('associates note with provided taskId');
    it('rejects empty content');
    it('trims content before saving');
    it('persists note to storage');
  });

  describe('filteredNotes', () => {
    it('returns all notes when no filter');
    it('filters by search query case-insensitively');
    it('filters by taskId');
    it('combines search and task filter');
    it('sorts by createdAt descending');
  });
});
```

#### Task 10: E2E Tests (tests/e2e/note-capture.test.ts)

```typescript
test.describe('Note Capture', () => {
  test('captures note with keyboard shortcut');
  test('associates note with active task');
  test('creates general note when no task active');
  test('persists notes across page refresh');
  test('searches notes by content');
  test('filters notes by task');
  test('edits existing note');
  test('deletes note with confirmation');
});
```

### Phase 5: Documentation

#### Task 11: Update Documentation

1. **API.md**: Add noteStore API documentation
2. **USER_GUIDE.md**: Add note capture user instructions
3. **DATA_SCHEMA.md**: Document tm_notes structure and schema v4

## Verification Checklist

- [ ] `npm test` passes all unit tests
- [ ] `npm run test:e2e` passes all e2e tests
- [ ] `npm run check` has no errors
- [ ] `npm run lint` has no warnings
- [ ] Keyboard shortcut works (Ctrl+N / Cmd+N)
- [ ] Notes persist across page refresh
- [ ] Search and filter work correctly
- [ ] Edit and delete work correctly
- [ ] Documentation updated

## Common Issues

### Keyboard shortcut not working
- Ensure event listener is on `svelte:window`
- Check that input isn't capturing the event (use `e.target`)
- Verify platform detection for Ctrl vs Cmd

### Notes not persisting
- Check `storage.saveNotes()` is called after state changes
- Verify localStorage quota isn't exceeded
- Check schema migration ran correctly

### Search not filtering
- Ensure `toLowerCase()` on both query and content
- Check reactive derivation is set up correctly
- Verify filter state is updating
