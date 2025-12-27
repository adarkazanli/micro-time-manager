<script lang="ts">
	/**
	 * InterruptionBadge Component
	 *
	 * Feature: 011-auto-start-time
	 * Tasks: T056-T058 (User Story 3)
	 *
	 * Visual indicator for tasks that will be interrupted by a fixed task.
	 * Shows a pause icon with duration information.
	 */

	import { formatDuration } from '$lib/utils/duration';

	interface Props {
		/** Duration worked before pause (seconds) */
		beforePauseSec: number;
		/** Remaining duration after interruption (seconds) */
		remainingSec: number;
		/** Optional: time when task resumes */
		resumeTime?: Date;
	}

	let { beforePauseSec, remainingSec, resumeTime }: Props = $props();

	// Format durations for display
	const beforeDisplay = $derived(formatDuration(beforePauseSec));
	const remainingDisplay = $derived(formatDuration(remainingSec));

	// Format resume time if provided
	const resumeTimeDisplay = $derived(
		resumeTime
			? resumeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			: null
	);
</script>

<span class="interruption-badge" data-testid="interruption-badge">
	<!-- Pause icon -->
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 20 20"
		fill="currentColor"
		class="pause-icon"
		aria-hidden="true"
	>
		<path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
	</svg>
	<span class="badge-text">
		<span class="work-before">{beforeDisplay}</span>
		<span class="separator">→</span>
		<span class="pause-label">pause</span>
		<span class="separator">→</span>
		<span class="remaining">{remainingDisplay} left</span>
	</span>
	{#if resumeTimeDisplay}
		<span class="resume-time" title="Resumes at {resumeTimeDisplay}">
			@ {resumeTimeDisplay}
		</span>
	{/if}
</span>

<style>
	@reference "tailwindcss";

	.interruption-badge {
		@apply inline-flex items-center gap-1.5 px-2 py-1 rounded-md;
		@apply bg-amber-50 text-amber-800 text-xs font-medium;
		@apply border border-amber-200;
	}

	:global(.dark) .interruption-badge {
		@apply bg-amber-900/30 text-amber-300 border-amber-700;
	}

	.pause-icon {
		@apply w-3 h-3 flex-shrink-0;
	}

	.badge-text {
		@apply flex items-center gap-1;
	}

	.work-before {
		@apply font-mono;
	}

	.separator {
		@apply text-amber-500;
	}

	:global(.dark) .separator {
		@apply text-amber-600;
	}

	.pause-label {
		@apply text-amber-600 italic;
	}

	:global(.dark) .pause-label {
		@apply text-amber-400;
	}

	.remaining {
		@apply font-mono text-amber-700;
	}

	:global(.dark) .remaining {
		@apply text-amber-300;
	}

	.resume-time {
		@apply text-amber-600 font-mono;
		@apply ml-1 pl-1 border-l border-amber-300;
	}

	:global(.dark) .resume-time {
		@apply text-amber-400 border-amber-600;
	}
</style>
