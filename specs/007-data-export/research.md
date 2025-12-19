# Research: Data Export

**Feature**: 007-data-export
**Date**: 2025-12-19

## SheetJS Excel Export

### Decision
Use SheetJS `XLSX.utils.book_new()`, `XLSX.utils.json_to_sheet()`, and `XLSX.writeFile()` for multi-sheet Excel generation.

### Rationale
- SheetJS is already installed in the project for import functionality
- Supports multi-sheet workbooks natively
- Client-side only - no server required
- Well-documented API with TypeScript support

### Alternatives Considered
1. **ExcelJS** - More feature-rich but adds ~400KB to bundle; not needed for simple export
2. **Custom XML generation** - Error-prone, no benefit over library
3. **Server-side generation** - Violates offline-first constitution principle

### Implementation Pattern
```typescript
import * as XLSX from 'xlsx';

// Create workbook with multiple sheets
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks');
XLSX.utils.book_append_sheet(wb, interruptionsSheet, 'Interruptions');
XLSX.utils.book_append_sheet(wb, notesSheet, 'Notes');
XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

// Trigger download
XLSX.writeFile(wb, `${date}_productivity.xlsx`);
```

## CSV Generation

### Decision
Use native JavaScript for CSV generation with proper RFC 4180 escaping.

### Rationale
- No additional dependencies needed
- Full control over escaping logic
- Smaller bundle impact than CSV libraries
- SheetJS can also export CSV but manual gives more control for RFC 4180 compliance

### Alternatives Considered
1. **Papa Parse** - Overkill for export-only; adds unnecessary parsing code
2. **SheetJS CSV export** - Viable but less control over escaping edge cases
3. **json2csv** - Another dependency when native suffices

### Implementation Pattern
```typescript
function escapeCSVValue(value: string): string {
  // RFC 4180: If value contains comma, quote, or newline, wrap in quotes
  // Double any quotes inside the value
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVValue).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}
```

## Browser Download Triggering

### Decision
Use Blob URLs with programmatic anchor click for file downloads.

### Rationale
- Works across all modern browsers
- No server required
- Handles both binary (Excel) and text (CSV) files
- Can be cleaned up after download

### Alternatives Considered
1. **FileSaver.js** - Additional dependency when native API works
2. **Data URLs** - Size limits and encoding overhead
3. **Fetch API download** - Requires server endpoint

### Implementation Pattern
```typescript
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

## Time Formatting

### Decision
Create utility function to format seconds as HH:MM:SS, with +/- prefix for variance.

### Rationale
- Consistent format across all export sheets
- Human-readable in spreadsheet applications
- Supports negative values for variance display

### Implementation Pattern
```typescript
function formatDurationHHMMSS(seconds: number): string {
  const sign = seconds < 0 ? '-' : '';
  const abs = Math.abs(Math.floor(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatVarianceHHMMSS(seconds: number): string {
  const prefix = seconds > 0 ? '+' : '';
  return prefix + formatDurationHHMMSS(seconds);
}
```

## Data Aggregation Strategy

### Decision
Compute export data at export time by reading from existing stores and analytics service.

### Rationale
- Stores already contain all needed data
- Analytics service (`calculateAnalyticsSummary`, `calculateTaskPerformance`) provides computed metrics
- No need to duplicate or cache export-specific data
- Handles in-progress sessions by reading current state

### Data Sources
| Export Sheet | Data Source |
|--------------|-------------|
| Tasks | `sessionStore.tasks` + `sessionStore.taskProgress` + interrupt aggregation |
| Interruptions | `interruptionStore.interruptions` |
| Notes | `noteStore.notes` |
| Summary | `calculateAnalyticsSummary()` + `sessionStore` (dates) |

## Session Date Extraction

### Decision
Use `sessionStore.startedAt` to derive the session date for filename.

### Rationale
- Canonical source of session timing
- Already available in ISO 8601 format
- Handles edge cases (session spanning midnight)

### Implementation Pattern
```typescript
function getSessionDate(): string {
  const startedAt = sessionStore.startedAt;
  if (!startedAt) return new Date().toISOString().split('T')[0];
  return new Date(startedAt).toISOString().split('T')[0];
}
```

## Inline Format Selector UX

### Decision
Use click-to-expand button group pattern: Export button reveals Excel/CSV options inline.

### Rationale
- Per clarification session: user selected inline buttons over modal
- Meets "2 clicks" success criterion
- Common pattern in export UIs (Google Docs, Notion)
- Simpler than modal (no overlay management)

### Implementation Pattern
- Export button shows "Export" initially
- On click, button expands to show "Excel" and "CSV" side by side
- Clicking either format triggers export and collapses selector
- Click outside collapses without action
