/**
 * Note Store
 *
 * Feature: 005-note-capture
 * Tasks: T004-T007 - Note state management
 *
 * Manages note capture state including input visibility, notes list,
 * search/filter state, and persistence.
 *
 * Uses Svelte 5 runes for reactive state management.
 */

import type { Note } from '$lib/types';
import { MAX_NOTE_LENGTH } from '$lib/types';
import { storage } from '$lib/services/storage';

// =============================================================================
// State (T004)
// =============================================================================

let notesState = $state<Note[]>([]);
let isInputOpenState = $state(false);
let isViewOpenState = $state(false);
let searchQueryState = $state('');
let taskFilterState = $state<string | null>(null);

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generate an RFC4122 version 4 UUID string.
 *
 * @returns A UUID v4 string in the format `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
 */
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

// =============================================================================
// Store Implementation
// =============================================================================

/**
 * Creates a note capture store that manages notes, input visibility,
 * and search/filter state.
 *
 * @returns An object exposing readable getters and actions for note management
 */
function createNoteStore() {
	return {
		// -------------------------------------------------------------------------
		// Readable State (getters) - T004
		// -------------------------------------------------------------------------

		get notes(): Note[] {
			return notesState;
		},

		get isInputOpen(): boolean {
			return isInputOpenState;
		},

		get isViewOpen(): boolean {
			return isViewOpenState;
		},

		get searchQuery(): string {
			return searchQueryState;
		},

		get taskFilter(): string | null {
			return taskFilterState;
		},

		/**
		 * Get filtered notes based on search query and task filter.
		 * Notes are sorted by createdAt descending (newest first).
		 */
		get filteredNotes(): Note[] {
			let result = notesState;

			// Apply search filter (case-insensitive substring match)
			if (searchQueryState.trim()) {
				const query = searchQueryState.toLowerCase();
				result = result.filter((n) => n.content.toLowerCase().includes(query));
			}

			// Apply task filter
			if (taskFilterState !== null) {
				result = result.filter((n) => n.taskId === taskFilterState);
			}

			// Sort by createdAt descending (newest first)
			return [...result].sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
		},

		// -------------------------------------------------------------------------
		// Input Actions (T013)
		// -------------------------------------------------------------------------

		/**
		 * Open the note input field.
		 */
		openInput(): void {
			isInputOpenState = true;
		},

		/**
		 * Close the note input field.
		 */
		closeInput(): void {
			isInputOpenState = false;
		},

		// -------------------------------------------------------------------------
		// Note CRUD Actions (T005)
		// -------------------------------------------------------------------------

		/**
		 * Add a new note with the given content and optional task association.
		 * Content is trimmed before saving. Empty content is rejected.
		 *
		 * @param content - The note content (max 500 characters)
		 * @param taskId - Optional task ID to associate the note with
		 * @returns The created note
		 * @throws Error if content is empty or exceeds max length
		 */
		addNote(content: string, taskId: string | null = null): Note {
			const trimmedContent = content.trim();

			if (!trimmedContent) {
				throw new Error('Note content cannot be empty');
			}

			if (trimmedContent.length > MAX_NOTE_LENGTH) {
				throw new Error(`Note content cannot exceed ${MAX_NOTE_LENGTH} characters`);
			}

			const note: Note = {
				noteId: generateUUID(),
				content: trimmedContent,
				createdAt: new Date().toISOString(),
				updatedAt: null,
				taskId
			};

			notesState = [...notesState, note];

			// Close input after adding
			isInputOpenState = false;

			return note;
		},

		/**
		 * Update an existing note's content.
		 * Content is trimmed before saving. Empty content is rejected.
		 *
		 * @param noteId - The ID of the note to update
		 * @param content - The new content
		 * @throws Error if note not found, content is empty, or exceeds max length
		 */
		updateNote(noteId: string, content: string): void {
			const trimmedContent = content.trim();

			if (!trimmedContent) {
				throw new Error('Note content cannot be empty');
			}

			if (trimmedContent.length > MAX_NOTE_LENGTH) {
				throw new Error(`Note content cannot exceed ${MAX_NOTE_LENGTH} characters`);
			}

			const index = notesState.findIndex((n) => n.noteId === noteId);
			if (index === -1) {
				throw new Error('Note not found');
			}

			const updated: Note = {
				...notesState[index],
				content: trimmedContent,
				updatedAt: new Date().toISOString()
			};

			notesState = [...notesState.slice(0, index), updated, ...notesState.slice(index + 1)];
		},

		/**
		 * Delete a note by ID.
		 *
		 * @param noteId - The ID of the note to delete
		 * @throws Error if note not found
		 */
		deleteNote(noteId: string): void {
			const index = notesState.findIndex((n) => n.noteId === noteId);
			if (index === -1) {
				throw new Error('Note not found');
			}

			notesState = [...notesState.slice(0, index), ...notesState.slice(index + 1)];
		},

		// -------------------------------------------------------------------------
		// View Actions (T025)
		// -------------------------------------------------------------------------

		/**
		 * Toggle the notes view panel visibility.
		 */
		toggleView(): void {
			isViewOpenState = !isViewOpenState;
		},

		/**
		 * Set the search query for filtering notes.
		 *
		 * @param query - The search query string
		 */
		setSearchQuery(query: string): void {
			searchQueryState = query;
		},

		/**
		 * Set the task filter for filtering notes.
		 * Pass null to show all notes.
		 *
		 * @param taskId - The task ID to filter by, or null for all notes
		 */
		setTaskFilter(taskId: string | null): void {
			taskFilterState = taskId;
		},

		/**
		 * Clear all filters (search query and task filter).
		 */
		clearFilters(): void {
			searchQueryState = '';
			taskFilterState = null;
		},

		// -------------------------------------------------------------------------
		// Lifecycle Actions (T006)
		// -------------------------------------------------------------------------

		/**
		 * Restore notes from saved data.
		 * Used for session recovery on page load.
		 *
		 * @param saved - Array of saved notes
		 */
		restore(saved: Note[]): void {
			notesState = saved;
		},

		/**
		 * Reset all note state.
		 * Clears notes, filters, and closes input/view.
		 */
		reset(): void {
			notesState = [];
			isInputOpenState = false;
			isViewOpenState = false;
			searchQueryState = '';
			taskFilterState = null;

			// Clear from storage
			storage.clearNotes();
		}
	};
}

/**
 * The note store singleton
 */
export const noteStore = createNoteStore();
