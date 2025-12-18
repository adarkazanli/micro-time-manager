# Quickstart: Schedule Import

**Feature**: 001-schedule-import
**Date**: 2025-12-17

This guide helps developers get started implementing the schedule import feature.

## Prerequisites

- Node.js 20.x+
- npm 10.x+
- Project scaffolded with Svelte 5 + Vite

## Setup

### 1. Install Dependencies

```bash
# SheetJS for Excel/CSV parsing
npm install xlsx

# Dev dependencies (if not already installed)
npm install -D vitest @testing-library/svelte @playwright/test
```

### 2. Verify Project Structure

Ensure these directories exist:

```bash
mkdir -p src/lib/components
mkdir -p src/lib/stores
mkdir -p src/lib/services
mkdir -p src/lib/utils
mkdir -p tests/unit
mkdir -p tests/component
mkdir -p tests/e2e
```

## Implementation Order

### Phase 1: Utilities (No Dependencies)

Start with pure utility functions that have no dependencies:

```bash
# 1. Duration parser
touch src/lib/utils/duration.ts
touch tests/unit/duration.test.ts

# 2. Time parser
touch src/lib/utils/time.ts
touch tests/unit/time.test.ts
```

**Test first!** Write tests before implementation:

```typescript
// tests/unit/duration.test.ts
import { describe, it, expect } from 'vitest';
import { parseDuration } from '$lib/utils/duration';

describe('parseDuration', () => {
  it('parses minutes format', () => {
    expect(parseDuration('30m')).toBe(1800);
  });

  it('parses combined format', () => {
    expect(parseDuration('1h 30m')).toBe(5400);
  });

  it('returns null for invalid input', () => {
    expect(parseDuration('invalid')).toBeNull();
  });
});
```

### Phase 2: Parser Service

Depends on: duration.ts, time.ts

```bash
touch src/lib/services/parser.ts
touch tests/unit/parser.test.ts
```

**Key test cases:**

```typescript
// tests/unit/parser.test.ts
describe('parseScheduleFile', () => {
  it('parses valid xlsx file', async () => {
    const file = createTestFile('valid-schedule.xlsx');
    const result = await parseScheduleFile(file);
    expect(result.success).toBe(true);
  });

  it('returns all errors for invalid file', async () => {
    const file = createTestFile('multiple-errors.xlsx');
    const result = await parseScheduleFile(file);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('rejects files over 1MB', async () => {
    const file = createLargeFile(2 * 1024 * 1024);
    const result = await parseScheduleFile(file);
    expect(result.errors[0].message).toContain('1MB');
  });
});
```

### Phase 3: Import Store

Depends on: parser.ts

```bash
touch src/lib/stores/importStore.ts
touch tests/unit/importStore.test.ts
```

**Store implementation skeleton:**

```typescript
// src/lib/stores/importStore.ts
import { writable, derived } from 'svelte/store';
import type { ImportState, DraftTask, ValidationError } from './types';

const initialState: ImportState = {
  status: 'idle',
  file: null,
  uploadedAt: null,
  tasks: [],
  errors: [],
};

function createImportStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    uploadFile: async (file: File) => { /* ... */ },
    updateTask: (id: string, changes: Partial<DraftTask>) => { /* ... */ },
    reorderTasks: (fromIndex: number, toIndex: number) => { /* ... */ },
    confirmSchedule: () => { /* ... */ },
    reset: () => set(initialState),
  };
}

export const importStore = createImportStore();

// Derived stores
export const hasErrors = derived(importStore, $s => $s.errors.length > 0);
export const canConfirm = derived(importStore, $s =>
  $s.status === 'preview' && $s.tasks.length > 0
);
```

### Phase 4: Components

Depends on: importStore.ts

Build components in this order:

1. **ValidationErrors.svelte** - Simplest, just displays errors
2. **TemplateDownload.svelte** - Simple button
3. **TaskRow.svelte** - Single task display/edit
4. **FileUploader.svelte** - Upload zone
5. **SchedulePreview.svelte** - Combines TaskRow with reordering

**Component test example:**

```typescript
// tests/component/FileUploader.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import FileUploader from '$lib/components/FileUploader.svelte';

describe('FileUploader', () => {
  it('accepts valid file types', async () => {
    const { getByTestId } = render(FileUploader);
    const input = getByTestId('file-input');

    const file = new File([''], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    await fireEvent.change(input, { target: { files: [file] } });
    // Assert file was accepted
  });
});
```

### Phase 5: Integration

Wire components together in the main view:

```svelte
<!-- src/routes/+page.svelte or App.svelte -->
<script>
  import { importStore, hasErrors, canConfirm } from '$lib/stores/importStore';
  import FileUploader from '$lib/components/FileUploader.svelte';
  import ValidationErrors from '$lib/components/ValidationErrors.svelte';
  import SchedulePreview from '$lib/components/SchedulePreview.svelte';
  import TemplateDownload from '$lib/components/TemplateDownload.svelte';
</script>

{#if $importStore.status === 'idle'}
  <FileUploader />
  <TemplateDownload />
{:else if $importStore.status === 'error'}
  <ValidationErrors errors={$importStore.errors} />
  <button on:click={importStore.reset}>Try Again</button>
{:else if $importStore.status === 'preview'}
  <SchedulePreview tasks={$importStore.tasks} />
  <button on:click={importStore.confirmSchedule} disabled={!$canConfirm}>
    Confirm Schedule
  </button>
  <button on:click={importStore.reset}>Cancel</button>
{/if}
```

## Running Tests

```bash
# Unit tests (watch mode)
npm run test:unit -- --watch

# Component tests
npm run test:component

# E2E tests
npm run test:e2e

# All tests
npm run test
```

## Test Fixtures

Create test fixtures in `tests/fixtures/`:

```
tests/fixtures/
├── valid-schedule.xlsx      # Valid 5-task schedule
├── valid-schedule.csv       # Same as above, CSV format
├── missing-columns.xlsx     # Missing "Duration" column
├── invalid-durations.xlsx   # Multiple invalid duration formats
├── invalid-times.xlsx       # Multiple invalid time formats
├── invalid-types.xlsx       # Invalid task types
├── empty-file.xlsx          # Headers only, no data
├── large-file.xlsx          # >1MB file
└── 60-tasks.xlsx            # Exceeds 50 task limit
```

## Validation Checklist

Before marking feature complete:

- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] E2E test for full import flow passes
- [ ] Works with .xlsx, .xls, and .csv files
- [ ] All duration formats parse correctly
- [ ] All time formats parse correctly
- [ ] Error messages show row/column details
- [ ] All errors display at once (not just first)
- [ ] Files over 1MB rejected
- [ ] Files with >50 tasks rejected
- [ ] Inline editing works for all fields
- [ ] Drag-drop reordering works for flexible tasks
- [ ] Confirm saves to localStorage
- [ ] Cancel clears all state
- [ ] Template downloads correctly

## Common Issues

### SheetJS Bundle Size

If bundle size is too large, use dynamic import:

```typescript
// Lazy load SheetJS only when needed
async function parseFile(file: File) {
  const XLSX = await import('xlsx');
  // ...
}
```

### Date Handling

Always use the current day for times:

```typescript
function parseTime(input: string): Date | null {
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today;
}
```

### Drag-Drop on Mobile

Add touch event handlers for mobile support:

```svelte
<div
  on:touchstart={handleTouchStart}
  on:touchmove={handleTouchMove}
  on:touchend={handleTouchEnd}
>
```
