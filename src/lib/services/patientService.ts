// src/lib/services/patientService.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	Patient,
	PatientSearchFilters,
	PatientFormData,
	PatientResult
} from '$lib/types/patient.types';

/**
 * Patient Service - Handles all patient-related database operations
 */
export const patientService = {
	/**
	 * Search patients with optional filters
	 * Automatically filters out soft-deleted patients
	 */
	async search(
		supabase: SupabaseClient,
		filters: PatientSearchFilters
	): Promise<PatientResult<Patient[]>> {
		try {
			let query = supabase.from('patients').select('*').is('deleted_at', null);

			// Apply filters if provided
			if (filters.patientNumber) {
				query = query.eq('patient_number', filters.patientNumber);
			}

			if (filters.lastName) {
				query = query.ilike('last_name', `%${filters.lastName}%`);
			}

			if (filters.firstName) {
				query = query.ilike('first_name', `%${filters.firstName}%`);
			}

			if (filters.dateOfBirth) {
				query = query.eq('date_of_birth', filters.dateOfBirth);
			}

			if (filters.phoneNumber) {
				query = query.ilike('phone_number', `%${filters.phoneNumber}%`);
			}

			// Default ordering by last name
			query = query.order('last_name', { ascending: true });

			const { data, error } = await query;

			if (error) {
				console.error('Patient search error:', error);
				return {
					success: false,
					error: `Failed to search patients: ${error.message}`
				};
			}

			return {
				success: true,
				data: data || []
			};
		} catch (err) {
			console.error('Unexpected error in patient search:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while searching patients'
			};
		}
	},

	/**
	 * Get a single patient by ID
	 * Returns null if patient not found or is deleted
	 */
	async getById(
		supabase: SupabaseClient,
		patientId: string
	): Promise<PatientResult<Patient | null>> {
		try {
			const { data, error } = await supabase
				.from('patients')
				.select('*')
				.eq('id', patientId)
				.is('deleted_at', null)
				.single();

			if (error) {
				// PGRST116 = no rows returned (patient not found)
				if (error.code === 'PGRST116') {
					return {
						success: true,
						data: null
					};
				}

				console.error('Error fetching patient:', error);
				return {
					success: false,
					error: `Failed to load patient: ${error.message}`
				};
			}

			return {
				success: true,
				data: data
			};
		} catch (err) {
			console.error('Unexpected error loading patient:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while loading patient'
			};
		}
	},

	/**
	 * Create a new patient
	 * Automatically sets created_by to current user
	 */
	async create(
		supabase: SupabaseClient,
		patientData: PatientFormData
	): Promise<PatientResult<Patient>> {
		try {
			// Get current user
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();

			if (authError || !user) {
				return {
					success: false,
					error: 'You must be logged in to create a patient'
				};
			}

			const { data, error } = await supabase
				.from('patients')
				.insert({
					...patientData,
					created_by: user.id
				})
				.select()
				.single();

			if (error) {
				console.error('Error creating patient:', error);
				return {
					success: false,
					error: `Failed to create patient: ${error.message}`
				};
			}

			return {
				success: true,
				data: data
			};
		} catch (err) {
			console.error('Unexpected error creating patient:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while creating patient'
			};
		}
	},

	/**
	 * Update an existing patient
	 * Sends all fields, automatically sets updated_at
	 */
	async update(
		supabase: SupabaseClient,
		patientId: string,
		patientData: PatientFormData
	): Promise<PatientResult<Patient>> {
		try {
			const { data, error } = await supabase
				.from('patients')
				.update({
					...patientData,
					updated_at: new Date().toISOString()
				})
				.eq('id', patientId)
				.is('deleted_at', null)
				.select()
				.single();

			if (error) {
				console.error('Error updating patient:', error);
				return {
					success: false,
					error: `Failed to update patient: ${error.message}`
				};
			}

			return {
				success: true,
				data: data
			};
		} catch (err) {
			console.error('Unexpected error updating patient:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while updating patient'
			};
		}
	},

	/**
	 * Soft delete a patient
	 * Sets deleted_at timestamp and deleted_by user ID
	 */
	async softDelete(supabase: SupabaseClient, patientId: string): Promise<PatientResult<Patient>> {
		try {
			// Get current user
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();

			if (authError || !user) {
				return {
					success: false,
					error: 'You must be logged in to delete a patient'
				};
			}

			const { data, error } = await supabase
				.from('patients')
				.update({
					deleted_at: new Date().toISOString(),
					deleted_by: user.id
				})
				.eq('id', patientId)
				.select()
				.single();

			if (error) {
				console.error('Error deleting patient:', error);
				return {
					success: false,
					error: `Failed to delete patient: ${error.message}`
				};
			}

			return {
				success: true,
				data: data
			};
		} catch (err) {
			console.error('Unexpected error deleting patient:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while deleting patient'
			};
		}
	},

	/**
	 * Get recently updated patients
	 * Useful for "Recently Viewed" or "Recent Patients" features
	 */
	async getRecent(supabase: SupabaseClient, limit: number = 10): Promise<PatientResult<Patient[]>> {
		try {
			const { data, error } = await supabase
				.from('patients')
				.select('*')
				.is('deleted_at', null)
				.order('updated_at', { ascending: false })
				.limit(limit);

			if (error) {
				console.error('Error fetching recent patients:', error);
				return {
					success: false,
					error: `Failed to load recent patients: ${error.message}`
				};
			}

			return {
				success: true,
				data: data || []
			};
		} catch (err) {
			console.error('Unexpected error loading recent patients:', err);
			return {
				success: false,
				error: 'An unexpected error occurred while loading recent patients'
			};
		}
	},

	/**
	 * Check if a patient exists by national ID
	 * Useful for duplicate checking
	 */
	async existsByNationalId(
		supabase: SupabaseClient,
		nationalId: string
	): Promise<PatientResult<boolean>> {
		try {
			const { data, error } = await supabase
				.from('patients')
				.select('id')
				.eq('national_id', nationalId)
				.is('deleted_at', null)
				.limit(1);

			if (error) {
				console.error('Error checking patient existence:', error);
				return {
					success: false,
					error: `Failed to check patient existence: ${error.message}`
				};
			}

			return {
				success: true,
				data: (data?.length || 0) > 0
			};
		} catch (err) {
			console.error('Unexpected error checking patient existence:', err);
			return {
				success: false,
				error: 'An unexpected error occurred'
			};
		}
	}
};
