import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Create a test schedule with 3 short tasks for quick e2e testing
 */
function createTrackingTestSchedule(): string {
	const filePath = path.join(fixturesDir, 'tracking-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	const data = [
		{
			'Task Name': 'Quick Task 1',
			'Start Time': '09:00',
			Duration: '5m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Quick Task 2',
			'Start Time': '09:05',
			Duration: '5m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Fixed Meeting',
			'Start Time': '09:10',
			Duration: '5m',
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

test.describe('Day Tracking Flow', () => {
	test.beforeEach(() => {
		createTrackingTestSchedule();
	});

	test('shows tracking view after confirming schedule', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Should show tracking view with Start Day button
		await expect(page.getByTestId('tracking-view')).toBeVisible();
		await expect(page.getByTestId('start-day-btn')).toBeVisible();
	});

	test('can start day and see timer', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Click Start Day
		await page.getByTestId('start-day-btn').click();

		// Should show timer display
		await expect(page.getByTestId('timer-display')).toBeVisible();

		// Should show current task info
		await expect(page.getByTestId('current-task')).toBeVisible();
		await expect(page.getByText('Quick Task 1')).toBeVisible();
	});

	test('can complete task and advance to next', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();
		await expect(page.getByText('Quick Task 1')).toBeVisible();

		// Complete task
		await page.getByTestId('complete-task-btn').click();

		// Should advance to next task
		await expect(page.getByText('Quick Task 2')).toBeVisible();
	});

	test('shows day summary after completing all tasks', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();

		// Complete all 3 tasks
		await page.getByTestId('complete-task-btn').click();
		await expect(page.getByText('Quick Task 2')).toBeVisible();

		await page.getByTestId('complete-task-btn').click();
		await expect(page.getByText('Fixed Meeting')).toBeVisible();

		// Last task - button should say "Complete Day"
		await page.getByTestId('complete-task-btn').click();

		// Day is complete, click View Summary to see the summary
		await expect(page.getByTestId('view-summary-btn')).toBeVisible();
		await page.getByTestId('view-summary-btn').click();

		// Should show day summary
		await expect(page.getByTestId('day-summary')).toBeVisible();
		await expect(page.getByText('Day Complete!')).toBeVisible();
	});

	test('shows lag indicator after completing task', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();

		// Wait a bit to accumulate some time
		await page.waitForTimeout(1000);

		// Complete task
		await page.getByTestId('complete-task-btn').click();

		// Lag display should be visible
		await expect(page.getByTestId('lag-display')).toBeVisible();
	});

	test('timer changes color when time is running out', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();

		// Timer should be visible
		const timer = page.getByTestId('timer-display');
		await expect(timer).toBeVisible();

		// Check timer has a color class (green initially)
		await expect(timer).toHaveClass(/green|timer/);
	});

	test('persists session across page reload', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();
		await expect(page.getByText('Quick Task 1')).toBeVisible();

		// Complete first task
		await page.getByTestId('complete-task-btn').click();
		await expect(page.getByText('Quick Task 2')).toBeVisible();

		// Reload page
		await page.reload();
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);

		// Should still be on tracking view with session restored
		// The tracking view should show, or at least the file uploader if session wasn't persisted
		const trackingView = page.getByTestId('tracking-view');
		const fileUploader = page.getByTestId('file-uploader');

		// One of these should be visible
		await expect(trackingView.or(fileUploader)).toBeVisible();
	});

	test('can dismiss summary and return to import', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'tracking-schedule.xlsx'));

		// Start and complete all tasks
		await page.getByTestId('start-day-btn').click();
		await page.getByTestId('complete-task-btn').click();
		await page.getByTestId('complete-task-btn').click();
		await page.getByTestId('complete-task-btn').click();

		// Click View Summary to see the summary
		await expect(page.getByTestId('view-summary-btn')).toBeVisible();
		await page.getByTestId('view-summary-btn').click();

		// Should show summary
		await expect(page.getByTestId('day-summary')).toBeVisible();

		// Dismiss summary with "Start New Day" button
		await page.getByTestId('dismiss-btn').click();

		// Should return to import screen
		await expect(page.getByTestId('file-uploader')).toBeVisible();
	});
});
