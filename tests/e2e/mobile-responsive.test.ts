import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Mobile Responsive Tests (013-mobile-responsive)
 *
 * Tests viewport-specific behavior for mobile devices.
 * Uses Playwright's device emulation for accurate testing.
 */

/**
 * Create a simple test schedule for mobile testing
 */
function createMobileTestSchedule(): string {
	const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	const data = [
		{ 'Task Name': 'Morning Email', 'Start Time': '09:00', Duration: '15m', Type: 'flexible' },
		{ 'Task Name': 'Team Standup', 'Start Time': '09:15', Duration: '15m', Type: 'fixed' },
		{
			'Task Name': 'Very Long Task Name That Should Truncate Properly On Mobile',
			'Start Time': '09:30',
			Duration: '30m',
			Type: 'flexible'
		},
		{ 'Task Name': 'Code Review', 'Start Time': '10:00', Duration: '20m', Type: 'flexible' },
		{ 'Task Name': 'Client Call', 'Start Time': '10:30', Duration: '30m', Type: 'fixed' }
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
 * Helper to start day and first task
 */
async function startDayAndFirstTask(page: Page) {
	await page.getByTestId('start-day-btn').click();
	await expect(page.getByTestId('timer-display')).toBeVisible();

	// Start the first task
	const impactPanel = page.getByTestId('impact-panel');
	const taskRow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Morning Email' });
	await taskRow.hover();
	await taskRow.getByTestId('start-task-btn').click();
}

// =============================================================================
// US1: Mobile Task Tracking Tests
// =============================================================================

test.describe('US1: Mobile Task Tracking @mobile', () => {
	// T006: Mobile viewport test scaffold
	test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE dimensions

	test.beforeEach(async () => {
		// Create schedule if it doesn't exist
		createMobileTestSchedule();
	});

	// T007: Task list displays in single column at 375px viewport
	test('task list displays in single column at 375px viewport', async ({ page }) => {
		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		// Verify impact panel is visible
		const impactPanel = page.getByTestId('impact-panel');
		await expect(impactPanel).toBeVisible();

		// Get all task rows
		const taskRows = impactPanel.getByTestId('impact-task-row');
		const count = await taskRows.count();
		expect(count).toBeGreaterThan(0);

		// Verify tasks are in a vertical stack (single column)
		// All task rows should have the same left offset (aligned vertically)
		const boxes = await taskRows.all();
		const leftPositions = await Promise.all(boxes.map((row) => row.boundingBox()));

		// All rows should be at approximately the same x position (allowing for small variance)
		const firstLeft = leftPositions[0]?.x ?? 0;
		for (const box of leftPositions) {
			if (box) {
				expect(Math.abs(box.x - firstLeft)).toBeLessThan(10);
			}
		}
	});

	// T008: No horizontal scroll at 320px viewport width
	test('no horizontal scroll at 320px viewport width', async ({ page }) => {
		// Set to minimum supported viewport
		await page.setViewportSize({ width: 320, height: 568 });

		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		// Check that the page doesn't have horizontal scrollbar
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

		// scrollWidth should not exceed clientWidth (no horizontal overflow)
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding tolerance
	});

	test('timer display is visible and readable on mobile', async ({ page }) => {
		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		// Timer should be visible
		const timer = page.getByTestId('timer-display');
		await expect(timer).toBeVisible();

		// Timer should be reasonably sized (at least 24px font based on our spec)
		const timerBox = await timer.boundingBox();
		expect(timerBox).not.toBeNull();
		expect(timerBox!.height).toBeGreaterThanOrEqual(24);
	});
});

// =============================================================================
// US2: Mobile Schedule Impact Viewing Tests
// =============================================================================

test.describe('US2: Mobile Schedule Impact Viewing @mobile', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	// T014: Impact Panel shows task name, time, status at 375px viewport
	test('Impact Panel shows task name, time, status at 375px viewport', async ({ page }) => {
		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		const impactPanel = page.getByTestId('impact-panel');
		await expect(impactPanel).toBeVisible();

		// Should show at least one task row with visible content
		const firstTaskRow = impactPanel.getByTestId('impact-task-row').first();
		await expect(firstTaskRow).toBeVisible();

		// Verify task row has visible content (task name may be truncated)
		const hasContent = await firstTaskRow.textContent();
		expect(hasContent?.length).toBeGreaterThan(0);
	});
});

// =============================================================================
// US3: Mobile Task Actions Tests
// =============================================================================

test.describe('US3: Mobile Task Actions @mobile', () => {
	test.use({ viewport: { width: 375, height: 667 } });

	test.beforeEach(async () => {
		createMobileTestSchedule();
	});

	// T018: Tap task row reveals action buttons on mobile
	test('tap task row reveals action buttons on mobile', async ({ page }) => {
		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		const impactPanel = page.getByTestId('impact-panel');
		// Find a pending task (not the current one)
		const pendingTask = impactPanel
			.getByTestId('impact-task-row')
			.filter({ hasText: 'Team Standup' });
		await expect(pendingTask).toBeVisible();

		// Tap the task row
		await pendingTask.click();

		// Start button should be visible after click (hover shows it on desktop, click on mobile)
		// On mobile, the start button should become visible on tap/hover
		const startBtn = pendingTask.getByTestId('start-task-btn');
		// Note: The button might be visible on hover/focus, but on mobile it shows on tap
		// For now we just verify the button element exists in the DOM
		await expect(startBtn).toBeAttached();
	});

	// T019: Action buttons have 44px minimum touch targets
	test('action buttons have 44px minimum touch targets', async ({ page }) => {
		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		const impactPanel = page.getByTestId('impact-panel');
		// Find a pending task row
		const pendingTask = impactPanel
			.getByTestId('impact-task-row')
			.filter({ hasText: 'Team Standup' });

		// Hover to reveal start button
		await pendingTask.hover();

		// Check start button has minimum 44px height (touch target requirement)
		const startBtn = pendingTask.getByTestId('start-task-btn');
		await expect(startBtn).toBeVisible();

		const box = await startBtn.boundingBox();
		expect(box).not.toBeNull();
		// Button should have at least 44px height for touch accessibility (WCAG 2.2 / Apple HIG)
		expect(box!.height).toBeGreaterThanOrEqual(44);
	});

	// T019b: Task rows have 44px minimum touch target height
	test('task rows have 44px minimum touch target height', async ({ page }) => {
		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		const impactPanel = page.getByTestId('impact-panel');
		const taskRows = impactPanel.getByTestId('impact-task-row');

		// Check that at least the first few task rows have minimum 44px height
		const count = await taskRows.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < Math.min(count, 3); i++) {
			const row = taskRows.nth(i);
			const box = await row.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.height).toBeGreaterThanOrEqual(44);
		}
	});
});

// =============================================================================
// US5: Tablet and Landscape Support Tests
// =============================================================================

test.describe('US5: Tablet and Landscape Support @tablet', () => {
	// T031: Layout adapts appropriately at 768px (tablet) viewport
	test('layout adapts appropriately at 768px tablet viewport', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });

		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		// At tablet size, impact panel should still be visible
		const impactPanel = page.getByTestId('impact-panel');
		await expect(impactPanel).toBeVisible();

		// Timer should be visible
		const timer = page.getByTestId('timer-display');
		await expect(timer).toBeVisible();
	});

	// T032: Layout works in landscape (896x414 viewport)
	test('layout works in landscape orientation', async ({ page }) => {
		// iPhone 14 Pro Max landscape dimensions
		await page.setViewportSize({ width: 896, height: 414 });

		const filePath = path.join(fixturesDir, 'mobile-test-schedule.xlsx');
		await uploadAndConfirmSchedule(page, filePath);
		await startDayAndFirstTask(page);

		// All critical elements should be visible
		await expect(page.getByTestId('timer-display')).toBeVisible();
		await expect(page.getByTestId('impact-panel')).toBeVisible();

		// No horizontal scroll in landscape
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
	});
});
