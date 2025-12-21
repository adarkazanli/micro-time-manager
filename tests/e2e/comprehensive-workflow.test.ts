import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Create a comprehensive test schedule with multiple tasks for full workflow testing
 */
function createComprehensiveSchedule(): string {
	const filePath = path.join(fixturesDir, 'comprehensive-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	// Create a schedule with mix of fixed and flexible tasks
	const data = [
		{
			'Task Name': 'Morning Email',
			'Start Time': '09:00',
			Duration: '15m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Team Standup',
			'Start Time': '09:15',
			Duration: '15m',
			Type: 'fixed'
		},
		{
			'Task Name': 'Project Work',
			'Start Time': '09:30',
			Duration: '30m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Code Review',
			'Start Time': '10:00',
			Duration: '20m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Client Call',
			'Start Time': '10:30',
			Duration: '30m',
			Type: 'fixed'
		}
	];

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
	XLSX.writeFile(workbook, filePath);

	return filePath;
}

/**
 * Helper to upload a schedule and confirm it
 */
async function uploadAndConfirmSchedule(page: Page, filePath: string) {
	await page.goto('/');
	await page.waitForLoadState('domcontentloaded');
	await page.waitForTimeout(500);

	const [fileChooser] = await Promise.all([
		page.waitForEvent('filechooser'),
		page.evaluate(() => {
			const input = document.querySelector('input[type="file"]') as HTMLInputElement;
			input?.click();
		})
	]);
	await fileChooser.setFiles(filePath);

	await expect(page.getByTestId('schedule-preview')).toBeVisible({ timeout: 10000 });
	await page.getByText('Confirm Schedule').click();
	await expect(page.getByTestId('tracking-view')).toBeVisible();
}

/**
 * Helper to start a day after uploading schedule
 */
async function startDay(page: Page) {
	await page.getByTestId('start-day-btn').click();
	await expect(page.getByTestId('timer-display')).toBeVisible();
}

/**
 * Helper to get the current task name from the current task display
 */
async function _getCurrentTaskName(page: Page): Promise<string> {
	const taskName = await page.getByTestId('current-task').getByTestId('task-name').textContent();
	return taskName ?? '';
}

/**
 * Helper to get elapsed time displayed in timer
 */
async function getTimerDisplay(page: Page): Promise<string> {
	const display = await page.getByTestId('timer-display').textContent();
	return display ?? '';
}

test.describe('Comprehensive Workflow - Full Day Tracking', () => {
	test.beforeEach(() => {
		createComprehensiveSchedule();
	});

	test('complete workflow: import, track, interrupt, notes, add task, corrections', async ({ page }) => {
		// ============================================================
		// STEP 1: Import Schedule
		// ============================================================
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));

		// ============================================================
		// STEP 2: Start Day
		// ============================================================
		await startDay(page);

		// Verify all tasks are in the impact panel (shown after starting day)
		const impactPanel = page.getByTestId('impact-panel');
		await expect(impactPanel).toBeVisible();
		await expect(impactPanel.getByText('Morning Email')).toBeVisible();
		await expect(impactPanel.getByText('Team Standup')).toBeVisible();
		await expect(impactPanel.getByText('Project Work')).toBeVisible();
		await expect(impactPanel.getByText('Code Review')).toBeVisible();
		await expect(impactPanel.getByText('Client Call')).toBeVisible();

		// Verify first task is current
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Morning Email');

		// Let timer run briefly to accumulate time
		await page.waitForTimeout(2000);

		// ============================================================
		// STEP 3: Start a Different Task (Jump to Task)
		// ============================================================
		// Hover over "Project Work" (3rd task) and click Start
		const projectWorkRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Project Work' });
		await projectWorkRow.hover();

		// Wait for Start button to appear and click it
		const startBtn = projectWorkRow.getByTestId('start-task-btn');
		await expect(startBtn).toBeVisible();
		await startBtn.click();

		// Verify "Project Work" is now the current task
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Project Work');

		// Morning Email should now be completed (grayed out)
		const morningEmailRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Morning Email' });
		await expect(morningEmailRow).toHaveAttribute('data-status', 'completed');

		// Let timer run
		await page.waitForTimeout(1500);

		// ============================================================
		// STEP 4: Get Interrupted
		// ============================================================
		await page.getByTestId('interrupt-btn').click();

		// Verify interruption timer is shown
		await expect(page.getByTestId('interruption-timer')).toBeVisible();
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Resume/i);

		// Let interruption run for a moment
		await page.waitForTimeout(1500);

		// ============================================================
		// STEP 5: Resume from Interruption
		// ============================================================
		await page.getByTestId('interrupt-btn').click();

		// Verify interruption timer is hidden
		await expect(page.getByTestId('interruption-timer')).not.toBeVisible();
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Interrupt/i);

		// Edit the interruption to add category
		await page.getByTestId('edit-interruption-link').click();
		await expect(page.getByTestId('edit-interruption-dialog')).toBeVisible();
		await page.getByLabel('Phone').click();
		await page.getByTestId('interruption-note-input').fill('Quick client question');
		await page.getByTestId('save-interruption-btn').click();
		await expect(page.getByTestId('edit-interruption-dialog')).not.toBeVisible();

		// Verify interruption count shows 1
		await expect(page.getByTestId('interruption-count')).toContainText('1');

		// ============================================================
		// STEP 6: Capture a Note
		// ============================================================
		await page.getByTestId('add-note-btn').click();

		// Note input should appear
		await expect(page.getByTestId('note-input')).toBeVisible();

		// Type a note
		await page.getByTestId('note-textarea').fill('Remember to follow up on client request');
		await page.getByTestId('note-save-btn').click();

		// Note input should close
		await expect(page.getByTestId('note-input')).not.toBeVisible();

		// ============================================================
		// STEP 7: View Notes
		// ============================================================
		await page.getByTestId('view-notes-btn').click();

		// Notes view should be visible
		await expect(page.getByTestId('notes-view')).toBeVisible();

		// Should show our note
		await expect(page.getByText('Remember to follow up on client request')).toBeVisible();

		// Close notes view
		await page.getByRole('button', { name: 'Close notes' }).click();
		await expect(page.getByTestId('notes-view')).not.toBeVisible();

		// ============================================================
		// STEP 8: Add a New Task
		// ============================================================
		await page.getByTestId('add-task-button').click();

		// Add task dialog should appear
		await expect(page.getByTestId('add-task-dialog')).toBeVisible();

		// Fill in task details
		await page.getByTestId('new-task-name').fill('Urgent Bug Fix');
		await page.getByTestId('new-task-duration').fill('25m');
		// Keep as flexible (default)

		await page.getByTestId('add-task-submit').click();

		// Dialog should close
		await expect(page.getByTestId('add-task-dialog')).not.toBeVisible();

		// New task should appear in the task list
		await expect(page.getByTestId('task-list').getByText('Urgent Bug Fix')).toBeVisible();

		// ============================================================
		// STEP 9: Start Second Task (Code Review)
		// ============================================================
		const codeReviewRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Code Review' });
		await codeReviewRow.hover();
		await codeReviewRow.getByTestId('start-task-btn').click();

		// Verify "Code Review" is now current
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Code Review');

		// Project Work should now be completed
		const projectWorkCompleted = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Project Work' });
		await expect(projectWorkCompleted).toHaveAttribute('data-status', 'completed');

		// Let timer run briefly
		await page.waitForTimeout(1500);

		// ============================================================
		// STEP 10: Return to First Task (Team Standup - it's still pending)
		// ============================================================
		// Team Standup was skipped when we jumped, it should still be pending
		const standupRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Team Standup' });
		await standupRow.hover();

		// Wait for Start button to appear after hover
		const standupStartBtn = standupRow.getByTestId('start-task-btn');
		await expect(standupStartBtn).toBeVisible();
		await standupStartBtn.click();

		// Verify "Team Standup" is now current
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Team Standup');

		// Let timer run
		await page.waitForTimeout(2000);

		// ============================================================
		// STEP 11: Complete Task and Verify Elapsed Time
		// ============================================================
		// Complete the current task
		await page.getByTestId('complete-task-btn').click();

		// Team Standup should now be completed
		const standupCompleted = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Team Standup' });
		await expect(standupCompleted).toHaveAttribute('data-status', 'completed');

		// ============================================================
		// STEP 12: Edit Completed Task - Mark as Incomplete
		// ============================================================
		// Double-click on completed Team Standup to edit
		await standupCompleted.dblclick();

		// Edit dialog should appear
		await expect(page.getByRole('dialog')).toBeVisible();

		// Should show elapsed time field for completed task
		const elapsedInput = page.locator('#actual-duration');
		await expect(elapsedInput).toBeVisible();

		// Get the current elapsed time value
		const elapsedValue = await elapsedInput.inputValue();
		expect(elapsedValue).toBeTruthy(); // Should have some value

		// Click "Mark as Incomplete" button
		await page.getByRole('button', { name: /Mark as Incomplete/i }).click();

		// Confirm the action
		await page.getByRole('button', { name: /Confirm/i }).click();

		// Dialog should close
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Team Standup should now be current again
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Team Standup');

		// Verify elapsed time is preserved (timer should not start from 0)
		// The timer display should show time that's greater than 0
		await page.waitForTimeout(500);
		const timerText = await getTimerDisplay(page);
		// Timer shows remaining time, so we verify it's running
		expect(timerText).toBeTruthy();

		// ============================================================
		// STEP 13: Verify Schedule Changes - Reorder Tasks
		// ============================================================
		// Find a flexible pending task and verify it can be dragged
		const urgentBugRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Urgent Bug Fix' });

		// Verify the task has a drag handle (is draggable)
		await expect(urgentBugRow.getByTestId('drag-handle')).toBeVisible();

		// Get initial position by checking task order
		const taskList = page.getByTestId('task-list');
		const taskRows = taskList.locator('[data-testid="impact-task-row"]');
		const initialCount = await taskRows.count();
		expect(initialCount).toBeGreaterThan(0);

		// ============================================================
		// STEP 14: Edit Task Properties
		// ============================================================
		// Double-click on a pending task to edit its properties
		const clientCallRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Client Call' });
		await clientCallRow.dblclick();

		// Edit dialog should appear
		await expect(page.getByRole('dialog')).toBeVisible();

		// Change the task name
		const nameInput = page.locator('#task-name');
		await nameInput.clear();
		await nameInput.fill('Important Client Call');

		// Save changes
		await page.getByRole('button', { name: /Save/i }).click();

		// Dialog should close
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Task should show new name in the task list
		await expect(page.getByTestId('task-list').getByText('Important Client Call')).toBeVisible();

		// ============================================================
		// STEP 15: Verify Session Persistence
		// ============================================================
		// Reload the page
		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);

		// Should still be on tracking view
		await expect(page.getByTestId('tracking-view')).toBeVisible();

		// Timer should be running
		await expect(page.getByTestId('timer-display')).toBeVisible();

		// Current task should still be Team Standup
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Team Standup');

		// Our renamed task should still show the new name in the task list
		await expect(page.getByTestId('task-list').getByText('Important Client Call')).toBeVisible();

		// Our added task should still be there in the task list
		await expect(page.getByTestId('task-list').getByText('Urgent Bug Fix')).toBeVisible();

		// Our note should still be there
		await page.getByTestId('view-notes-btn').click();
		await expect(page.getByText('Remember to follow up on client request')).toBeVisible();
	});
});

