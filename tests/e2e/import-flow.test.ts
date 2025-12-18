import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

// Create test fixture files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

function createTestScheduleFile(): string {
	const filePath = path.join(fixturesDir, 'test-schedule.xlsx');

	// Create fixtures directory if it doesn't exist
	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	// Create a valid schedule workbook
	const data = [
		{
			'Task Name': 'Morning Standup',
			'Start Time': '09:00',
			Duration: '15m',
			Type: 'fixed'
		},
		{
			'Task Name': 'Deep Work',
			'Start Time': '09:15',
			Duration: '2h',
			Type: 'flexible'
		},
		{
			'Task Name': 'Lunch Break',
			'Start Time': '12:00',
			Duration: '1h',
			Type: 'flexible'
		}
	];

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
	XLSX.writeFile(workbook, filePath);

	return filePath;
}

function createInvalidScheduleFile(): string {
	const filePath = path.join(fixturesDir, 'invalid-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	// Create an invalid schedule (missing columns)
	const data = [
		{
			'Task Name': 'Task 1',
			Duration: '30m'
			// Missing Start Time and Type
		}
	];

	const worksheet = XLSX.utils.json_to_sheet(data);
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
	XLSX.writeFile(workbook, filePath);

	return filePath;
}

test.describe('Schedule Import Flow', () => {
	// Create fixtures before each test to avoid parallel worker issues
	test.beforeEach(() => {
		createTestScheduleFile();
		createInvalidScheduleFile();
	});

	test('displays file uploader on initial load', async ({ page }) => {
		await page.goto('/');

		// Check main elements are present
		await expect(page.getByText('Micro Time Manager')).toBeVisible();
		await expect(page.getByTestId('file-uploader')).toBeVisible();
		await expect(page.getByText('your schedule file here')).toBeVisible();
	});

	test('shows template download link', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByTestId('template-download')).toBeVisible();
		await expect(page.getByText('Download Template')).toBeVisible();
	});

	test('uploads valid file and shows preview', async ({ page }) => {
		// Capture console errors
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});
		page.on('pageerror', (err) => {
			errors.push(err.message);
		});

		await page.goto('/');

		// Wait for page to be interactive
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000); // Wait for Svelte to hydrate

		// Wait for file uploader to be ready
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Log any errors
		if (errors.length > 0) {
			console.log('Console errors before upload:', errors);
		}

		// Use native file chooser approach
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		// Log any new errors
		if (errors.length > 0) {
			console.log('Console errors after upload:', errors);
		}

		// Wait for either preview or error state
		await expect(
			page.getByTestId('schedule-preview').or(page.getByTestId('error-state')).or(page.getByTestId('loading-state'))
		).toBeVisible({ timeout: 10000 });

		// Verify tasks are displayed
		await expect(page.getByText('Morning Standup')).toBeVisible();
		await expect(page.getByText('Deep Work')).toBeVisible();
		await expect(page.getByText('Lunch Break')).toBeVisible();

		// Verify task count
		await expect(page.getByText('3 tasks')).toBeVisible();
	});

	test('shows validation errors for invalid file', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload invalid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'invalid-schedule.xlsx'));

		// Check error state appears
		await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 10000 });
		await expect(page.getByText('Import Failed')).toBeVisible();

		// Verify retry button exists
		await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
	});

	test('allows retry after validation error', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload invalid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'invalid-schedule.xlsx'));

		// Wait for error state
		await expect(page.getByTestId('error-state')).toBeVisible({ timeout: 10000 });

		// Click retry
		await page.getByRole('button', { name: 'Try Again' }).click();

		// Should return to upload screen
		await expect(page.getByTestId('file-uploader')).toBeVisible();
	});

	test('can edit task name inline', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload valid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		// Wait for preview
		await expect(page.getByTestId('schedule-preview')).toBeVisible({
			timeout: 10000
		});

		// Click on task name to edit
		await page.getByText('Morning Standup').click();

		// Find the input field and change the name
		const nameInput = page.locator('[data-testid="task-name-input"]');
		await nameInput.fill('Daily Standup');
		await nameInput.press('Enter');

		// Verify name changed
		await expect(page.getByText('Daily Standup')).toBeVisible();
	});

	test('can toggle task type', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload valid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		// Wait for preview
		await expect(page.getByTestId('schedule-preview')).toBeVisible({
			timeout: 10000
		});

		// Find a fixed task badge and click to toggle
		const fixedBadge = page.locator('[data-testid="type-badge-fixed"]').first();
		await fixedBadge.click();

		// Should now be flexible
		await expect(page.locator('[data-testid="type-badge-flexible"]').first()).toBeVisible();
	});

	test('can confirm schedule', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload valid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		// Wait for preview
		await expect(page.getByTestId('schedule-preview')).toBeVisible({
			timeout: 10000
		});

		// Click confirm
		await page.getByText('Confirm Schedule').click();

		// Should show success state
		await expect(page.getByTestId('success-state')).toBeVisible();
		await expect(page.getByText('Schedule Confirmed!')).toBeVisible();
	});

	test('can import another schedule after confirmation', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload valid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		await expect(page.getByTestId('schedule-preview')).toBeVisible({
			timeout: 10000
		});
		await page.getByText('Confirm Schedule').click();
		await expect(page.getByTestId('success-state')).toBeVisible();

		// Click import another
		await page.getByText('Import Another Schedule').click();

		// Should return to upload screen
		await expect(page.getByTestId('file-uploader')).toBeVisible();
	});

	test('can cancel and return to upload', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload valid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		// Wait for preview
		await expect(page.getByTestId('schedule-preview')).toBeVisible({
			timeout: 10000
		});

		// Click cancel
		await page.getByText('Cancel').click();

		// Should return to upload screen
		await expect(page.getByTestId('file-uploader')).toBeVisible();
	});

	test('persists tasks to localStorage after confirm', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(1000);
		await expect(page.getByTestId('file-uploader')).toBeVisible();

		// Upload valid file using native file chooser
		const [fileChooser] = await Promise.all([
			page.waitForEvent('filechooser'),
			page.evaluate(() => {
				const input = document.querySelector('input[type="file"]') as HTMLInputElement;
				input?.click();
			})
		]);
		await fileChooser.setFiles(path.join(fixturesDir, 'test-schedule.xlsx'));

		await expect(page.getByTestId('schedule-preview')).toBeVisible({
			timeout: 10000
		});
		await page.getByText('Confirm Schedule').click();
		await expect(page.getByTestId('success-state')).toBeVisible();

		// Check localStorage
		const tasks = await page.evaluate(() => {
			const stored = localStorage.getItem('tm_tasks');
			return stored ? JSON.parse(stored) : null;
		});

		expect(tasks).not.toBeNull();
		expect(tasks.length).toBe(3);
		expect(tasks[0].name).toBe('Morning Standup');
	});
});
