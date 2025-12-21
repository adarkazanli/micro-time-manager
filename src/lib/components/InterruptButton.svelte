<script lang="ts">
	/**
	 * InterruptButton Component
	 *
	 * Feature: 004-interruption-tracking
	 * Tasks: T023, T033 - Interrupt/Resume toggle button
	 *
	 * Shows "Interrupt" when task is active, "Resume" when interrupted.
	 * Displays keyboard hint (I or R).
	 */

	interface Props {
		isInterrupted: boolean;
		canInterrupt: boolean;
		onInterrupt: () => void;
		onResume: () => void;
	}

	let { isInterrupted, canInterrupt, onInterrupt, onResume }: Props = $props();

	function handleClick() {
		if (isInterrupted) {
			onResume();
		} else {
			onInterrupt();
		}
	}
</script>

<button
	type="button"
	class="interrupt-btn"
	class:interrupted={isInterrupted}
	data-testid="interrupt-btn"
	disabled={!canInterrupt && !isInterrupted}
	onclick={handleClick}
>
	<span class="btn-text">
		{isInterrupted ? 'Resume' : 'Interrupt'}
	</span>
	<span class="key-hint">
		{isInterrupted ? 'R' : 'I'}
	</span>
</button>

<style>
	@reference "tailwindcss";

	.interrupt-btn {
		@apply flex items-center gap-2 px-4 py-2 rounded-lg font-medium;
		@apply transition-colors duration-150;
		@apply focus:outline-none focus:ring-2 focus:ring-offset-2;
		@apply bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400;
	}

	.interrupt-btn:disabled {
		@apply bg-gray-300 text-gray-500 cursor-not-allowed;
		@apply hover:bg-gray-300;
	}

	.interrupt-btn.interrupted {
		@apply bg-green-500 hover:bg-green-600 focus:ring-green-400;
	}

	.btn-text {
		@apply text-sm font-medium;
	}

	.key-hint {
		@apply text-xs opacity-75 px-1.5 py-0.5 rounded bg-white/20;
	}
</style>
