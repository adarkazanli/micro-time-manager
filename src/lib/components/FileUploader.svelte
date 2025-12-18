<script lang="ts">
	import { getAcceptString } from '$lib/services/parser';

	interface Props {
		onFileSelect?: (file: File) => void;
		disabled?: boolean;
	}

	let { onFileSelect, disabled = false }: Props = $props();

	let dragActive = $state(false);
	let fileInput: HTMLInputElement;

	const acceptString = getAcceptString();

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) {
			dragActive = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;

		if (disabled) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			onFileSelect?.(files[0]);
		}
	}

	function handleClick() {
		if (!disabled) {
			fileInput?.click();
		}
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			onFileSelect?.(files[0]);
		}
		// Reset input so same file can be selected again
		target.value = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<div
	data-testid="file-uploader"
	class="upload-zone {dragActive ? 'drag-active' : ''} {disabled ? 'disabled' : ''}"
	role="button"
	tabindex={disabled ? -1 : 0}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	aria-label="Upload schedule file"
	aria-disabled={disabled}
>
	<input
		bind:this={fileInput}
		type="file"
		accept={acceptString}
		onchange={handleFileChange}
		disabled={disabled}
		class="sr-only"
		data-testid="file-input"
	/>

	<div class="upload-content">
		<svg
			class="upload-icon"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
			/>
		</svg>

		<p class="upload-text">
			<span class="font-semibold">Drag & drop</span> your schedule file here
		</p>
		<p class="upload-subtext">or click to browse files</p>
		<p class="upload-formats">Supports .xlsx, .xls, .csv (max 1MB)</p>
	</div>
</div>

<style>
	@reference "tailwindcss";

	.upload-zone {
		@apply border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-200;
		@apply hover:border-blue-400 hover:bg-blue-50;
		@apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
	}

	.upload-zone.drag-active {
		@apply border-blue-500 bg-blue-50;
	}

	.upload-zone.disabled {
		@apply opacity-50 cursor-not-allowed;
		@apply hover:border-gray-300 hover:bg-transparent;
	}

	.sr-only {
		@apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
		clip: rect(0, 0, 0, 0);
	}

	.upload-content {
		@apply flex flex-col items-center gap-2;
	}

	.upload-icon {
		@apply w-12 h-12 text-gray-400;
	}

	.drag-active .upload-icon {
		@apply text-blue-500;
	}

	.upload-text {
		@apply text-gray-700;
	}

	.upload-subtext {
		@apply text-sm text-gray-500;
	}

	.upload-formats {
		@apply text-xs text-gray-400 mt-2;
	}
</style>