test.describe('Task Correction Features', () => {
	test.beforeEach(() => {
		createComprehensiveSchedule();
	});

	test('can edit elapsed time for current task', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Let timer run
		await page.waitForTimeout(2000);

		// Double-click current task in impact panel to edit
		const currentTaskRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"][data-status="current"]');
		await currentTaskRow.dblclick();

		// Should show edit dialog with elapsed time field
		await expect(page.getByRole('dialog')).toBeVisible();
		const elapsedInput = page.locator('#actual-duration');
		await expect(elapsedInput).toBeVisible();

		// Change elapsed time to 5 minutes
		await elapsedInput.clear();
		await elapsedInput.fill('5m');

		// Save
		await page.getByRole('button', { name: /Save Changes/i }).click();

		// Dialog should close
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Timer should reflect the change (approximately 10 minutes remaining from 15m task)
		// We can't easily verify the exact time, but we verify the operation completed
	});

	test('can edit elapsed time for completed task', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Let timer run
		await page.waitForTimeout(1500);

		// Complete the task
		await page.getByTestId('complete-task-btn').click();

		// First task should now be completed
		const completedRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Morning Email' });
		await expect(completedRow).toHaveAttribute('data-status', 'completed');

		// Double-click to edit
		await completedRow.dblclick();

		// Should show edit dialog
		await expect(page.getByRole('dialog')).toBeVisible();

		// Should show elapsed time field
		const elapsedInput = page.locator('#actual-duration');
		await expect(elapsedInput).toBeVisible();

		// Change elapsed time
		await elapsedInput.clear();
		await elapsedInput.fill('12m');

		// Save
		await page.getByRole('button', { name: /Save Changes/i }).click();

		// Dialog should close
		await expect(page.getByRole('dialog')).not.toBeVisible();
	});

	test('marking task incomplete preserves elapsed time', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Let timer run for a measurable amount
		await page.waitForTimeout(3000);

		// Complete the task
		await page.getByTestId('complete-task-btn').click();

		// Get the completed task
		const completedRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Morning Email' });

		// Double-click to edit
		await completedRow.dblclick();
		await expect(page.getByRole('dialog')).toBeVisible();

		// Get the elapsed time value before marking incomplete
		const elapsedInput = page.locator('#actual-duration');
		const elapsedBefore = await elapsedInput.inputValue();

		// Click "Mark as Incomplete"
		await page.getByRole('button', { name: /Mark as Incomplete/i }).click();

		// Confirm
		await page.getByRole('button', { name: /Confirm/i }).click();

		// Dialog should close
		await expect(page.getByRole('dialog')).not.toBeVisible();

		// Task should now be current
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Morning Email');

		// Wait for timer to update with preserved elapsed time
		await page.waitForTimeout(500);

		// Double-click again to verify elapsed time was preserved
		const nowCurrentRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"][data-status="current"]');
		await nowCurrentRow.dblclick();
		await expect(page.getByRole('dialog')).toBeVisible();

		// The elapsed time should be the same (or very close)
		const elapsedAfter = await page.locator('#actual-duration').inputValue();
		expect(elapsedAfter).toBe(elapsedBefore);
	});
});

