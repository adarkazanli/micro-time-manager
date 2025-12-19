# Quickstart: Data Export

**Feature**: 007-data-export
**Date**: 2025-12-19

## Prerequisites

- Node.js 18+ installed
- Repository cloned and dependencies installed (`npm install`)
- Existing session data for testing (or use mock data)

## Quick Verification Steps

### 1. Run Existing Tests

```bash
npm test
```

Verify all existing tests pass before starting implementation.

### 2. Check SheetJS Availability

```bash
# Verify xlsx is installed
npm ls xlsx
```

Expected output should show `xlsx@x.x.x` (already installed for import feature).

### 3. Development Server

```bash
npm run dev
```

Open http://localhost:5173 in browser.

### 4. Create Test Session Data

1. Import a schedule file (use existing import feature)
2. Start the day session
3. Complete at least one task
4. Log at least one interruption
5. Capture at least one note

Or use browser DevTools to inject mock data:

```javascript
// Paste in browser console to create mock session
localStorage.setItem('tm_session', JSON.stringify({
  sessionId: crypto.randomUUID(),
  startedAt: new Date().toISOString(),
  endedAt: null,
  status: 'running',
  currentTaskIndex: 1,
  currentTaskElapsedMs: 300000,
  lastPersistedAt: Date.now(),
  totalLagSec: 0,
  taskProgress: [
    { taskId: 'task-1', plannedDurationSec: 1800, actualDurationSec: 1920, completedAt: new Date().toISOString(), status: 'complete' },
    { taskId: 'task-2', plannedDurationSec: 900, actualDurationSec: 300, completedAt: null, status: 'active' }
  ]
}));

localStorage.setItem('tm_tasks', JSON.stringify([
  { taskId: 'task-1', name: 'Email Review', type: 'flexible', plannedStart: new Date().toISOString(), plannedDurationSec: 1800, sortOrder: 0, status: 'complete' },
  { taskId: 'task-2', name: 'Team Standup', type: 'fixed', plannedStart: new Date().toISOString(), plannedDurationSec: 900, sortOrder: 1, status: 'active' }
]));

localStorage.setItem('tm_interruptions', JSON.stringify([
  { interruptionId: crypto.randomUUID(), taskId: 'task-1', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationSec: 150, category: 'Phone', note: 'Client callback' }
]));

localStorage.setItem('tm_notes', JSON.stringify([
  { noteId: crypto.randomUUID(), content: 'Remember to follow up on project timeline', createdAt: new Date().toISOString(), updatedAt: null, taskId: 'task-1' }
]));

// Refresh page to load data
location.reload();
```

---

## Implementation Order

### Phase 1: Setup (Types & Utilities)

1. Add export types to `src/lib/types/index.ts`
2. Add/verify time formatting utility functions

### Phase 2: Export Service

1. Create `src/lib/services/export.ts`
2. Implement data preparation functions:
   - `prepareTasksExport()`
   - `prepareInterruptionsExport()`
   - `prepareNotesExport()`
   - `prepareSummaryExport()`
3. Implement file generation:
   - `exportToExcel()`
   - `exportToCSV()`

### Phase 3: UI Component

1. Create `src/lib/components/ExportButton.svelte`
2. Add inline format selector (Excel/CSV buttons)
3. Handle disabled state when session is idle

### Phase 4: Integration

1. Add ExportButton to `src/routes/+page.svelte`
2. Position in secondary controls area

### Phase 5: Testing & Documentation

1. Write unit tests for export service
2. Write e2e tests for export flow
3. Update USER_GUIDE.md, API.md, DATA_SCHEMA.md

---

## Testing Checklist

### Unit Tests (export service)

- [ ] `prepareTasksExport()` returns correct structure
- [ ] `prepareInterruptionsExport()` handles empty interruptions
- [ ] `prepareNotesExport()` handles notes with/without task association
- [ ] `prepareSummaryExport()` includes all metrics
- [ ] Time formatting produces HH:MM:SS format
- [ ] Variance formatting includes +/- prefix
- [ ] CSV escaping handles quotes, commas, newlines
- [ ] In-progress tasks calculate duration from elapsed time
- [ ] In-progress interruptions calculate duration from current time

### E2E Tests (export flow)

- [ ] Export button visible in secondary controls
- [ ] Export button disabled when session idle
- [ ] Click Export shows Excel/CSV options
- [ ] Click Excel downloads .xlsx file
- [ ] Click CSV downloads multiple .csv files
- [ ] Exported files contain correct data

### Manual Verification

- [ ] Excel file opens in Microsoft Excel without errors
- [ ] Excel file opens in Google Sheets without errors
- [ ] CSV files open in any text editor
- [ ] CSV files import correctly into spreadsheet apps
- [ ] All time values formatted as HH:MM:SS
- [ ] Special characters preserved correctly
- [ ] Export completes within 2 seconds with 50 tasks, 100 interruptions, 50 notes (use mock data from setup section)

---

## File Structure After Implementation

```text
src/lib/
├── components/
│   └── ExportButton.svelte         # NEW
├── services/
│   └── export.ts                   # NEW
├── types/
│   └── index.ts                    # MODIFIED (add ExportFormat)
└── utils/
    └── formatters.ts               # NEW or MODIFIED

tests/
├── unit/
│   └── export.test.ts              # NEW
└── e2e/
    └── export.spec.ts              # NEW

docs/
├── API.md                          # MODIFIED
├── USER_GUIDE.md                   # MODIFIED
└── DATA_SCHEMA.md                  # MODIFIED
```

---

## Validation After Each Phase

### After Phase 2 (Export Service)

```bash
npm test -- export
```

All export service unit tests should pass.

### After Phase 4 (Integration)

```bash
npm run dev
# Manual test in browser:
# 1. Create/load session data
# 2. Click Export
# 3. Click Excel → verify download
# 4. Click Export → CSV → verify downloads
```

### After Phase 5 (Complete)

```bash
npm test && npm run lint && npm run check
```

All tests pass, no lint errors, no type errors.

---

## Common Issues & Solutions

### Issue: SheetJS writeFile not triggering download

**Solution**: Ensure you're using `XLSX.writeFile()` not `XLSX.write()`. The former triggers browser download, the latter returns binary data.

### Issue: CSV special characters corrupted

**Solution**: Verify RFC 4180 escaping is applied to all values. Check that commas, quotes, and newlines are properly escaped.

### Issue: Time shows as raw seconds

**Solution**: Verify formatDuration utility is called on all numeric duration fields before adding to export row.

### Issue: Export button shows when no data

**Solution**: Check that disabled state reads from `sessionStore.status === 'idle'` correctly.
