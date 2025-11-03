import type { SupabaseClient } from '@supabase/supabase-js';

export interface Note {
	id: string;
	patient_id: string;
	note_text: string;
	note_date: string;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

interface ServiceResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export const noteService = {
	/**
	 * Get all notes for a patient (non-deleted, ordered by note_date DESC)
	 */
	async getByPatientId(
		supabase: SupabaseClient,
		patientId: string
	): Promise<ServiceResult<Note[]>> {
		try {
			const { data, error } = await supabase
				.from('patient_notes')
				.select('*')
				.eq('patient_id', patientId)
				.is('deleted_at', null)
				.order('note_date', { ascending: false });

			if (error) {
				return {
					success: false,
					error: `Failed to fetch notes: ${error.message}`
				};
			}

			return {
				success: true,
				data: data || []
			};
		} catch (err) {
			console.error('Unexpected error:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while fetching notes'
			};
		}
	},

	/**
	 * Create a new note
	 */
	async create(
		supabase: SupabaseClient,
		noteData: {
			patient_id: string;
			note_text: string;
			note_date: string;
		}
	): Promise<ServiceResult<Note>> {
		try {
			const { data, error } = await supabase
				.from('patient_notes')
				.insert([noteData])
				.select()
				.single();

			if (error) {
				return {
					success: false,
					error: `Failed to create note: ${error.message}`
				};
			}

			return {
				success: true,
				data
			};
		} catch (err) {
			console.error('Unexpected error:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while creating note'
			};
		}
	},

	/**
	 * Update an existing note
	 */
	async update(
		supabase: SupabaseClient,
		noteId: string,
		noteData: {
			note_text: string;
		}
	): Promise<ServiceResult<Note>> {
		try {
			const { data, error } = await supabase
				.from('patient_notes')
				.update(noteData)
				.eq('id', noteId)
				.is('deleted_at', null)
				.select()
				.single();

			if (error) {
				return {
					success: false,
					error: `Failed to update note: ${error.message}`
				};
			}

			if (!data) {
				return {
					success: false,
					error: 'Note not found'
				};
			}

			return {
				success: true,
				data
			};
		} catch (err) {
			console.error('Unexpected error:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while updating note'
			};
		}
	},

	/**
	 * Soft delete a note
	 */
	async softDelete(supabase: SupabaseClient, noteId: string): Promise<ServiceResult<Note>> {
		try {
			const { data, error } = await supabase
				.from('patient_notes')
				.update({ deleted_at: new Date().toISOString() })
				.eq('id', noteId)
				.is('deleted_at', null)
				.select()
				.single();

			if (error) {
				return {
					success: false,
					error: `Failed to delete note: ${error.message}`
				};
			}

			if (!data) {
				return {
					success: false,
					error: 'Note not found or already deleted'
				};
			}

			return {
				success: true,
				data
			};
		} catch (err) {
			console.error('Unexpected error:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while deleting note'
			};
		}
	}
};
