# User Guide

Welcome to Micro Time Manager! This guide will help you get the most out of your time tracking experience.

## Table of Contents

- [Getting Started](#getting-started)
- [Importing Your Schedule](#importing-your-schedule)
- [Tracking Your Day](#tracking-your-day)
- [Managing Interruptions](#managing-interruptions)
- [Taking Notes](#taking-notes)
- [Viewing Analytics](#viewing-analytics)
- [Exporting Data](#exporting-data)
- [Settings](#settings)
- [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

Micro Time Manager helps you track your time against a planned schedule. The app runs entirely in your browser—no account needed, no data sent to servers.

### Basic Workflow

1. **Import** your daily schedule from an Excel or CSV file
2. **Start** your day to begin tracking
3. **Complete** tasks as you work through them
4. **Log interruptions** when they happen
5. **Export** your data at the end of the day

---

## Importing Your Schedule

### Preparing Your Schedule File

Create an Excel (.xlsx) or CSV file with these columns:

| Column | Required | Description | Examples |
|--------|----------|-------------|----------|
| Task Name | Yes | What you'll be working on | "Email review", "Team standup" |
| Start Time | Yes | When the task should begin | "09:00", "9:00 AM" |
| Duration | Yes | How long the task should take | "30m", "1h 30m", "01:30:00" |
| Type | Yes | Fixed (can't move) or Flexible | "fixed", "flexible" |

#### Duration Formats

You can enter durations in several ways:
- **Minutes**: `30m`, `45m`
- **Hours**: `1h`, `2h`
- **Combined**: `1h 30m`, `2h 15m`
- **Time format**: `01:30:00` (1 hour 30 minutes)

#### Fixed vs. Flexible Tasks

- **Fixed tasks** happen at specific times (meetings, calls)
- **Flexible tasks** can be moved if you're running behind

### Uploading Your File

1. Click the upload area or drag-and-drop your file
2. Review the preview to ensure tasks are correct
3. Make any adjustments (edit names, durations, reorder)
4. Click "Confirm Schedule" to start

### Sample Schedule

| Task Name | Start Time | Duration | Type |
|-----------|------------|----------|------|
| Morning email | 09:00 | 30m | flexible |
| Team standup | 09:30 | 15m | fixed |
| Project work | 09:45 | 2h | flexible |
| Lunch break | 12:00 | 1h | fixed |
| Client call | 13:00 | 30m | fixed |
| Documentation | 13:30 | 1h 30m | flexible |

---

## Tracking Your Day

### Starting Your Day

Click **"Start Day"** to begin tracking your first task. The timer will start counting down immediately.

### The Timer Display

The main screen shows:
- **Countdown timer**: Time remaining on current task
- **Task name**: What you should be working on
- **Task type**: Badge showing fixed or flexible
- **Lag indicator**: How far behind/ahead of schedule you are

### Timer States

| State | Display | Meaning |
|-------|---------|---------|
| Running | Green numbers | Time remaining |
| Warning | Yellow numbers | Less than 5 minutes left |
| Overdrawn | Red negative numbers | You've exceeded the allocated time |

### Completing a Task

When you finish a task:
1. Click **"Complete Task"**
2. The next task automatically starts
3. Your actual time is recorded

### Schedule Lag

The lag indicator shows if you're:
- **Ahead**: "5 min ahead" (green)
- **On time**: "On schedule" (green)
- **Behind**: "10 min behind" (yellow/red)

### Fixed Task Warnings

When a fixed task is approaching and your current pace would make you late, you'll see a warning:

> "At current pace, you will be 8 minutes late for Team standup"

### Schedule Impact Panel

The Impact Panel shows your full schedule with real-time status updates:

#### Task Status Indicators

| Status | Display | Meaning |
|--------|---------|---------|
| Completed | Grayed out, strikethrough | Task is done |
| Current | Blue highlight | Task you're working on now |
| Pending | Normal | Tasks yet to come |

#### Risk Indicators for Fixed Tasks

Fixed tasks show colored dots indicating schedule risk:

| Color | Meaning | Buffer Time |
|-------|---------|-------------|
| Green | On track | More than 5 minutes ahead |
| Yellow | At risk | 0-5 minutes of buffer |
| Red | Will be late | Already behind schedule |

#### Reordering Tasks

You can drag flexible tasks to resolve schedule conflicts:

1. Look for the drag handle (⋮⋮) on flexible pending tasks
2. Drag a task to a new position
3. Watch risk indicators update in real-time
4. Your new order is automatically saved

**Note:** You cannot reorder:
- Fixed tasks (they have set times)
- Completed tasks
- The current task you're working on

---

## Managing Interruptions

### Logging an Interruption

When you get interrupted:
1. Click the **"Interrupt"** button (or press `I`)
2. The task timer pauses
3. An interruption timer starts

### Resuming Work

When the interruption ends:
1. Click **"Resume"** (or press `R`)
2. Optionally select a category (Phone, Colleague, Personal, Other)
3. Optionally add a note
4. Your task timer resumes

### Interruption Categories

| Category | Use For |
|----------|---------|
| Phone | Calls, messages |
| Luci | Anything to do with Luci |
| Colleague | In-person questions |
| Personal | Bathroom, coffee, etc. |
| Other | Everything else |

### Viewing Interruptions

The main screen shows:
- Current task's interruption count
- Total interruption time

For a full log, open the Interruptions view from the menu.

---

## Taking Notes

### Quick Note Capture

Capture notes without disrupting your flow:
1. Click **"Add Note"** (or press `Ctrl+N` / `Cmd+N`)
2. Type your note
3. Press Enter or click Save

Notes are automatically linked to your current task.

### Note Examples

- Callback numbers during calls
- Action items from meetings
- Ideas to explore later
- Issues encountered

### Viewing Notes

Access your notes from the Notes view:
- See all notes chronologically
- Filter by task
- Search note content
- Edit or delete notes

---

## Viewing Analytics

### Concentration Score

Your concentration score measures focus quality:

```
Concentration = (Work Time - Interruption Time) / Work Time × 100
```

| Score | Rating |
|-------|--------|
| 90%+ | Excellent |
| 80-89% | Good |
| 70-79% | Fair |
| Below 70% | Needs improvement |

### Other Metrics

| Metric | Description |
|--------|-------------|
| Total Planned Time | Sum of all task durations |
| Total Actual Time | Time actually spent working |
| Schedule Adherence | How closely you followed the plan |
| Tasks Completed | Number finished vs. total |
| Interruption Count | Total interruptions logged |
| Interruption Time | Total time spent interrupted |

### Task Performance

See details for each task:
- Planned vs. actual duration
- Variance (over/under time)
- Interruption count and time

---

## Exporting Data

### Excel Export

Export your complete day's data:
1. Click **"Export"** (or go to Menu → Export)
2. Choose Excel format
3. Save the downloaded file

The Excel file contains:
- **Tasks sheet**: All task details
- **Interruptions sheet**: Complete interruption log
- **Notes sheet**: All captured notes
- **Summary sheet**: Analytics and metrics

### CSV Export

For compatibility with other tools:
1. Click **"Export"**
2. Choose CSV format
3. Separate files are downloaded for each data type

### Using Export Data

Your exported data is perfect for:
- Uploading to cloud storage
- AI analysis of productivity patterns
- Time tracking reports
- Personal analytics

---

## Settings

Access settings from the menu or gear icon.

### Theme

| Option | Description |
|--------|-------------|
| Light | Light background |
| Dark | Dark background |
| System | Match device preference |

### Alerts

| Setting | Description | Default |
|---------|-------------|---------|
| Task Warning | Time before task end to warn | 5 minutes |
| Fixed Task Alert | Time before fixed task alert | 10 minutes |
| Sound | Enable audio alerts | On |
| Vibration | Enable vibration (mobile) | On |

---

## Tips & Best Practices

### Planning Your Schedule

1. **Be realistic** about task durations—add buffer time
2. **Mark meetings as fixed** so they're protected
3. **Group similar tasks** together
4. **Include breaks** as fixed tasks

### During Your Day

1. **Complete tasks promptly** when finished
2. **Log ALL interruptions** for accurate data
3. **Add notes** during or right after events
4. **Check lag indicator** regularly

### For Better Focus

1. **Minimize distractions** before starting
2. **Use the warning alerts** to wrap up tasks
3. **Review your analytics** daily to improve
4. **Adjust future schedules** based on actual times

### Common Patterns

| Pattern | Solution |
|---------|----------|
| Always running over | Add 20% buffer to estimates |
| Many short interruptions | Batch similar interruptions |
| Low concentration score | Identify top interrupt sources |
| Missing fixed tasks | Set earlier warnings |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Complete current task |
| `I` | Start/stop interruption |
| `R` | Resume from interruption |
| `Ctrl/Cmd + N` | Add new note |
| `Ctrl/Cmd + E` | Export data |
| `Esc` | Close panels/modals |

---

## Troubleshooting

### Data Not Saving

The app uses browser localStorage. If data isn't persisting:
- Check if you're in private/incognito mode
- Ensure localStorage isn't disabled
- Check if storage quota is full

### Import Errors

Common import issues:
- **Missing columns**: Ensure all 4 required columns exist
- **Invalid times**: Use 24-hour or 12-hour AM/PM format
- **Invalid duration**: Check duration format
- **Invalid type**: Use "fixed" or "flexible" only

### Timer Seems Inaccurate

The timer uses high-precision timestamps. If it seems off:
- Check if other tabs are throttling the browser
- Ensure your device's clock is accurate
- Try refreshing the page

---

## User Stories Reference

This application was designed around 33 user stories across 9 feature areas:

| Feature Area | Stories |
|--------------|---------|
| Task Import & Setup | 4 |
| Timer & Tracking | 5 |
| Schedule Lag & Alerts | 3 |
| Interruption Management | 5 |
| Notes System | 4 |
| Analytics & Scoring | 3 |
| Data Export | 3 |
| Day Reset | 3 |
| Settings | 3 |

For detailed user stories, see the [User Stories Document](../time-micromanager-user-stories.md).

---

**Document Version:** 1.0
**Last Updated:** 2025-12-17
