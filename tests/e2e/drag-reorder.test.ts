import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Create a test schedule with flexible tasks for drag testing
 */
function createDragTestSchedule(): string {
	const filePath = path.join(fixturesDir, 'drag-test-schedule.xlsx');

	if (!fs.existsSync(fixturesDir)) {
		fs.mkdirSync(fixturesDir, { recursive: true });
	}

	const data = [
		{
			'Task Name': 'Task A',
			'Start Time': '09:00',
			Duration: '5m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Task B',
			'Start Time': '09:05',
			Duration: '5m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Task C',
			'Start Time': '09:10',
			Duration: '5m',
			Type: 'flexible'
		},
		{
			'Task Name': 'Task D',
			'Start Time': '09:15',
			Duration: '5m',
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
 * Get task names in order from the impact panel
 */
async function getTaskOrder(page: import('@playwright/test').Page): Promise<string[]> {
	const impactPanel = page.getByTestId('impact-panel');
	const taskRows = impactPanel.getByTestId('impact-task-row');
	const count = await taskRows.count();
	const names: string[] = [];
	for (let i = 0; i < count; i++) {
		const name = await taskRows.nth(i).getByTestId('task-name').textContent();
		if (name) names.push(name.trim());
	}
	return names;
}

test.describe('Drag and Drop Reordering', () => {
	test.beforeEach(async ({ page }) => {
		createDragTestSchedule();
		// Clear localStorage before each test
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test('can drag a flexible task to reorder it', async ({ page }) => {
		// Capture console messages
		page.on('console', msg => {
			if (msg.text().includes('🎯')) {
				console.log('BROWSER:', msg.text());
			}
		});

		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'drag-test-schedule.xlsx'));

		// Start day (no auto-start)
		await page.getByTestId('start-day-btn').click();

		// Start Task A first so it becomes current (currentIndex = 0)
		// This allows us to drag tasks that come after it
		const impactPanel = page.getByTestId('impact-panel');
		const taskARow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARow.hover();
		await taskARow.getByTestId('start-task-btn').click();

		// Verify initial order
		const initialOrder = await getTaskOrder(page);
		console.log('Initial order:', initialOrder);
		expect(initialOrder).toEqual(['Task A', 'Task B', 'Task C', 'Task D']);

		// Now try to drag Task B to Task D's position using page.evaluate
		// to directly call the component handlers
		const success = await page.evaluate(() => {
			const taskList = document.querySelector('[data-testid="task-list"]');
			if (!taskList) return { error: 'No task list found' };

			const taskItems = taskList.querySelectorAll('.task-item');
			if (taskItems.length < 4) return { error: 'Not enough task items' };

			// Get Task B row (index 1 in sorted order)
			const taskBItem = taskItems[1];
			const taskBRow = taskBItem.querySelector('[data-testid="impact-task-row"]');
			if (!taskBRow) return { error: 'No Task B row found' };

			// Get Task D item (index 3)
			const taskDItem = taskItems[3];

			// Create and dispatch dragstart on the row
			const dragStartEvent = new DragEvent('dragstart', {
				bubbles: true,
				cancelable: true,
				dataTransfer: new DataTransfer()
			});
			taskBRow.dispatchEvent(dragStartEvent);

			// Create and dispatch dragover on task D item
			const dragOverEvent = new DragEvent('dragover', {
				bubbles: true,
				cancelable: true,
				dataTransfer: new DataTransfer()
			});
			taskDItem.dispatchEvent(dragOverEvent);

			// Create and dispatch drop on task D item
			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				cancelable: true,
				dataTransfer: new DataTransfer()
			});
			taskDItem.dispatchEvent(dropEvent);

			// Create and dispatch dragend
			const dragEndEvent = new DragEvent('dragend', {
				bubbles: true,
				cancelable: true
			});
			taskBRow.dispatchEvent(dragEndEvent);

			return { success: true };
		});

		console.log('Drag result:', success);

		// Wait for reorder to take effect
		await page.waitForTimeout(500);

		// Check the new order
		const newOrder = await getTaskOrder(page);
		console.log('New order:', newOrder);

		// Task B should now be after Task C
		expect(newOrder[0]).toBe('Task A'); // Current task stays first
		expect(newOrder.indexOf('Task B')).toBeGreaterThan(newOrder.indexOf('Task C'));
	});

	test('drag handle is visible for flexible pending tasks', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'drag-test-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();

		const impactPanel = page.getByTestId('impact-panel');

		// All flexible pending tasks should have drag handles
		const taskRows = impactPanel.getByTestId('impact-task-row');
		const count = await taskRows.count();

		for (let i = 0; i < count; i++) {
			const row = taskRows.nth(i);
			const dragHandle = row.getByTestId('drag-handle');
			await expect(dragHandle).toBeVisible();
		}
	});

	test('task row is marked as draggable', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'drag-test-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();

		const impactPanel = page.getByTestId('impact-panel');
		const taskA = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });

		// Check that the row has draggable attribute
		const draggable = await taskA.getAttribute('draggable');
		expect(draggable).toBe('true');
	});

	test('completed tasks cannot be dragged', async ({ page }) => {
		await uploadAndConfirmSchedule(page, path.join(fixturesDir, 'drag-test-schedule.xlsx'));

		// Start day
		await page.getByTestId('start-day-btn').click();

		// Start and complete Task A
		const impactPanel = page.getByTestId('impact-panel');
		const taskARow = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });
		await taskARow.hover();
		await taskARow.getByTestId('start-task-btn').click();
		await page.getByTestId('complete-task-btn').click();

		// Task A should now be completed and not draggable
		const completedTaskA = impactPanel.getByTestId('impact-task-row').filter({ hasText: 'Task A' });

		// Should not have a drag handle (should have placeholder instead)
		const dragHandle = completedTaskA.getByTestId('drag-handle');
		await expect(dragHandle).not.toBeVisible();

		// Should not have draggable attribute set to true
		const draggable = await completedTaskA.getAttribute('draggable');
		expect(draggable).toBe('false');
	});
});
