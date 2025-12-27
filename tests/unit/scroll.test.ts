/**
 * Unit tests for scroll utilities
 *
 * Feature: 012-fixed-task-reorder
 * Task: T006
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollToTaskAndHighlight } from '$lib/utils/scroll';

describe('scrollToTaskAndHighlight', () => {
	let mockElement: HTMLElement;
	let mockSetHighlightedId: (id: string | null) => void;

	beforeEach(() => {
		// Create mock element
		mockElement = document.createElement('div');
		mockElement.setAttribute('data-task-id', 'test-task-123');
		document.body.appendChild(mockElement);

		// Mock scrollIntoView
		mockElement.scrollIntoView = vi.fn();

		// Mock getBoundingClientRect to simulate element position
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 100,
			bottom: 150,
			left: 0,
			right: 100,
			width: 100,
			height: 50
		});

		// Mock window.innerHeight
		Object.defineProperty(window, 'innerHeight', {
			value: 800,
			writable: true
		});

		mockSetHighlightedId = vi.fn() as unknown as (id: string | null) => void;

		// Use fake timers
		vi.useFakeTimers();
	});

	afterEach(() => {
		document.body.removeChild(mockElement);
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('highlights the task immediately', () => {
		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId);

		expect(mockSetHighlightedId).toHaveBeenCalledWith('test-task-123');
	});

	it('removes highlight after default duration (1500ms)', () => {
		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId);

		expect(mockSetHighlightedId).toHaveBeenCalledWith('test-task-123');
		expect(mockSetHighlightedId).not.toHaveBeenCalledWith(null);

		vi.advanceTimersByTime(1500);

		expect(mockSetHighlightedId).toHaveBeenCalledWith(null);
	});

	it('removes highlight after custom duration', () => {
		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId, 500);

		vi.advanceTimersByTime(500);

		expect(mockSetHighlightedId).toHaveBeenCalledWith(null);
	});

	it('does not scroll when element is in viewport', () => {
		// Element is at top: 100, bottom: 150, within window.innerHeight of 800
		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId);

		expect(mockElement.scrollIntoView).not.toHaveBeenCalled();
	});

	it('scrolls when element is above viewport', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: -100,
			bottom: -50,
			left: 0,
			right: 100,
			width: 100,
			height: 50
		});

		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId);

		expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'center'
		});
	});

	it('scrolls when element is below viewport', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 900,
			bottom: 950,
			left: 0,
			right: 100,
			width: 100,
			height: 50
		});

		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId);

		expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'center'
		});
	});

	it('does nothing when element is not found', () => {
		scrollToTaskAndHighlight('nonexistent-task', mockSetHighlightedId);

		expect(mockSetHighlightedId).not.toHaveBeenCalled();
	});

	it('both scrolls and highlights when element is outside viewport', () => {
		mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
			top: 900,
			bottom: 950,
			left: 0,
			right: 100,
			width: 100,
			height: 50
		});

		scrollToTaskAndHighlight('test-task-123', mockSetHighlightedId);

		// Should both scroll and highlight
		expect(mockElement.scrollIntoView).toHaveBeenCalled();
		expect(mockSetHighlightedId).toHaveBeenCalledWith('test-task-123');
	});
});
