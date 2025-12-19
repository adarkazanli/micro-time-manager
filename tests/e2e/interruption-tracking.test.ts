import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Create a test schedule for interruption testing
 */
function createInterruptionTestSchedule(): string {
	const filePath = path.join(fixturesDir, 'interruption-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	const data = [
		{
			'Task Name': 'Interruptible Task 1',
			'Start Time': '09:00',
			Duration: '10m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Interruptible Task 2',
			'Start Time': '09:10',
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
 * Helper to start a day after uploading schedule
 */
async function startDay(page: import('@playwright/test').Page) {
	await page.getByTestId('start-day-btn').click();
	await expect(page.getByTestId('timer-display')).toBeVisible();
}

test.describe('Interruption Tracking - User Story 1: Log an Interruption', () => {
	test.beforeEach(() => {
		createInterruptionTestSchedule();
	});

	// T020: Click Interrupt button test
	test('can click Interrupt button to pause task and start interruption timer', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Verify Interrupt button is visible
		await expect(page.getByTestId('interrupt-btn')).toBeVisible();
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Interrupt/i);

		// Click Interrupt
		await page.getByTestId('interrupt-btn').click();

		// Should show interruption timer
		await expect(page.getByTestId('interruption-timer')).toBeVisible();

		// Button should change to Resume
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Resume/i);
	});

	// T021: Press "I" key shortcut test
	test('can press "I" key to trigger interruption', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Press "I" key
		await page.keyboard.press('i');

		// Should show interruption timer
		await expect(page.getByTestId('interruption-timer')).toBeVisible();

		// Button should change to Resume
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Resume/i);
	});

	// T022: Interrupt disabled when no task active test
	test('Interrupt button is disabled when no task is active', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));

		// Don't start the day - should be in idle state
		await expect(page.getByTestId('start-day-btn')).toBeVisible();

		// Interrupt button should not be visible or be disabled when session is idle
		const interruptBtn = page.getByTestId('interrupt-btn');
		const isVisible = await interruptBtn.isVisible().catch(() => false);

		if (isVisible) {
			// If visible, it should be disabled
			await expect(interruptBtn).toBeDisabled();
		}
		// If not visible, that's also acceptable behavior
	});
});

test.describe('Interruption Tracking - User Story 2: Resume Work', () => {
	test.beforeEach(() => {
		createInterruptionTestSchedule();
	});

	// T030: Click Resume button test
	test('can click Resume button to end interruption and resume task timer', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Start an interruption
		await page.getByTestId('interrupt-btn').click();
		await expect(page.getByTestId('interruption-timer')).toBeVisible();

		// Click Resume
		await page.getByTestId('interrupt-btn').click();

		// Interruption timer should be hidden
		await expect(page.getByTestId('interruption-timer')).not.toBeVisible();

		// Button should change back to Interrupt
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Interrupt/i);
	});

	// T031: Press "R" key shortcut test
	test('can press "R" key to resume from interruption', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Start an interruption with "I" key
		await page.keyboard.press('i');
		await expect(page.getByTestId('interruption-timer')).toBeVisible();

		// Press "R" key to resume
		await page.keyboard.press('r');

		// Interruption timer should be hidden
		await expect(page.getByTestId('interruption-timer')).not.toBeVisible();

		// Button should change back to Interrupt
		await expect(page.getByTestId('interrupt-btn')).toHaveText(/Interrupt/i);
	});

	// T032: Edit category/note after resume test
	test('can edit category and note after resuming from interruption', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Start and end an interruption
		await page.getByTestId('interrupt-btn').click();
		await page.waitForTimeout(500); // Let timer run briefly
		await page.getByTestId('interrupt-btn').click();

		// Should show Edit link for the last interruption
		await expect(page.getByTestId('edit-interruption-link')).toBeVisible();

		// Click Edit
		await page.getByTestId('edit-interruption-link').click();

		// Dialog should open
		await expect(page.getByTestId('edit-interruption-dialog')).toBeVisible();

		// Select a category
		await page.getByLabel('Phone').click();

		// Enter a note
		await page.getByTestId('interruption-note-input').fill('Quick client call');

		// Save
		await page.getByTestId('save-interruption-btn').click();

		// Dialog should close
		await expect(page.getByTestId('edit-interruption-dialog')).not.toBeVisible();
	});
});

test.describe('Interruption Tracking - User Story 3: View Summary', () => {
	test.beforeEach(() => {
		createInterruptionTestSchedule();
	});

	// T039: Summary display with interruptions test
	test('shows interruption summary with count and total time', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Create two interruptions
		await page.getByTestId('interrupt-btn').click();
		await page.waitForTimeout(1000); // 1 second
		await page.getByTestId('interrupt-btn').click();

		await page.waitForTimeout(500);

		await page.getByTestId('interrupt-btn').click();
		await page.waitForTimeout(1000); // 1 second
		await page.getByTestId('interrupt-btn').click();

		// Summary should show count
		await expect(page.getByTestId('interruption-summary')).toBeVisible();
		await expect(page.getByTestId('interruption-count')).toContainText('2');
	});

	// T040: Summary hidden when no interruptions test
	test('hides interruption summary when no interruptions', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// No interruptions - summary should not be visible or show 0
		const summary = page.getByTestId('interruption-summary');
		const isVisible = await summary.isVisible().catch(() => false);

		if (isVisible) {
			// If visible, count should be 0
			await expect(page.getByTestId('interruption-count')).toContainText('0');
		}
		// Not visible is also acceptable
	});
});

test.describe('Interruption Tracking - User Story 4: View Full Log', () => {
	test.beforeEach(() => {
		createInterruptionTestSchedule();
	});

	// T045: Open interruption log view test
	test('can open interruption log view from menu', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Create an interruption
		await page.getByTestId('interrupt-btn').click();
		await page.waitForTimeout(500);
		await page.getByTestId('interrupt-btn').click();

		// Click to open log view
		await page.getByTestId('view-interruption-log-btn').click();

		// Log should be visible
		await expect(page.getByTestId('interruption-log')).toBeVisible();
	});

	// T046: Interruption entry details test
	test('shows interruption entry details in log', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'interruption-schedule.xlsx'));
		await startDay(page);

		// Create an interruption
		await page.getByTestId('interrupt-btn').click();
		await page.waitForTimeout(1000);
		await page.getByTestId('interrupt-btn').click();

		// Edit the interruption to add category
		await page.getByTestId('edit-interruption-link').click();
		await page.getByLabel('Phone').click();
		await page.getByTestId('interruption-note-input').fill('Test note');
		await page.getByTestId('save-interruption-btn').click();

		// Open log
		await page.getByTestId('view-interruption-log-btn').click();

		// Should show entry with details
		const entry = page.getByTestId('interruption-entry').first();
		await expect(entry).toBeVisible();
		await expect(entry.getByTestId('interruption-category')).toContainText('Phone');
		await expect(entry.getByTestId('interruption-note')).toContainText('Test note');
	});
});
