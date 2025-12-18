<script lang="ts">
	/**
	 * TimerDisplay Component
	 *
	 * Feature: 002-day-tracking
	 * Task: T016 - Create TimerDisplay.svelte component
	 *
	 * Displays countdown timer with formatted time and color indication.
	 */

	import type { TimerColor } from '$lib/types';

	interface Props {
		displayTime: string;
		color: TimerColor;
		isRunning: boolean;
	}

	let { displayTime, color, isRunning }: Props = $props();

	const colorClasses = $derived(() => {
		switch (color) {
			case 'green':
				return 'text-green-600 bg-green-50 border-green-200';
			case 'yellow':
				return 'text-yellow-600 bg-yellow-50 border-yellow-200';
			case 'red':
				return 'text-red-600 bg-red-50 border-red-200';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-200';
		}
	});
</script>

<div
	class="timer-display {colorClasses()}"
	class:is-running={isRunning}
	data-testid="timer-display"
	data-color={color}
>
	<span class="timer-time" data-testid="timer-time">
		{displayTime}
	</span>

	{#if isRunning}
		<span class="timer-indicator" data-testid="timer-running-indicator">
			<span class="pulse-dot"></span>
		</span>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	.timer-display {
		@apply flex items-center justify-center gap-3;
		@apply px-6 py-4 rounded-xl border-2;
		@apply transition-colors duration-300;
	}

	.timer-time {
		@apply text-5xl font-mono font-bold tabular-nums;
		@apply tracking-tight;
	}

	.timer-indicator {
		@apply flex items-center;
	}

	.pulse-dot {
		@apply w-3 h-3 rounded-full bg-current;
		@apply animate-pulse;
	}

	.is-running .timer-time {
		@apply animate-pulse;
		animation-duration: 2s;
	}
</style>
