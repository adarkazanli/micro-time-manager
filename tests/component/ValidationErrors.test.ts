import { describe, it } from 'vitest';
// Note: Component tests are temporarily skipped due to Svelte 5 + @testing-library/svelte
// compatibility issues with jsdom. These will be covered by e2e tests.
// See: https://github.com/testing-library/svelte-testing-library/issues/284

describe.skip('ValidationErrors', () => {
	describe('rendering', () => {
		it('renders error header', () => {
			// Test that component renders with error header
		});

		it('displays error count', () => {
			// Test that correct error count is shown
		});

		it('renders all errors in list', () => {
			// Test that all errors are displayed
		});
	});

	describe('error display', () => {
		it('shows row and column for row errors', () => {
			// Test that row errors show "Row X, Column:" format
		});

		it('shows only column for file-level errors', () => {
			// Test that file-level errors (row=0) show only column
		});

		it('shows error value when present', () => {
			// Test that error values are displayed in code tags
		});
	});

	describe('retry button', () => {
		it('renders retry button when onRetry provided', () => {
			// Test retry button visibility
		});

		it('calls onRetry when clicked', () => {
			// Test retry callback
		});

		it('hides retry button when onRetry not provided', () => {
			// Test no retry button without callback
		});
	});
});
