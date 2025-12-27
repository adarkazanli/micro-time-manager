<script lang="ts">
	/**
	 * ScheduleStartPicker Component
	 *
	 * Feature: 011-auto-start-time
	 * Tasks: T033-T037 (User Story 1)
	 *
	 * Allows users to choose between "Start Now" (current time)
	 * or a custom start time for their schedule.
	 */

	import type { ScheduleStartMode, ScheduleConfig } from '$lib/types';

	interface Props {
		/** Current schedule start mode */
		mode: ScheduleStartMode;
		/** Custom start time (required when mode is 'custom') */
		customTime: Date | null;
		/** Whether the picker is disabled (e.g., session already started) */
		disabled?: boolean;
		/** Callback when configuration changes */
		onChange: (config: ScheduleConfig) => void;
	}

	let { mode, customTime, disabled = false, onChange }: Props = $props();

	// Local state for time input (HH:MM format)
	let timeInputValue = $state<string>('');

	// Initialize time input value from customTime prop
	$effect(() => {
		if (customTime) {
			const hours = String(customTime.getHours()).padStart(2, '0');
			const minutes = String(customTime.getMinutes()).padStart(2, '0');
			timeInputValue = `${hours}:${minutes}`;
		} else {
			// Default to current time rounded to next 5 minutes
			// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date is used for calculation, not reactive state
			const now = new Date();
			const minutes = Math.ceil(now.getMinutes() / 5) * 5;
			now.setMinutes(minutes);
			now.setSeconds(0);
			now.setMilliseconds(0);
			if (minutes >= 60) {
				now.setHours(now.getHours() + 1);
				now.setMinutes(0);
			}
			const hours = String(now.getHours()).padStart(2, '0');
			const mins = String(now.getMinutes()).padStart(2, '0');
			timeInputValue = `${hours}:${mins}`;
		}
	});

	/**
	 * Handle mode change (radio toggle)
	 */
	function handleModeChange(newMode: ScheduleStartMode) {
		if (disabled) return;

		if (newMode === 'now') {
			onChange({ mode: 'now', customStartTime: null });
		} else {
			// When switching to custom, use the current time input value
			const customDate = parseTimeInput(timeInputValue);
			onChange({ mode: 'custom', customStartTime: customDate });
		}
	}

	/**
	 * Handle time input change
	 */
	function handleTimeChange(event: Event) {
		if (disabled) return;

		const input = event.target as HTMLInputElement;
		timeInputValue = input.value;

		// Only update if in custom mode
		if (mode === 'custom') {
			const customDate = parseTimeInput(input.value);
			onChange({ mode: 'custom', customStartTime: customDate });
		}
	}

	/**
	 * Parse time input (HH:MM) to Date object for today
	 */
	function parseTimeInput(timeStr: string): Date {
		const [hours, minutes] = timeStr.split(':').map(Number);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Date is used for return value, not reactive state
		const date = new Date();
		date.setHours(hours || 0);
		date.setMinutes(minutes || 0);
		date.setSeconds(0);
		date.setMilliseconds(0);
		return date;
	}

	/**
	 * Format current time for display in "Start Now" label
	 */
	const currentTimeDisplay = $derived.by(() => {
		const now = new Date();
		return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	});
</script>

<fieldset
	class="schedule-start-picker"
	class:disabled
	aria-labelledby="schedule-start-legend"
	data-testid="schedule-start-picker"
