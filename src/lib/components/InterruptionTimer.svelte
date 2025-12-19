<script lang="ts">
	/**
	 * InterruptionTimer Component
	 *
	 * Feature: 004-interruption-tracking
	 * Task: T024 - Active interruption timer display
	 *
	 * Shows elapsed interruption time in MM:SS format.
	 * Distinct amber/orange styling to indicate interruption state.
	 */

	interface Props {
		elapsedMs: number;
	}

	let { elapsedMs }: Props = $props();

	/**
	 * Format milliseconds as MM:SS
	 */
	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	const displayTime = $derived(formatTime(elapsedMs));
</script>

<div class="interruption-timer" data-testid="interruption-timer">
	<div class="timer-label">Interrupted</div>
	<div class="timer-display">{displayTime}</div>
</div>

<style>
	@import "tailwindcss";

	.interruption-timer {
		@apply flex flex-col items-center gap-1 px-4 py-3 rounded-lg;
		@apply bg-amber-100 border-2 border-amber-400;
	}

	.timer-label {
		@apply text-xs font-medium text-amber-700 uppercase tracking-wider;
	}

	.timer-display {
		@apply text-2xl font-mono font-bold text-amber-800;
	}
</style>
