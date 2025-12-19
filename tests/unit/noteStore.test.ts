/**
 * Unit tests for noteStore
 *
 * Feature: 005-note-capture
 * Task: T007 - Unit tests for noteStore methods
 *
 * Tests: addNote, updateNote, deleteNote, filteredNotes,
 *        openInput, closeInput, toggleView, setSearchQuery,
 *        setTaskFilter, clearFilters, restore, reset
 *
 * Per Constitution IV: Tests MUST be written first and FAIL before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Note } from '$lib/types';

describe('noteStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-19T09:00:00.000Z'));

		// Mock localStorage
		const store: Record<string, string> = {};
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] || null);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
			store[key] = value;
		});
		vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
			delete store[key];
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	// ==========================================================================
	// Initial State
	// ==========================================================================

	describe('initial state', () => {
		it('should start with empty notes array', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(noteStore.notes).toEqual([]);
		});

		it('should start with isInputOpen = false', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(noteStore.isInputOpen).toBe(false);
		});

		it('should start with isViewOpen = false', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(noteStore.isViewOpen).toBe(false);
		});

		it('should start with empty searchQuery', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(noteStore.searchQuery).toBe('');
		});

		it('should start with taskFilter = null', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(noteStore.taskFilter).toBeNull();
		});
	});

	// ==========================================================================
	// Input Actions
	// ==========================================================================

	describe('openInput()', () => {
		it('should set isInputOpen to true', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.openInput();

			expect(noteStore.isInputOpen).toBe(true);
		});
	});

	describe('closeInput()', () => {
		it('should set isInputOpen to false', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.openInput();
			noteStore.closeInput();

			expect(noteStore.isInputOpen).toBe(false);
		});
	});

	// ==========================================================================
	// addNote()
	// ==========================================================================

	describe('addNote()', () => {
		it('should create note with auto-generated UUID', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Test note content');

			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(note.noteId).toMatch(uuidRegex);
		});

		it('should create note with provided content', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('My test note');

			expect(note.content).toBe('My test note');
		});

		it('should create note with createdAt timestamp', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Test note');

			expect(note.createdAt).toBe('2025-12-19T09:00:00.000Z');
		});

		it('should create note with updatedAt = null', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Test note');

			expect(note.updatedAt).toBeNull();
		});

		it('should associate note with provided taskId', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Test note', 'task-123');

			expect(note.taskId).toBe('task-123');
		});

		it('should create note with taskId = null when not provided', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('General note');

			expect(note.taskId).toBeNull();
		});

		it('should add note to notes array', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('First note');
			noteStore.addNote('Second note');

			expect(noteStore.notes).toHaveLength(2);
		});

		it('should trim content before saving', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('  Trimmed content  ');

			expect(note.content).toBe('Trimmed content');
		});

		it('should throw error for empty content', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(() => noteStore.addNote('')).toThrow('Note content cannot be empty');
		});

		it('should throw error for whitespace-only content', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(() => noteStore.addNote('   ')).toThrow('Note content cannot be empty');
		});

		it('should throw error for content exceeding max length', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const longContent = 'a'.repeat(501);

			expect(() => noteStore.addNote(longContent)).toThrow(
				'Note content cannot exceed 500 characters'
			);
		});

		it('should allow content at exactly max length', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const maxContent = 'a'.repeat(500);
			const note = noteStore.addNote(maxContent);

			expect(note.content).toBe(maxContent);
		});

		it('should close input after adding note', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.openInput();
			noteStore.addNote('Test note');

			expect(noteStore.isInputOpen).toBe(false);
		});
	});

	// ==========================================================================
	// updateNote()
	// ==========================================================================

	describe('updateNote()', () => {
		it('should update note content', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');
			noteStore.updateNote(note.noteId, 'Updated content');

			expect(noteStore.notes[0].content).toBe('Updated content');
		});

		it('should set updatedAt timestamp', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');
			vi.advanceTimersByTime(60000); // 1 minute later
			noteStore.updateNote(note.noteId, 'Updated content');

			expect(noteStore.notes[0].updatedAt).toBe('2025-12-19T09:01:00.000Z');
		});

		it('should preserve original noteId', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');
			const originalId = note.noteId;
			noteStore.updateNote(note.noteId, 'Updated content');

			expect(noteStore.notes[0].noteId).toBe(originalId);
		});

		it('should preserve original createdAt', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');
			vi.advanceTimersByTime(60000);
			noteStore.updateNote(note.noteId, 'Updated content');

			expect(noteStore.notes[0].createdAt).toBe('2025-12-19T09:00:00.000Z');
		});

		it('should preserve original taskId', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content', 'task-123');
			noteStore.updateNote(note.noteId, 'Updated content');

			expect(noteStore.notes[0].taskId).toBe('task-123');
		});

		it('should trim content before saving', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');
			noteStore.updateNote(note.noteId, '  Trimmed  ');

			expect(noteStore.notes[0].content).toBe('Trimmed');
		});

		it('should throw error for empty content', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');

			expect(() => noteStore.updateNote(note.noteId, '')).toThrow('Note content cannot be empty');
		});

		it('should throw error for content exceeding max length', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Original content');
			const longContent = 'a'.repeat(501);

			expect(() => noteStore.updateNote(note.noteId, longContent)).toThrow(
				'Note content cannot exceed 500 characters'
			);
		});

		it('should throw error for non-existent note', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(() => noteStore.updateNote('non-existent-id', 'Updated')).toThrow('Note not found');
		});
	});

	// ==========================================================================
	// deleteNote()
	// ==========================================================================

	describe('deleteNote()', () => {
		it('should remove note from notes array', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note = noteStore.addNote('Test note');
			noteStore.deleteNote(note.noteId);

			expect(noteStore.notes).toHaveLength(0);
		});

		it('should only remove specified note', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const note1 = noteStore.addNote('First note');
			const note2 = noteStore.addNote('Second note');
			const note3 = noteStore.addNote('Third note');

			noteStore.deleteNote(note2.noteId);

			expect(noteStore.notes).toHaveLength(2);
			expect(noteStore.notes.find((n) => n.noteId === note1.noteId)).toBeDefined();
			expect(noteStore.notes.find((n) => n.noteId === note2.noteId)).toBeUndefined();
			expect(noteStore.notes.find((n) => n.noteId === note3.noteId)).toBeDefined();
		});

		it('should throw error for non-existent note', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			expect(() => noteStore.deleteNote('non-existent-id')).toThrow('Note not found');
		});
	});

	// ==========================================================================
	// filteredNotes
	// ==========================================================================

	describe('filteredNotes', () => {
		it('should return all notes when no filter is applied', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Note 1');
			noteStore.addNote('Note 2');
			noteStore.addNote('Note 3');

			expect(noteStore.filteredNotes).toHaveLength(3);
		});

		it('should sort notes by createdAt descending (newest first)', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('First note');
			vi.advanceTimersByTime(1000);
			noteStore.addNote('Second note');
			vi.advanceTimersByTime(1000);
			noteStore.addNote('Third note');

			expect(noteStore.filteredNotes[0].content).toBe('Third note');
			expect(noteStore.filteredNotes[1].content).toBe('Second note');
			expect(noteStore.filteredNotes[2].content).toBe('First note');
		});

		it('should filter by search query case-insensitively', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Important meeting notes');
			noteStore.addNote('Call callback number');
			noteStore.addNote('Review code changes');

			noteStore.setSearchQuery('call');

			expect(noteStore.filteredNotes).toHaveLength(1);
			expect(noteStore.filteredNotes[0].content).toBe('Call callback number');
		});

		it('should filter by partial word match', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Important meeting notes');
			noteStore.addNote('Call callback number');

			noteStore.setSearchQuery('meet');

			expect(noteStore.filteredNotes).toHaveLength(1);
			expect(noteStore.filteredNotes[0].content).toBe('Important meeting notes');
		});

		it('should filter by taskId', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Note for task 1', 'task-1');
			noteStore.addNote('Note for task 2', 'task-2');
			noteStore.addNote('Another note for task 1', 'task-1');

			noteStore.setTaskFilter('task-1');

			expect(noteStore.filteredNotes).toHaveLength(2);
			expect(noteStore.filteredNotes.every((n) => n.taskId === 'task-1')).toBe(true);
		});

		it('should filter general notes (taskId = null)', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('General note 1', null);
			noteStore.addNote('Task note', 'task-1');
			noteStore.addNote('General note 2', null);

			noteStore.setTaskFilter(null);

			// When taskFilter is null, it should show all notes
			expect(noteStore.filteredNotes).toHaveLength(3);
		});

		it('should combine search and task filter', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Important meeting notes', 'task-1');
			noteStore.addNote('Review meeting agenda', 'task-1');
			noteStore.addNote('Important call notes', 'task-2');
			noteStore.addNote('Random stuff', 'task-1');

			noteStore.setSearchQuery('meeting');
			noteStore.setTaskFilter('task-1');

			expect(noteStore.filteredNotes).toHaveLength(2);
			expect(noteStore.filteredNotes.every((n) => n.taskId === 'task-1')).toBe(true);
			expect(noteStore.filteredNotes.every((n) => n.content.includes('meeting'))).toBe(true);
		});

		it('should return empty array when no matches', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Test note');

			noteStore.setSearchQuery('nonexistent');

			expect(noteStore.filteredNotes).toHaveLength(0);
		});
	});

	// ==========================================================================
	// View Actions
	// ==========================================================================

	describe('toggleView()', () => {
		it('should toggle isViewOpen from false to true', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.toggleView();

			expect(noteStore.isViewOpen).toBe(true);
		});

		it('should toggle isViewOpen from true to false', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.toggleView();
			noteStore.toggleView();

			expect(noteStore.isViewOpen).toBe(false);
		});
	});

	describe('setSearchQuery()', () => {
		it('should set searchQuery', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setSearchQuery('test query');

			expect(noteStore.searchQuery).toBe('test query');
		});
	});

	describe('setTaskFilter()', () => {
		it('should set taskFilter', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setTaskFilter('task-123');

			expect(noteStore.taskFilter).toBe('task-123');
		});

		it('should allow setting taskFilter to null', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setTaskFilter('task-123');
			noteStore.setTaskFilter(null);

			expect(noteStore.taskFilter).toBeNull();
		});
	});

	describe('clearFilters()', () => {
		it('should clear searchQuery', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setSearchQuery('test');
			noteStore.clearFilters();

			expect(noteStore.searchQuery).toBe('');
		});

		it('should clear taskFilter', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setTaskFilter('task-123');
			noteStore.clearFilters();

			expect(noteStore.taskFilter).toBeNull();
		});
	});

	// ==========================================================================
	// Lifecycle Actions
	// ==========================================================================

	describe('restore()', () => {
		it('should restore notes from saved data', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const savedNotes: Note[] = [
				{
					noteId: 'note-1',
					content: 'Restored note 1',
					createdAt: '2025-12-19T08:00:00.000Z',
					updatedAt: null,
					taskId: 'task-1'
				},
				{
					noteId: 'note-2',
					content: 'Restored note 2',
					createdAt: '2025-12-19T08:30:00.000Z',
					updatedAt: '2025-12-19T08:45:00.000Z',
					taskId: null
				}
			];

			noteStore.restore(savedNotes);

			expect(noteStore.notes).toHaveLength(2);
			expect(noteStore.notes[0].noteId).toBe('note-1');
			expect(noteStore.notes[1].noteId).toBe('note-2');
		});

		it('should preserve all fields from saved notes', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			const savedNote: Note = {
				noteId: 'note-test',
				content: 'Test content',
				createdAt: '2025-12-19T08:00:00.000Z',
				updatedAt: '2025-12-19T08:30:00.000Z',
				taskId: 'task-42'
			};

			noteStore.restore([savedNote]);

			const restored = noteStore.notes[0];
			expect(restored.noteId).toBe('note-test');
			expect(restored.content).toBe('Test content');
			expect(restored.createdAt).toBe('2025-12-19T08:00:00.000Z');
			expect(restored.updatedAt).toBe('2025-12-19T08:30:00.000Z');
			expect(restored.taskId).toBe('task-42');
		});

		it('should clear existing notes before restoring', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Existing note 1');
			noteStore.addNote('Existing note 2');

			const savedNotes: Note[] = [
				{
					noteId: 'note-restored',
					content: 'Restored note',
					createdAt: '2025-12-19T08:00:00.000Z',
					updatedAt: null,
					taskId: null
				}
			];

			noteStore.restore(savedNotes);

			expect(noteStore.notes).toHaveLength(1);
			expect(noteStore.notes[0].noteId).toBe('note-restored');
		});

		it('should handle empty array restore', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Existing note');
			noteStore.restore([]);

			expect(noteStore.notes).toHaveLength(0);
		});
	});

	describe('reset()', () => {
		it('should clear all notes', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.addNote('Note 1');
			noteStore.addNote('Note 2');
			noteStore.reset();

			expect(noteStore.notes).toHaveLength(0);
		});

		it('should close input', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.openInput();
			noteStore.reset();

			expect(noteStore.isInputOpen).toBe(false);
		});

		it('should close view', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.toggleView();
			noteStore.reset();

			expect(noteStore.isViewOpen).toBe(false);
		});

		it('should clear searchQuery', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setSearchQuery('test');
			noteStore.reset();

			expect(noteStore.searchQuery).toBe('');
		});

		it('should clear taskFilter', async () => {
			const { noteStore } = await import('$lib/stores/noteStore.svelte');

			noteStore.setTaskFilter('task-123');
			noteStore.reset();

			expect(noteStore.taskFilter).toBeNull();
		});
	});
});
