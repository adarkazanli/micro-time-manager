# Time Micromanager — User Stories

---

## Epic 1: Task Import & Schedule Setup

### US-1.1: Upload Task Spreadsheet
**As a** user  
**I want to** upload an Excel or CSV file containing my daily tasks  
**So that** I can quickly populate my schedule without manual entry

**Acceptance Criteria:**
- System accepts .xlsx, .xls, and .csv file formats
- Upload via drag-and-drop or file browser
- Validation errors display specific row/column issues
- Preview of parsed tasks shown before confirmation

---

### US-1.2: Define Task Fields
**As a** user  
**I want to** specify task name, start time, duration, and type (fixed/flexible) in my spreadsheet  
**So that** the system understands how to schedule and track each task

**Acceptance Criteria:**
- Required columns: Task Name, Start Time, Duration, Type
- Duration supports formats: "30s", "5m", "1h 30m", "01:30:00"
- Type accepts: "fixed" or "flexible" (case-insensitive)
- System rejects files missing required columns with clear error message

---

### US-1.3: Review and Adjust Imported Schedule
**As a** user  
**I want to** review the imported schedule and make adjustments before starting  
**So that** I can correct any errors or make last-minute changes

**Acceptance Criteria:**
- Display all tasks in chronological order after import
- Allow inline editing of task name, time, duration, type
- Allow reordering of flexible tasks via drag-and-drop
- "Confirm Schedule" button locks in the plan and enables tracking

---

### US-1.4: Spreadsheet Template Download
**As a** new user  
**I want to** download a template spreadsheet  
**So that** I know the exact format required for import

**Acceptance Criteria:**
- Download link available on upload screen
- Template includes header row with required columns
- Template includes 2-3 example rows demonstrating format
- Available in both .xlsx and .csv formats

---

## Epic 2: Timer & Active Task Tracking

### US-2.1: Start Day / Begin Tracking
**As a** user  
**I want to** start my day with a single action  
**So that** tracking begins on my first scheduled task

**Acceptance Criteria:**
- "Start Day" button activates timer for first task
- Current time becomes actual start time for first task
- System transitions to active tracking view

---

### US-2.2: Countdown Timer Display
**As a** user  
**I want to** see a countdown timer showing remaining time for the current task  
**So that** I know how much time I have left

**Acceptance Criteria:**
- Timer displays in MM:SS format for tasks under 1 hour
- Timer displays in HH:MM:SS format for tasks 1 hour or longer
- Timer updates every second
- Large, prominent display easily visible at a glance

---

### US-2.3: Overdrawn Time Alert
**As a** user  
**I want to** see a visual alert when I exceed my allocated time  
**So that** I know I'm running over on the current task

**Acceptance Criteria:**
- Timer turns red when reaching 0:00
- Timer displays negative time (e.g., "-03:45")
- Optional: audio/vibration alert at zero (configurable)
- Overdrawn state persists until task is completed

---

### US-2.4: Complete Task and Advance
**As a** user  
**I want to** mark a task complete and automatically move to the next task  
**So that** tracking continues seamlessly

**Acceptance Criteria:**
- "Complete Task" button ends current task timer
- System records actual end time and total duration
- Next task's timer begins immediately
- Completed task moves to "done" state in schedule view

---

### US-2.5: View Current Task Details
**As a** user  
**I want to** see the current task name and planned duration prominently displayed  
**So that** I always know what I should be working on

**Acceptance Criteria:**
- Task name displayed in large, readable text
- Planned duration shown alongside countdown
- Task type (fixed/flexible) indicated visually

---

## Epic 3: Schedule Lag & Alerts

### US-3.1: Display Schedule Lag
**As a** user  
**I want to** see how far behind (or ahead of) schedule I am  
**So that** I can adjust my pace accordingly

**Acceptance Criteria:**
- Lag calculated as: current time minus planned start time of current task
- Display format: "X min behind" or "X min ahead"
- Updates in real-time as time passes
- Visual indicator (color/icon) for behind vs. ahead

---

### US-3.2: Fixed Task Collision Warning
**As a** user  
**I want to** receive a warning if my current pace will cause me to miss a fixed task  
**So that** I can take action to avoid being late

**Acceptance Criteria:**
- System continuously calculates projected completion of current task
- Warning appears when projected time conflicts with next fixed task
- Warning displays: "At current pace, you will be X minutes late for [Fixed Task Name]"
- Warning updates dynamically as time progresses

---

### US-3.3: Upcoming Fixed Task Reminder
**As a** user  
**I want to** see upcoming fixed tasks prominently  
**So that** I don't lose track of immovable commitments

