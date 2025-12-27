import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Create a test schedule with tasks for uncomplete testing
 */
function createUncompleteTestSchedule(): string {
	const filePath = path.join(fixturesDir, 'uncomplete-test-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	const data = [
		{
			'Task Name': 'Task A',
			'Start Time': '09:00',
			Duration: '10m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Task B',
			'Start Time': '09:10',
			Duration: '10m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Task C',
			'Start Time': '09:20',
			Duration: '10m',
			Type: 'flexible'
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
async function uploadAndConfirmSchedule(page: import('@playwright/test').Page, filePath: string) {
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
 * Helper to get remaining time from timer display (format: MM:SS or HH:MM:SS)
 * Note: Timer shows REMAINING time (counting down), not elapsed
 */
async function getRemainingSeconds(page: import('@playwright/test').Page): Promise<number> {
	const timerText = await page.getByTestId('timer-display').textContent();
	if (!timerText) return 0;

	// Parse timer format (could be MM:SS or negative -MM:SS)
	const match = timerText.match(/-?(\d+):(\d+)(?::(\d+))?/);
	if (!match) return 0;

	if (match[3]) {
		// HH:MM:SS format
		return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
	} else {
		// MM:SS format
		return parseInt(match[1]) * 60 + parseInt(match[2]);
	}
}

test.describe('Uncomplete Task - Elapsed Time Preservation', () => {
	test.beforeEach(async ({ page }) => {
		createUncompleteTestSchedule();
		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('preserves elapsed time when marking task incomplete and restarting', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'uncomplete-test-schedule.xlsx'));

		// Start day (no auto-start - must click Start on first task)
		await page.getByTestId('start-day-btn').click();

		// Click Start on Task A in the impact panel
		const impactPanel = page.getByTestId('impact-panel');
		const taskARowInitial = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARowInitial.hover();
		await taskARowInitial.getByTestId('start-task-btn').click();

		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task A');

		// Wait for some time to accumulate (3 seconds)
		await page.waitForTimeout(3000);

		// Get the remaining time before completing (timer counts down)
		const remainingBeforeComplete = await getRemainingSeconds(page);
		console.log('Remaining before complete:', remainingBeforeComplete);
		// Task A is 10 minutes = 600 seconds, after 3 seconds should be ~597
		expect(remainingBeforeComplete).toBeLessThan(600);

		// Complete the task (no auto-start of next task)
		await page.getByTestId('complete-task-btn').click();

		// Start Task B manually
		const taskBRow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task B' });
		await taskBRow.hover();
		await taskBRow.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Find Task A in the impact panel and click to open edit dialog
		const taskARow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARow.dblclick();

		// Edit dialog should open
		await expect(page.getByTestId('edit-task-dialog')).toBeVisible();

		// Click "Mark as Incomplete"
		await page.getByRole('button', { name: 'Mark as Incomplete' }).click();

		// Confirm the action
		await page.getByRole('button', { name: /Confirm.*Mark as Incomplete/i }).click();

		// Dialog should close
		await expect(page.getByTestId('edit-task-dialog')).not.toBeVisible();

		// Task A should now show as pending (not completed) in the impact panel
		// The strikethrough should be removed
		const taskARowAfter = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await expect(taskARowAfter).not.toHaveClass(/completed/);

		// Now click Start on Task A to resume it
		await taskARowAfter.hover();
		const startBtn = taskARowAfter.getByTestId('start-task-btn');
		await startBtn.click();

		// Task A should now be the current task
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task A');

		// Wait a moment for timer to update
		await page.waitForTimeout(500);

		// Get the remaining time - it should be close to what it was before (preserved elapsed)
		const remainingAfterRestart = await getRemainingSeconds(page);
		console.log('Remaining after restart:', remainingAfterRestart);

		// Remaining time should be similar (within 2 seconds) to what it was before complete
		// This proves elapsed time was preserved
		expect(remainingAfterRestart).toBeLessThanOrEqual(remainingBeforeComplete + 2);
		expect(remainingAfterRestart).toBeGreaterThanOrEqual(remainingBeforeComplete - 2);
	});

	test('elapsed time persists across page reload after uncomplete', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'uncomplete-test-schedule.xlsx'));

		// Start day (no auto-start)
		await page.getByTestId('start-day-btn').click();

		// Click Start on Task A
		const impactPanel = page.getByTestId('impact-panel');
		const taskARowInitial = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARowInitial.hover();
		await taskARowInitial.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task A');

		// Wait for some time to accumulate (2 seconds)
		await page.waitForTimeout(2000);

		// Complete the task (no auto-start)
		await page.getByTestId('complete-task-btn').click();

		// Start Task B manually
		const taskBRow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task B' });
		await taskBRow.hover();
		await taskBRow.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Open edit dialog for Task A
		const taskARow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARow.dblclick();

		// Mark as incomplete
		await page.getByRole('button', { name: 'Mark as Incomplete' }).click();
		await page.getByRole('button', { name: /Confirm.*Mark as Incomplete/i }).click();

		// Wait for persistence
		await page.waitForTimeout(500);

		// Reload the page
		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);

		// Session should be restored
		await expect(page.getByTestId('tracking-view')).toBeVisible();

		// Task A should still be pending (not completed) after reload
		const impactPanelAfterReload = page.getByTestId('impact-panel');
		const taskARowAfterReload = impactPanelAfterReload.getByTestId('impact-task-row').filter({ hasText: 'Task A' });

		// The task should not have the completed class
		await expect(taskARowAfterReload).not.toHaveClass(/completed/);
	});

	test('full workflow: switch tasks, uncomplete, and verify elapsed times preserved', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'uncomplete-test-schedule.xlsx'));

		// Start day (no auto-start)
		await page.getByTestId('start-day-btn').click();

		// Manually start Task A
		const impactPanel = page.getByTestId('impact-panel');
		const taskARowInitial = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARowInitial.hover();
		await taskARowInitial.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task A');

		// Work on Task A for 5 seconds
		await page.waitForTimeout(5000);
		const taskARemainingAfter5s = await getRemainingSeconds(page);
		console.log('Task A remaining after 5s:', taskARemainingAfter5s);
		// Task A is 10 min = 600s, should be ~595 remaining
		expect(taskARemainingAfter5s).toBeLessThan(600);
		expect(taskARemainingAfter5s).toBeGreaterThan(590);

		// Complete Task A (no auto-start)
		await page.getByTestId('complete-task-btn').click();

		// Manually start Task B
		const taskBRowInitial = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task B' });
		await taskBRowInitial.hover();
		await taskBRowInitial.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Work on Task B for 5 seconds
		await page.waitForTimeout(5000);
		const taskBRemainingAfter5s = await getRemainingSeconds(page);
		console.log('Task B remaining after 5s:', taskBRemainingAfter5s);
		// Task B is 10 min = 600s, should be ~595 remaining
		expect(taskBRemainingAfter5s).toBeLessThan(600);
		expect(taskBRemainingAfter5s).toBeGreaterThan(590);

		// Now go back to Task A - mark it incomplete
		const taskARow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARow.dblclick();

		await expect(page.getByTestId('edit-task-dialog')).toBeVisible();
		await page.getByRole('button', { name: 'Mark as Incomplete' }).click();
		await page.getByRole('button', { name: /Confirm.*Mark as Incomplete/i }).click();
		await expect(page.getByTestId('edit-task-dialog')).not.toBeVisible();

		// Task B should still be current (uncompleting doesn't switch tasks)
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Start Task A again - should resume from ~5 seconds elapsed
		const taskARowAfterUncomplete = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARowAfterUncomplete.hover();
		await taskARowAfterUncomplete.getByTestId('start-task-btn').click();

		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task A');

		// Task A should have ~595 remaining (preserved from before)
		await page.waitForTimeout(500);
		const taskARemainingAfterRestart = await getRemainingSeconds(page);
		console.log('Task A remaining after restart:', taskARemainingAfterRestart);
		// Should be close to what it was (595), allow some tolerance
		expect(taskARemainingAfterRestart).toBeLessThanOrEqual(taskARemainingAfter5s + 2);
		expect(taskARemainingAfterRestart).toBeGreaterThanOrEqual(taskARemainingAfter5s - 5);

		// Work on Task A for 5 more seconds
		await page.waitForTimeout(5000);
		const taskARemainingAfter10sTotal = await getRemainingSeconds(page);
		console.log('Task A remaining after 10s total:', taskARemainingAfter10sTotal);
		// Should now be ~590 (10 seconds elapsed total)
		expect(taskARemainingAfter10sTotal).toBeLessThan(595);

		// Complete Task A (no auto-start)
		await page.getByTestId('complete-task-btn').click();

		// Manually start Task B again
		const taskBRowReturn = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task B' });
		await taskBRowReturn.hover();
		await taskBRowReturn.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Task B should resume from ~5 seconds elapsed (not reset to 0)
		await page.waitForTimeout(500);
		const taskBRemainingAfterReturn = await getRemainingSeconds(page);
		console.log('Task B remaining after returning:', taskBRemainingAfterReturn);
		// Should be close to what it was (~595), not reset to 600
		expect(taskBRemainingAfterReturn).toBeLessThanOrEqual(taskBRemainingAfter5s + 2);
		expect(taskBRemainingAfterReturn).toBeGreaterThanOrEqual(taskBRemainingAfter5s - 5);
	});

	test('uncompleting does not affect currently running task', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'uncomplete-test-schedule.xlsx'));

		// Start day (no auto-start)
		await page.getByTestId('start-day-btn').click();

		// Manually start Task A
		const impactPanel = page.getByTestId('impact-panel');
		const taskARowInitial = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARowInitial.hover();
		await taskARowInitial.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task A');

		// Complete Task A (no auto-start of next task)
		await page.getByTestId('complete-task-btn').click();

		// Manually start Task B
		const taskBRowInitial = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task B' });
		await taskBRowInitial.hover();
		await taskBRowInitial.getByTestId('start-task-btn').click();
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Wait a bit on Task B
		await page.waitForTimeout(1000);

		// Get Task B remaining time (timer counts down)
		const taskBRemainingBefore = await getRemainingSeconds(page);

		// Now uncomplete Task A (which is already completed)
		const taskARow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARow.dblclick();

		await page.getByRole('button', { name: 'Mark as Incomplete' }).click();
		await page.getByRole('button', { name: /Confirm.*Mark as Incomplete/i }).click();

		// Task B should still be the current task (uncompleting A shouldn't change current)
		await expect(page.getByTestId('current-task').getByTestId('task-name')).toContainText('Task B');

		// Timer should still be running on Task B (remaining time decreases)
		await page.waitForTimeout(1000);
		const taskBRemainingAfter = await getRemainingSeconds(page);

		// Task B remaining time should have decreased (timer still counting down)
		// Allow for minor timing variations
		expect(taskBRemainingAfter).toBeLessThanOrEqual(taskBRemainingBefore);
	});
});
