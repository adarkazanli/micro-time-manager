# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Task Correction Features**:
  - Edit elapsed time for completed tasks (correct mistakes after completion)
  - Edit elapsed time for current task (adjust timer mid-task)
  - Mark completed task as incomplete (preserves elapsed time, timer continues)
  - "Start Now" button to jump to any pending task immediately
  - Current task can now be reordered (if flexible)
- **004-interruption-tracking**: Interruption tracking for logging task pauses
  - Interrupt/Resume button with keyboard shortcuts (I/R)
  - Interruption timer showing elapsed pause time
  - Category selection (Phone, Luci, Colleague, Personal, Other)
  - Optional notes for each interruption (max 200 chars)
  - Per-task interruption summary (count and total time)
  - Full interruption log with session history
  - Edit dialog for modifying category and note after resume
  - Auto-end interruption on task/session completion
  - Interruption state persistence across page refreshes
- **003-impact-panel**: Impact panel showing all tasks with projected times
  - Task reordering via drag-and-drop (flexible tasks only)
  - Drop zone for moving tasks to end of list
  - Task duration display in each row
  - Double-click to edit task properties (name, start time, duration, type)
  - Real-time projection updates as timer runs
- **002-day-tracking**: Day tracking with timer and session management
  - Countdown timer with green/yellow/red color states
  - Current task display with progress tracking
  - Lag indicator showing schedule adherence
  - Fixed task warnings when at risk
  - Session persistence across page refreshes
  - Tab sync for multi-tab leadership
  - Day summary on completion
- **001-schedule-import**: Excel/CSV schedule import workflow
  - File upload with drag-and-drop support
  - Schedule preview with inline editing
  - Task reordering in preview
  - Flexible duration parsing (30m, 1h 30m, etc.)
  - Time format support (12h and 24h)
  - Template download for easy schedule creation

### Fixed
- Page refresh now correctly returns to day tracking view when tasks exist

## [0.1.0] - 2025-12-17

### Added
- Initial repository setup
- Project documentation:
  - README.md with project overview
  - ARCHITECTURE.md with system design
  - API.md with interface specifications
  - USER_GUIDE.md with user stories
  - DATA_SCHEMA.md with storage specifications
  - CONTRIBUTING.md with development guidelines
- SpecKit templates for feature development
- Project constitution (v1.1.0) establishing:
  - Component-First Architecture principle
  - Offline-First & Local Storage principle
  - Performance-Critical Timers principle
  - Test-First Development principle
  - Simplicity & YAGNI principle
  - Comprehensive Documentation principle
- Architecture Decision Records:
  - ADR-001: Svelte over React

---

[Unreleased]: https://github.com/adarkazanli/micro-time-manager/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/adarkazanli/micro-time-manager/releases/tag/v0.1.0