**Acceptance Criteria:**
- Next fixed task displayed with countdown to start time
- Fixed tasks visually differentiated in schedule view
- Optional: alert at configurable time before fixed task (e.g., 5 min warning)

---

## Epic 4: Interruption Management

### US-4.1: Log an Interruption
**As a** user  
**I want to** pause my current task with one click when interrupted  
**So that** interruptions are tracked separately from task time

**Acceptance Criteria:**
- "Interrupt" button always visible during active task
- Clicking pauses task timer immediately
- Interruption timer begins automatically
- UI clearly indicates "Interrupted" state

---

### US-4.2: Resume from Interruption
**As a** user  
**I want to** resume my task with one click  
**So that** I can continue tracking with minimal friction

**Acceptance Criteria:**
- "Resume" button visible during interruption
- Clicking stops interruption timer
- Task timer resumes from where it paused
- Interruption duration logged to current task

---

### US-4.3: Add Interruption Note
**As a** user  
**I want to** optionally add a reason or note to an interruption  
**So that** I can analyze what's causing my interruptions

**Acceptance Criteria:**
- Optional text field available during or after interruption
- Predefined quick-select categories (e.g., "Phone call", "Colleague", "Personal", "Pet")
- Custom text entry supported
- Note saved with interruption record

---

### US-4.4: View Interruption Count and Time
**As a** user  
**I want to** see the number of interruptions and total interruption time for the current task  
**So that** I have real-time awareness of my focus quality

**Acceptance Criteria:**
- Display format: "Interruptions: X | Total: Xm Xs"
- Visible on main tracking screen
- Updates immediately when interruption ends

---

### US-4.5: View Interruption Log
**As a** user  
**I want to** see a detailed log of all interruptions  
**So that** I can review patterns and causes

**Acceptance Criteria:**
- List view showing all interruptions chronologically
- Each entry shows: timestamp, duration, associated task, note/reason
- Filterable by task or date range
- Accessible from menu or dashboard

---

## Epic 5: Notes System

### US-5.1: Quick Note Capture
**As a** user  
**I want to** quickly add a note without disrupting my workflow  
**So that** I can capture important information (like callback numbers) immediately

**Acceptance Criteria:**
- "Add Note" button always accessible (floating or in header)
- Keyboard shortcut available (e.g., Ctrl+N or Cmd+N)
- Note input appears as modal or slide-in panel
- Auto-saves on close or submit

---

### US-5.2: Associate Note with Task
**As a** user  
**I want to** have notes automatically linked to my current task  
**So that** I have context when reviewing later

**Acceptance Criteria:**
- Notes automatically tagged with current task name
- Timestamp recorded automatically
- Option to associate with different task if needed

---

### US-5.3: View All Notes
**As a** user  
**I want to** see all my notes in one place  
**So that** I can find information I captured during the day

**Acceptance Criteria:**
- Notes panel/view accessible from main menu
- Display in chronological order (newest first by default)
- Show task association and timestamp for each note
- Search/filter functionality

---

### US-5.4: Edit and Delete Notes
**As a** user  
**I want to** edit or delete notes  
**So that** I can correct mistakes or remove outdated information

**Acceptance Criteria:**
- Edit button on each note opens inline editor
- Delete button with confirmation prompt
- Changes saved immediately

---

## Epic 6: Analytics & Scoring

### US-6.1: View Concentration Score
**As a** user  
**I want to** see a concentration score for my day  
**So that** I can measure my focus quality objectively

**Acceptance Criteria:**
- Score calculated as: (Work Time - Interruption Time) / Work Time × 100
- Displayed as percentage with visual indicator (gauge, progress bar)
- Updates in real-time throughout the day
- Shown on dashboard and in export

---

### US-6.2: View Efficiency Metrics
**As a** user  
**I want to** see summary metrics for my day  
**So that** I can understand my productivity patterns

**Acceptance Criteria:**
- Metrics displayed:
  - Total planned time vs. actual time
  - Number of tasks completed
  - Total interruptions (count and duration)
  - Schedule adherence percentage
  - Average time per task vs. planned
- Accessible from analytics dashboard

---

### US-6.3: Task-Level Performance Summary
**As a** user  
**I want to** see performance details for each completed task  
**So that** I can identify which tasks ran over or had issues

**Acceptance Criteria:**
- List of tasks with: planned vs. actual duration, variance, interruption count
- Visual indicators for over/under time
- Sortable by variance or interruption count

---

## Epic 7: Data Export

### US-7.1: Export Day Data to Excel
**As a** user  
**I want to** export my day's data to an Excel file  
**So that** I can upload it to cloud storage for AI analysis

