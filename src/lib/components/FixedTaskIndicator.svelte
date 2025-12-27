<script lang="ts">
	/**
	 * FixedTaskIndicator Component
	 *
	 * Feature: 011-auto-start-time
	 * Tasks: T044-T046 (User Story 2)
	 *
	 * Visual indicator (pin icon) for fixed-time appointments.
	 * Shows that a task has a specific scheduled time that cannot be moved.
	 */

	interface Props {
		/** Size of the indicator: sm (12px), md (16px), lg (20px) */
		size?: 'sm' | 'md' | 'lg';
		/** Optional tooltip text */
		tooltip?: string;
	}

	let { size = 'md', tooltip }: Props = $props();

	// Size mappings
	const sizeClasses = {
		sm: 'w-3 h-3',
		md: 'w-4 h-4',
		lg: 'w-5 h-5'
	};

	const iconSize = $derived(sizeClasses[size]);
</script>

<span
	class="fixed-task-indicator"
	class:has-tooltip={!!tooltip}
	title={tooltip}
	aria-label={tooltip || 'Fixed time appointment'}
	data-testid="fixed-task-indicator"
>
	<!-- Pin/Map Pin icon -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 20 20"
		fill="currentColor"
		class={iconSize}
		aria-hidden="true"
	>
		<path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd" />
	</svg>
</span>

<style>
	@reference "tailwindcss";

	.fixed-task-indicator {
		@apply inline-flex items-center justify-center;
		@apply text-blue-600;
	}

	:global(.dark) .fixed-task-indicator {
		@apply text-blue-400;
	}

	.fixed-task-indicator.has-tooltip {
		@apply cursor-help;
	}
</style>
