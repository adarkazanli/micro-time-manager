# Micro Time Manager

A browser-based time tracking application that helps you manage your daily schedule with precision timing, interruption tracking, and real-time schedule impact visualization.

## Features

### Schedule Import
- Import daily schedules from Excel (.xlsx) or CSV files
- Flexible duration parsing (30m, 1h 30m, 01:30:00)
- Support for 12-hour and 24-hour time formats
- Preview and edit tasks before starting

### Day Tracking
- Precision countdown timer with color-coded states (green/yellow/red)
- Real-time lag indicator showing schedule adherence
- Fixed task warnings when appointments are at risk
- Session persistence across page refreshes

### Schedule Impact Panel
- Visual status indicators (completed/current/pending)
- Risk indicators for fixed tasks (green/yellow/red dots)
- Drag-and-drop reordering of flexible tasks
- Real-time projection updates

### Task Flexibility
- **Start Any Task**: Jump to any pending task immediately
- **Reorder Current Task**: Move your current task if it's flexible
- **Task Correction**: Edit elapsed time for completed or current tasks
- **Undo Completion**: Mark completed tasks as incomplete (preserves elapsed time)

### Interruption Tracking
- One-click interrupt/resume workflow
- Categories: Phone, Luci, Colleague, Personal, Other
- Optional notes for each interruption
- Per-task and session-level interruption summaries

### Note Capture
- Quick notes linked to current task
- Search and filter notes
- Edit and delete functionality

### Analytics & Export
- Concentration score and rating
- Schedule adherence metrics
- Export to Excel or CSV
- Multi-sheet workbooks with tasks, interruptions, notes, and summary

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/adarkazanli/micro-time-manager.git
cd micro-time-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Run tests
npm test

# Type checking
npm run check

# Linting
npm run lint

# Build for production
npm run build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Svelte 5 (runes) |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| File I/O | SheetJS (xlsx) |
| Storage | localStorage |
| Language | TypeScript 5 (strict) |

## Documentation

- [User Guide](docs/USER_GUIDE.md) - How to use the application
- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](docs/API.md) - Store and service interfaces
- [Data Schema](docs/DATA_SCHEMA.md) - Storage and file formats
- [Contributing](docs/CONTRIBUTING.md) - Development guidelines

## Project Structure

```
src/
├── lib/
│   ├── components/    # Svelte components
│   ├── stores/        # Svelte stores (state management)
│   ├── services/      # Business logic
│   └── utils/         # Pure utility functions
├── routes/            # SvelteKit routes
└── app.css            # Global styles

tests/
├── unit/              # Store and service tests
├── component/         # Component tests
└── e2e/               # End-to-end tests
```

## License

MIT

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