**Acceptance Criteria:**
- "Export" button accessible from menu or end-of-day screen
- Output format: .xlsx (Excel)
- File contains:
  - Task log sheet (chronological)
  - Interruption log sheet
  - Notes sheet
  - Summary metrics sheet
- Download initiates immediately

---

### US-7.2: Export to CSV
**As a** user  
**I want to** export my data as CSV  
**So that** I have a universal format option

**Acceptance Criteria:**
- CSV export option alongside Excel
- Separate files for tasks, interruptions, notes, and summary (or single combined file)
- Proper escaping of special characters

---

### US-7.3: Chronological Task Log in Export
**As a** user  
**I want to** see tasks in chronological order in my export  
**So that** my data is organized for sequential analysis

**Acceptance Criteria:**
- Tasks ordered by actual start time
- Columns include: Task Name, Type, Planned Start, Actual Start, Planned Duration, Actual Duration, Variance, Interruption Count, Interruption Time, Notes

---

## Epic 8: Day Reset & New Schedule

### US-8.1: Reset Day / Start New Day
**As a** user  
**I want to** clear all current data and start fresh with a new schedule  
**So that** I can begin each day with a clean slate

**Acceptance Criteria:**
- "Start New Day" or "Reset" option in menu
- Confirmation dialog: "Are you sure? All unsaved data will be lost."
- Clears: all tasks, interruptions, notes, timer state, metrics
- Returns to upload/setup screen

---

### US-8.2: Export Before Reset Prompt
**As a** user  
**I want to** be prompted to export my data before resetting  
**So that** I don't accidentally lose my work

**Acceptance Criteria:**
- Reset flow presents option: "Export data before clearing?"
- Options: [Export & Reset] [Reset Without Exporting] [Cancel]
- "Export & Reset" downloads file then clears data
- Clear visual distinction between destructive and safe options

---

### US-8.3: Upload New Schedule After Reset
**As a** user  
**I want to** upload a new spreadsheet immediately after reset  
**So that** the transition to a new day is seamless

**Acceptance Criteria:**
- After reset, user lands on upload screen
- Same upload flow as initial setup (US-1.1)
- Previous day's data completely absent

---

## Epic 9: Settings & Configuration

### US-9.1: Configure Warning Thresholds
**As a** user  
**I want to** set when I receive warnings (e.g., 5 minutes before task ends)  
**So that** alerts match my preferences

**Acceptance Criteria:**
- Settings panel accessible from menu
- Configurable: task ending warning threshold (default: off or 5 min)
- Configurable: fixed task approaching warning (default: 10 min)
- Settings persist in local storage

---

### US-9.2: Toggle Sound/Vibration Alerts
**As a** user  
**I want to** enable or disable audio alerts  
**So that** I can use the app in quiet environments

**Acceptance Criteria:**
- Toggle for sound on/off
- Toggle for vibration on/off (mobile)
- Settings persist across sessions

---

### US-9.3: Dark Mode / Light Mode
**As a** user  
**I want to** switch between dark and light themes  
**So that** I can use the app comfortably in different lighting conditions

**Acceptance Criteria:**
- Toggle in settings or quick-access button
- Respects system preference by default
- Manual override persists

---

## Story Summary

| Epic | Story Count |
|------|-------------|
| 1. Task Import & Setup | 4 |
| 2. Timer & Active Task Tracking | 5 |
| 3. Schedule Lag & Alerts | 3 |
| 4. Interruption Management | 5 |
| 5. Notes System | 4 |
| 6. Analytics & Scoring | 3 |
| 7. Data Export | 3 |
| 8. Day Reset & New Schedule | 3 |
| 9. Settings & Configuration | 3 |
| **Total** | **33** |

---

## Priority Ranking (MVP vs. Future)

### MVP (Must Have)
- US-1.1, US-1.2, US-1.3 (Import & Setup)
- US-2.1, US-2.2, US-2.3, US-2.4, US-2.5 (Timer Core)
- US-3.1 (Schedule Lag)
- US-4.1, US-4.2, US-4.4 (Interruption Core)
- US-5.1, US-5.3 (Notes Core)
- US-6.1 (Concentration Score)
- US-7.1 (Excel Export)
- US-8.1, US-8.2, US-8.3 (Day Reset)

### Post-MVP (Should Have)
- US-1.4 (Template Download)
- US-3.2, US-3.3 (Collision Warnings)
- US-4.3, US-4.5 (Interruption Details)
- US-5.2, US-5.4 (Notes Enhancements)
- US-6.2, US-6.3 (Advanced Analytics)
- US-7.2, US-7.3 (Export Options)
- US-9.1, US-9.2, US-9.3 (Settings)

---

**Document Version:** 1.0  
**Last Updated:** December 17, 2025