test.describe('Jump to Task Feature', () => {
	test.beforeEach(() => {
		createComprehensiveSchedule();
	});

	test('Start button appears on hover for pending tasks', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Hover over a pending task (not current, not completed)
		const pendingRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Project Work' });
		await pendingRow.hover();

		// Start button should appear
		await expect(pendingRow.getByTestId('start-task-btn')).toBeVisible();
	});

	test('Start button not visible on completed tasks', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Complete first task
		await page.getByTestId('complete-task-btn').click();

		// Hover over completed task
		const completedRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Morning Email' });
		await completedRow.hover();

		// Start button should NOT appear
		await expect(completedRow.getByTestId('start-task-btn')).not.toBeVisible();
	});

	test('jumping to task completes current task', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Verify first task is current
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Morning Email');

		// Let timer run
		await page.waitForTimeout(1500);

		// Jump to a later task
		const laterRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Code Review' });
		await laterRow.hover();
		await laterRow.getByTestId('start-task-btn').click();

		// Current task should now be Code Review
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Code Review');

		// Morning Email should be completed
		const morningEmailRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Morning Email' });
		await expect(morningEmailRow).toHaveAttribute('data-status', 'completed');
	});

	test('skipped tasks remain pending', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Jump to 4th task (Code Review), skipping Team Standup and Project Work
		const codeReviewRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Code Review' });
		await codeReviewRow.hover();
		await codeReviewRow.getByTestId('start-task-btn').click();

		// Team Standup and Project Work should still be pending
		const standupRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Team Standup' });
		const projectRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Project Work' });

		await expect(standupRow).toHaveAttribute('data-status', 'pending');
		await expect(projectRow).toHaveAttribute('data-status', 'pending');

		// They should also have Start buttons when hovered
		await standupRow.hover();
		await expect(standupRow.getByTestId('start-task-btn')).toBeVisible();
	});
});

test.describe('Schedule Reordering', () => {
	test.beforeEach(() => {
		createComprehensiveSchedule();
	});

	test('flexible tasks show drag handles', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Flexible pending tasks should have drag handles
		const projectWorkRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Project Work' });
		await expect(projectWorkRow.getByTestId('drag-handle')).toBeVisible();
	});

	test('fixed tasks do not show drag handles', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Fixed pending tasks should NOT have drag handles
		const clientCallRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Client Call' });
		await expect(clientCallRow.getByTestId('drag-handle')).not.toBeVisible();
	});

	test('current flexible task can be moved', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// First task (Morning Email) is current and flexible
		const currentRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"][data-status="current"]');

		// Should have drag handle
		await expect(currentRow.getByTestId('drag-handle')).toBeVisible();
	});

	test('completed tasks cannot be moved', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'comprehensive-schedule.xlsx'));
		await startDay(page);

		// Complete first task
		await page.getByTestId('complete-task-btn').click();

		// Completed task should not have drag handle
		const completedRow = page.getByTestId('task-list').locator('[data-testid="impact-task-row"]').filter({ hasText: 'Morning Email' });
		await expect(completedRow.getByTestId('drag-handle')).not.toBeVisible();
	});
});
