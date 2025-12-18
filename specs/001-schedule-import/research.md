# Research: Schedule Import

**Feature**: 001-schedule-import
**Date**: 2025-12-17

## Research Summary

This document captures technology decisions and best practices research for the schedule import feature.

---

## 1. SheetJS (xlsx) Usage Patterns

### Decision
Use SheetJS `read()` with `{ type: 'array' }` for file parsing, and `sheet_to_json()` with `{ header: 1 }` for row extraction.

### Rationale
- SheetJS is mandated by constitution for Excel I/O
- Array buffer reading works for all supported formats (.xlsx, .xls, .csv)
- `header: 1` returns raw rows allowing custom column matching

### Alternatives Considered
- **PapaParse** (CSV only): Rejected because we need .xlsx/.xls support
- **ExcelJS**: Larger bundle size, overkill for read-only parsing

### Implementation Notes
```typescript
import * as XLSX from 'xlsx';

// Read file as ArrayBuffer
const data = await file.arrayBuffer();
const workbook = XLSX.read(data, { type: 'array' });

// Get first sheet
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Convert to rows (header: 1 returns array of arrays)
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
```

### Bundle Impact
- SheetJS core: ~150KB minified, ~50KB gzipped
- Tree-shakeable: import only `read` and `utils.sheet_to_json`

---

## 2. Duration Parsing Strategy

### Decision
Implement custom regex-based parser supporting multiple formats without external dependencies.

### Rationale
- No existing library handles all required formats (30m, 1h 30m, 01:30:00)
- Custom parser is small (<50 lines) and fully testable
- Avoids adding dependencies for simple string parsing

### Alternatives Considered
- **dayjs/duration**: Doesn't parse "30m" or "1h 30m" shorthand
- **ms package**: Only converts to milliseconds, doesn't handle HH:MM:SS
- **Temporal API**: Not yet widely supported in browsers

### Implementation Pattern
```typescript
const DURATION_PATTERNS = [
  /^(\d+)s$/,                          // "30s" → seconds
  /^(\d+)m$/,                          // "30m" → minutes
  /^(\d+)h$/,                          // "2h" → hours
  /^(\d+)h\s*(\d+)m$/,                 // "1h 30m" → hours + minutes
  /^(\d{1,2}):(\d{2})$/,               // "30:00" → MM:SS
  /^(\d{1,2}):(\d{2}):(\d{2})$/,       // "01:30:00" → HH:MM:SS
];

function parseDuration(input: string): number | null {
  // Returns seconds or null if invalid
}
```

---

## 3. Time Format Parsing

### Decision
Use regex for 24-hour and 12-hour time formats, normalize to Date objects for the current day.

### Rationale
- Simple patterns cover all specified formats
- Native Date handles timezone correctly
- No external dependencies needed

### Alternatives Considered
- **date-fns/parse**: Adds dependency for simple parsing
- **Temporal.PlainTime**: Not yet stable in browsers

### Implementation Pattern
```typescript
const TIME_PATTERNS = {
  h24: /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/,           // "09:00" or "09:00:00"
  h12: /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,             // "9:00 AM"
};

function parseTime(input: string): Date | null {
  // Returns Date for today at specified time, or null if invalid
}
```

---

## 4. Drag-and-Drop Reordering

### Decision
Use native HTML5 Drag and Drop API with Svelte event handlers.

### Rationale
- Native API provides sufficient functionality for simple list reordering
- No external library keeps bundle small per YAGNI principle
- Svelte's event handling makes implementation clean

### Alternatives Considered
- **@dnd-kit**: Excellent accessibility but adds ~20KB
- **svelte-dnd-action**: Good but adds unnecessary abstraction
- **SortableJS**: jQuery-era library, not reactive

### Implementation Pattern
```svelte
<div
  draggable={task.type === 'flexible'}
  on:dragstart={(e) => handleDragStart(e, index)}
  on:dragover={handleDragOver}
  on:drop={(e) => handleDrop(e, index)}
>
```

### Accessibility Note
- Add `aria-grabbed` and `aria-dropeffect` attributes
- Provide keyboard alternative (move up/down buttons)

---

## 5. File Upload Component Pattern

### Decision
Combine drag-drop zone with hidden file input for click-to-browse.

### Rationale
- Standard pattern for file upload UX
- Works across all target browsers
- Single component handles both upload methods

### Implementation Pattern
```svelte
<div
  class="upload-zone"
  on:dragover|preventDefault
  on:drop={handleDrop}
  on:click={() => fileInput.click()}
>
  <input
    bind:this={fileInput}
    type="file"
    accept=".xlsx,.xls,.csv"
    on:change={handleFileSelect}
    hidden
  />
  <p>Drag & drop or click to upload</p>
</div>
```

---

## 6. Validation Error Display

### Decision
Collect all errors during parsing and display as scrollable list.

### Rationale
- User can fix all issues in one edit cycle (per clarification)
- Structured error objects enable consistent formatting
- Scrollable list handles edge case of many errors

### Data Structure
```typescript
interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
}
```

### Display Pattern
- Group errors by type (missing columns, format errors)
- Show row number prominently
- Include "Copy error details" for support scenarios

---

## 7. Import Store Design

### Decision
Single Svelte store managing import workflow state.

### Rationale
- Single source of truth for import flow
- Derived stores for computed values (e.g., hasErrors)
- Follows constitution's preference for Svelte stores

### Store Shape
```typescript
interface ImportState {
  status: 'idle' | 'parsing' | 'preview' | 'error';
  file: File | null;
  tasks: DraftTask[];
  errors: ValidationError[];
}
```

---

## 8. Template File Generation

### Decision
Use SheetJS `writeFile()` to generate template dynamically.

### Rationale
- No need to store static file asset
- Can update template format without deployment
- Same library used for parsing handles writing

### Implementation
```typescript
function downloadTemplate() {
  const data = [
    ['Task Name', 'Start Time', 'Duration', 'Type'],
    ['Morning email', '09:00', '30m', 'flexible'],
    ['Team standup', '09:30', '15m', 'fixed'],
    ['Project work', '09:45', '2h', 'flexible'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  XLSX.writeFile(wb, 'schedule-template.xlsx');
}
```

---

## Open Questions Resolved

All technical questions have been resolved. No remaining NEEDS CLARIFICATION items.

| Question | Resolution |
|----------|------------|
| Max tasks per schedule | 50 (from clarification) |
| Error display strategy | Show all at once (from clarification) |
| File size limit | 1MB (from spec) |
| Column name matching | Case-insensitive (from spec assumptions) |
