# Micro Time Manager

A lightweight, offline-first time tracking application for micro-managing your daily schedule with precision.

## Overview

Micro Time Manager is a client-side single-page application (SPA) that runs entirely in the browser. It helps you track time against a planned schedule, monitor interruptions, capture notes, and analyze your productivity—all without any backend dependencies.

### Key Features

- **Schedule Import**: Upload your daily tasks from Excel/CSV files
- **Precision Timer**: Countdown timer with overrun detection and lag tracking
- **Interruption Tracking**: One-click pause/resume with categorization
- **Quick Notes**: Capture thoughts and callback numbers without disrupting flow
- **Concentration Score**: Real-time productivity metrics
- **Data Export**: Export your day's data to Excel for external analysis

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Offline-First** | All data stored in browser localStorage; no network required |
| **Privacy-Focused** | Data never leaves your device unless explicitly exported |
| **Responsive** | Mobile-first CSS with breakpoints for tablet and desktop |
| **Lightweight** | <50KB bundle size target; Svelte compiles away |
| **Data Portable** | Standard Excel/CSV export for external analysis |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/adarkazanli/micro-time-manager.git
cd micro-time-manager

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Svelte | 5.x |
| Build | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| File I/O | SheetJS (xlsx) | latest |
| Charts | Chart.js or Layercake | latest |
| Storage | localStorage | N/A |
| Language | TypeScript | 5.x |

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, component relationships |
| [API Reference](docs/API.md) | Store contracts, service methods, public interfaces |
| [User Guide](docs/USER_GUIDE.md) | End-user instructions and workflows |
| [Data Schema](docs/DATA_SCHEMA.md) | localStorage structure, Excel format specs |
| [Contributing](docs/CONTRIBUTING.md) | Development setup and guidelines |
| [Changelog](CHANGELOG.md) | Version history and release notes |

## Project Structure

```
src/
├── lib/
│   ├── components/    # Reusable Svelte components
│   ├── stores/        # Svelte stores for shared state
│   ├── services/      # Business logic (storage, file parsing, timers)
│   └── utils/         # Pure utility functions
├── routes/            # SvelteKit routes or App.svelte
└── app.css            # Tailwind directives and global styles

tests/
├── unit/              # Store and service tests
├── component/         # Svelte component tests
└── e2e/               # End-to-end tests (Playwright)

docs/
├── ARCHITECTURE.md    # System design documentation
├── API.md             # Public interface documentation
├── USER_GUIDE.md      # End-user documentation
├── DATA_SCHEMA.md     # Data structure documentation
├── CONTRIBUTING.md    # Developer onboarding
├── images/            # Visual assets for documentation
└── decisions/         # Architecture Decision Records
```

## Usage

1. **Import Schedule**: Upload an Excel/CSV file with your daily tasks
2. **Start Day**: Begin tracking with a single click
3. **Track Time**: Watch the countdown timer for each task
4. **Log Interruptions**: Pause/resume with one click when interrupted
5. **Capture Notes**: Quick-add notes linked to current task
6. **Export Data**: Download your day's data for analysis

### Import File Format

Your schedule file must include these columns:

| Column | Type | Example |
|--------|------|---------|
| Task Name | String | "Email review" |
| Start Time | Time | "09:00" or "9:00 AM" |
| Duration | String | "30m", "1h 30m", "01:30:00" |
| Type | String | "fixed" or "flexible" |

Download a [sample template](docs/templates/sample-schedule.xlsx) to get started.

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | iOS 14+ |
| Chrome Mobile | Android 10+ |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)

---

**Version**: 0.1.0
**Last Updated**: 2025-12-17