>
	<legend id="schedule-start-legend" class="picker-legend">
		Schedule Start Time
	</legend>

	<div class="picker-options" role="radiogroup" aria-label="Schedule start time options">
		<!-- Start Now option -->
		<label class="picker-option" class:selected={mode === 'now'}>
			<input
				type="radio"
				name="schedule-start-mode"
				value="now"
				checked={mode === 'now'}
				{disabled}
				onchange={() => handleModeChange('now')}
				aria-describedby="start-now-hint"
				data-testid="start-now-radio"
			/>
			<span class="option-content">
				<span class="option-label">Start Now</span>
				<span id="start-now-hint" class="option-hint">
					Begin at {currentTimeDisplay}
				</span>
			</span>
		</label>

		<!-- Custom Time option -->
		<label class="picker-option" class:selected={mode === 'custom'}>
			<input
				type="radio"
				name="schedule-start-mode"
				value="custom"
				checked={mode === 'custom'}
				{disabled}
				onchange={() => handleModeChange('custom')}
				aria-describedby="custom-time-hint"
				data-testid="custom-time-radio"
			/>
			<span class="option-content">
				<span class="option-label">Custom Time</span>
				<span id="custom-time-hint" class="option-hint">
					Set a specific start time
				</span>
			</span>
		</label>
	</div>

	<!-- Time picker (only shown when custom mode is selected) -->
	{#if mode === 'custom'}
		<div class="time-picker-wrapper" data-testid="time-picker-wrapper">
			<label for="schedule-start-time" class="time-picker-label">
				Start at:
			</label>
			<input
				type="time"
				id="schedule-start-time"
				class="time-picker-input"
				value={timeInputValue}
				{disabled}
				oninput={handleTimeChange}
				aria-label="Schedule start time"
				data-testid="time-picker-input"
			/>
		</div>
	{/if}
</fieldset>

<style>
	@reference "tailwindcss";

	.schedule-start-picker {
		@apply border border-gray-200 rounded-lg p-4;
		@apply bg-white;
	}

	.schedule-start-picker.disabled {
		@apply opacity-60 cursor-not-allowed;
	}

	/* Dark mode support */
	:global(.dark) .schedule-start-picker {
		@apply bg-gray-800 border-gray-700;
	}

	.picker-legend {
		@apply text-sm font-medium text-gray-700 px-1;
	}

	:global(.dark) .picker-legend {
		@apply text-gray-300;
	}

	.picker-options {
		@apply flex flex-col gap-2 mt-2;
	}

	/* Mobile: stack, Desktop: side by side */
	@media (min-width: 640px) {
		.picker-options {
			@apply flex-row gap-4;
		}
	}

	.picker-option {
		@apply flex items-start gap-3 p-3 rounded-lg cursor-pointer;
		@apply border border-gray-200 bg-gray-50;
		@apply transition-all duration-150;
		@apply hover:bg-gray-100;
	}

	:global(.dark) .picker-option {
		@apply border-gray-600 bg-gray-700;
		@apply hover:bg-gray-600;
	}

	.picker-option.selected {
		@apply border-blue-500 bg-blue-50;
	}

	:global(.dark) .picker-option.selected {
		@apply border-blue-400 bg-blue-900/30;
	}

	.schedule-start-picker.disabled .picker-option {
		@apply cursor-not-allowed hover:bg-gray-50;
	}

	:global(.dark) .schedule-start-picker.disabled .picker-option {
		@apply hover:bg-gray-700;
	}

	.picker-option input[type="radio"] {
		@apply mt-0.5 h-4 w-4 text-blue-600;
		@apply border-gray-300 focus:ring-blue-500;
	}

	:global(.dark) .picker-option input[type="radio"] {
		@apply border-gray-500 bg-gray-600;
	}

	.option-content {
		@apply flex flex-col;
	}

	.option-label {
		@apply text-sm font-medium text-gray-900;
	}

	:global(.dark) .option-label {
		@apply text-white;
	}

	.option-hint {
		@apply text-xs text-gray-500;
	}

	:global(.dark) .option-hint {
		@apply text-gray-400;
	}

	/* Time picker */
	.time-picker-wrapper {
		@apply mt-4 pt-4 border-t border-gray-200;
		@apply flex items-center gap-3;
	}

	:global(.dark) .time-picker-wrapper {
		@apply border-gray-600;
	}

	.time-picker-label {
		@apply text-sm font-medium text-gray-700;
	}

	:global(.dark) .time-picker-label {
		@apply text-gray-300;
	}

	.time-picker-input {
		@apply px-3 py-2 text-sm;
		@apply border border-gray-300 rounded-md;
		@apply bg-white text-gray-900;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
	}

	:global(.dark) .time-picker-input {
		@apply bg-gray-700 border-gray-600 text-white;
		@apply focus:ring-blue-400 focus:border-blue-400;
	}

	.time-picker-input:disabled {
		@apply opacity-60 cursor-not-allowed;
	}
</style>
