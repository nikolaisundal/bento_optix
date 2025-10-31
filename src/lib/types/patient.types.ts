// src/lib/types/patient.types.ts

/**
 * Database Patient type - matches Supabase schema exactly
 */
export interface Patient {
	id: string;
	patient_number: number;
	first_name: string;
	last_name: string;
	date_of_birth: string;
	national_id: string | null;
	gender: 'male' | 'female' | 'other' | null;
	phone_number: string | null;
	email: string | null;
	address: string | null;
	postal_code: string | null;
	occupation: string | null;
	hobby: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	deleted_by: string | null;
	created_by: string;
}

/**
 * Search filters for patient queries
 */
export interface PatientSearchFilters {
	lastName?: string;
	firstName?: string;
	patientNumber?: number;
	dateOfBirth?: string;
	phoneNumber?: string;
}

/**
 * Data for creating or updating a patient (excludes auto-generated fields)
 * Used for both create and update operations
 */
export interface PatientFormData {
	first_name: string;
	last_name: string;
	date_of_birth: string;
	national_id?: string | null;
	gender?: 'male' | 'female' | 'other' | null;
	phone_number?: string | null;
	email?: string | null;
	address?: string | null;
	postal_code?: string | null;
	occupation?: string | null;
	hobby?: string | null;
}

/**
 * Result type for operations that might fail
 */
export type PatientResult<T> = { success: true; data: T } | { success: false; error: string };
