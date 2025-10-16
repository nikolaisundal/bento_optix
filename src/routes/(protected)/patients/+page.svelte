<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { supabase } from '$lib/supabase';
	import * as z from 'zod';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Patient type based on your Supabase schema
	type Patient = {
		id: string;
		patient_number: number;
		first_name: string;
		last_name: string;
		date_of_birth: string;
		national_id: string | null;
		gender: string | null;
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
	};

	// Search filters state
	let searchFilters = $state({
		lastName: '',
		firstName: '',
		patientId: '',
		dateOfBirth: '',
		phone: ''
	});

	// Search results state
	let searchResults = $state<Patient[]>([]);
	let isSearching = $state(false);
	let selectedPatient = $state<Patient | null>(null);

	// Dialog state
	let dialogOpen = $state(false);
	let isCreating = $state(false);
	let validationErrors = $state<Record<string, string>>({});

	// Zod schema for patient validation
	const patientSchema = z.object({
		firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
		lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
		dateOfBirth: z.string().min(1, 'Date of birth is required'),
		nationalId: z.string().max(20, 'National ID too long').optional(),
		gender: z.enum(['male', 'female', 'other', '']).optional(),
		phoneNumber: z.string().max(20, 'Phone number too long').optional(),
		email: z.string().email('Invalid email format').or(z.literal('')).optional(),
		address: z.string().max(200, 'Address too long').optional(),
		postalCode: z.string().max(10, 'Postal code too long').optional(),
		occupation: z.string().max(100, 'Occupation too long').optional(),
		hobby: z.string().max(100, 'Hobby too long').optional()
	});

	// New patient form
	let newPatient = $state({
		firstName: '',
		lastName: '',
		dateOfBirth: '',
		nationalId: '',
		gender: '',
		phoneNumber: '',
		email: '',
		address: '',
		postalCode: '',
		occupation: '',
		hobby: ''
	});

	async function handleSearch() {
		isSearching = true;

		try {
			// Start with base query - only non-deleted patients
			let query = supabase.from('patients').select('*').is('deleted_at', null);

			// Add filters only if they have values
			if (searchFilters.patientId) {
				query = query.eq('patient_number', parseInt(searchFilters.patientId));
			}

			if (searchFilters.lastName) {
				query = query.ilike('last_name', `%${searchFilters.lastName}%`);
			}

			if (searchFilters.firstName) {
				query = query.ilike('first_name', `%${searchFilters.firstName}%`);
			}

			if (searchFilters.dateOfBirth) {
				query = query.eq('date_of_birth', searchFilters.dateOfBirth);
			}

			if (searchFilters.phone) {
				query = query.ilike('phone_number', `%${searchFilters.phone}%`);
			}

			// Order by last name
			query = query.order('last_name', { ascending: true });

			const { data, error } = await query;

			if (error) {
				console.error('Search error:', error);
				alert('Error searching patients: ' + error.message);
				searchResults = [];
			} else {
				searchResults = data || [];
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			alert('An unexpected error occurred');
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	function clearFilters() {
		searchFilters = {
			lastName: '',
			firstName: '',
			patientId: '',
			dateOfBirth: '',
			phone: ''
		};
		searchResults = [];
		selectedPatient = null;
		// Clear URL parameter
		goto('', { replaceState: true });
	}

	function selectPatient(patient: Patient) {
		selectedPatient = patient;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('nb-NO'); // Norwegian format: DD.MM.YYYY
	}

	async function createPatient() {
		// Clear previous errors
		validationErrors = {};

		// Validate with Zod
		const validation = patientSchema.safeParse(newPatient);

		if (!validation.success) {
			// Convert Zod errors to a simple object
			validation.error.issues.forEach((err) => {
				if (err.path[0]) {
					validationErrors[err.path[0] as string] = err.message;
				}
			});
			return;
		}

		isCreating = true;

		try {
			// Get current user
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				alert('You must be logged in to create a patient');
				return;
			}

			const { data, error } = await supabase
				.from('patients')
				.insert({
					first_name: newPatient.firstName,
					last_name: newPatient.lastName,
					date_of_birth: newPatient.dateOfBirth,
					national_id: newPatient.nationalId || null,
					gender: newPatient.gender || null,
					phone_number: newPatient.phoneNumber || null,
					email: newPatient.email || null,
					address: newPatient.address || null,
					postal_code: newPatient.postalCode || null,
					occupation: newPatient.occupation || null,
					hobby: newPatient.hobby || null,
					created_by: user.id
				})
				.select()
				.single();

			if (error) {
				console.error('Error creating patient:', error);
				alert('Error creating patient: ' + error.message);
				return;
			}

			if (data) {
				// Select the newly created patient
				selectedPatient = data;

				// Reset form
				newPatient = {
					firstName: '',
					lastName: '',
					dateOfBirth: '',
					nationalId: '',
					gender: '',
					phoneNumber: '',
					email: '',
					address: '',
					postalCode: '',
					occupation: '',
					hobby: ''
				};

				// Clear validation errors
				validationErrors = {};

				// Close dialog
				dialogOpen = false;

				alert('Patient created successfully!');
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			alert('An unexpected error occurred');
		} finally {
			isCreating = false;
		}
	}
</script>

<div class="w-max-[1920px] mx-auto flex min-h-screen w-full border-x-2 border-black">
	<div class="flex w-3/5 flex-col border-r-2 border-black">
		<div class="space-y-4 p-6">
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold">Search Patients</h2>
				<Button
					onclick={() => {
						dialogOpen = true;
						validationErrors = {};
					}}
				>
					Create New Patient
				</Button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSearch();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="lastName">Last Name</Label>
						<Input
							id="lastName"
							type="text"
							placeholder="Enter last name"
							bind:value={searchFilters.lastName}
						/>
					</div>

					<div class="space-y-2">
						<Label for="firstName">First Name</Label>
						<Input
							id="firstName"
							type="text"
							placeholder="Enter first name"
							bind:value={searchFilters.firstName}
						/>
					</div>

					<div class="space-y-2">
						<Label for="patientId">Patient ID</Label>
						<Input
							id="patientId"
							type="text"
							placeholder="Enter patient ID"
							bind:value={searchFilters.patientId}
						/>
					</div>

					<div class="space-y-2">
						<Label for="dateOfBirth">Date of Birth</Label>
						<Input id="dateOfBirth" type="date" bind:value={searchFilters.dateOfBirth} />
					</div>

					<div class="space-y-2">
						<Label for="phone">Phone Number</Label>
						<Input
							id="phone"
							type="tel"
							placeholder="Enter phone number"
							bind:value={searchFilters.phone}
						/>
					</div>
				</div>

				<div class="flex gap-2">
					<Button type="submit" disabled={isSearching}>
						{isSearching ? 'Searching...' : 'Search'}
					</Button>
					<Button type="button" variant="outline" onclick={clearFilters}>Clear</Button>
				</div>
			</form>
		</div>

		<!-- Results Table -->
		<div class="flex-1 overflow-auto border-t-2 border-black p-6">
			{#if searchResults.length > 0}
				<div class="rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-[100px]">ID</Table.Head>
								<Table.Head>Last Name</Table.Head>
								<Table.Head>First Name</Table.Head>
								<Table.Head>D.O.B</Table.Head>
								<Table.Head>Phone No.</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each searchResults as patient (patient.id)}
								<Table.Row
									class="hover:bg-muted/50 cursor-pointer"
									onclick={() => selectPatient(patient)}
								>
									<Table.Cell class="font-medium">
										{patient.patient_number}
									</Table.Cell>
									<Table.Cell>{patient.last_name}</Table.Cell>
									<Table.Cell>{patient.first_name}</Table.Cell>
									<Table.Cell>{formatDate(patient.date_of_birth)}</Table.Cell>
									<Table.Cell>{patient.phone_number || '-'}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
				<p class="text-muted-foreground mt-4 text-sm">
					Found {searchResults.length} patient{searchResults.length !== 1 ? 's' : ''}
				</p>
			{:else if isSearching}
				<p class="text-muted-foreground text-center">Searching...</p>
			{:else}
				<p class="text-muted-foreground text-center">
					No results. Enter search criteria and click Search.
				</p>
			{/if}
		</div>
	</div>

	<div class="w-2/5 p-6">
		{#if selectedPatient}
			<h2 class="mb-4 text-2xl font-bold">Patient Info</h2>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="patientNumber">Patient #</Label>
					<Input id="patientNumber" disabled value={selectedPatient.patient_number} />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="firstName">First Name</Label>
						<Input id="firstName" disabled value={selectedPatient.first_name} />
					</div>
					<div class="space-y-2">
						<Label for="lastName">Last Name</Label>
						<Input id="lastName" disabled value={selectedPatient.last_name} />
					</div>
				</div>

				<div class="space-y-2">
					<Label for="dob">Date of Birth</Label>
					<Input id="dob" disabled value={formatDate(selectedPatient.date_of_birth)} />
				</div>

				<div class="space-y-2">
					<Label for="phone">Phone</Label>
					<Input id="phone" disabled value={selectedPatient.phone_number || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input id="email" disabled type="email" value={selectedPatient.email || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="address">Address</Label>
					<Input id="address" disabled value={selectedPatient.address || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="postalCode">Postal Code</Label>
					<Input id="postalCode" disabled value={selectedPatient.postal_code || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="nationalId">National ID</Label>
					<Input id="nationalId" disabled value={selectedPatient.national_id || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="gender">Gender</Label>
					<Input id="gender" disabled value={selectedPatient.gender || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="occupation">Occupation</Label>
					<Input id="occupation" disabled value={selectedPatient.occupation || 'N/A'} />
				</div>

				<div class="space-y-2">
					<Label for="hobby">Hobby</Label>
					<Input id="hobby" disabled value={selectedPatient.hobby || 'N/A'} />
				</div>
			</div>
		{:else}
			<p class="text-muted-foreground text-center">
				Select a patient from the search results to view details
			</p>
		{/if}
	</div>
</div>

<!-- Create Patient Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Create New Patient</Dialog.Title>
			<Dialog.Description>
				Enter the patient's information below. Required fields are marked with *.
			</Dialog.Description>
		</Dialog.Header>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				createPatient();
			}}
			class="space-y-4"
		>
			<!-- Required Fields -->
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="newFirstName">First Name *</Label>
					<Input
						id="newFirstName"
						type="text"
						bind:value={newPatient.firstName}
						placeholder="Enter first name"
						class={validationErrors.firstName ? 'border-destructive' : ''}
					/>
					{#if validationErrors.firstName}
						<p class="text-destructive text-sm">{validationErrors.firstName}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="newLastName">Last Name *</Label>
					<Input
						id="newLastName"
						type="text"
						bind:value={newPatient.lastName}
						placeholder="Enter last name"
						class={validationErrors.lastName ? 'border-destructive' : ''}
					/>
					{#if validationErrors.lastName}
						<p class="text-destructive text-sm">{validationErrors.lastName}</p>
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<Label for="newDateOfBirth">Date of Birth *</Label>
				<Input
					id="newDateOfBirth"
					type="date"
					bind:value={newPatient.dateOfBirth}
					class={validationErrors.dateOfBirth ? 'border-destructive' : ''}
				/>
				{#if validationErrors.dateOfBirth}
					<p class="text-destructive text-sm">{validationErrors.dateOfBirth}</p>
				{/if}
			</div>

			<!-- Optional Fields -->
			<div class="space-y-2">
				<Label for="newNationalId">National ID</Label>
				<Input
					id="newNationalId"
					type="text"
					bind:value={newPatient.nationalId}
					placeholder="Enter national ID"
				/>
			</div>

			<div class="space-y-2">
				<Label for="newGender">Gender</Label>
				<select
					id="newGender"
					bind:value={newPatient.gender}
					class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Select gender</option>
					<option value="male">Male</option>
					<option value="female">Female</option>
					<option value="other">Other</option>
				</select>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="newPhoneNumber">Phone Number</Label>
					<Input
						id="newPhoneNumber"
						type="tel"
						bind:value={newPatient.phoneNumber}
						placeholder="Enter phone number"
					/>
				</div>

				<div class="space-y-2">
					<Label for="newEmail">Email</Label>
					<Input
						id="newEmail"
						type="email"
						bind:value={newPatient.email}
						placeholder="Enter email"
						class={validationErrors.email ? 'border-destructive' : ''}
					/>
					{#if validationErrors.email}
						<p class="text-destructive text-sm">{validationErrors.email}</p>
					{/if}
				</div>
			</div>

			<div class="space-y-2">
				<Label for="newAddress">Address</Label>
				<Input
					id="newAddress"
					type="text"
					bind:value={newPatient.address}
					placeholder="Enter address"
				/>
			</div>

			<div class="space-y-2">
				<Label for="newPostalCode">Postal Code</Label>
				<Input
					id="newPostalCode"
					type="text"
					bind:value={newPatient.postalCode}
					placeholder="Enter postal code"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-2">
					<Label for="newOccupation">Occupation</Label>
					<Input
						id="newOccupation"
						type="text"
						bind:value={newPatient.occupation}
						placeholder="Enter occupation"
					/>
				</div>

				<div class="space-y-2">
					<Label for="newHobby">Hobby</Label>
					<Input
						id="newHobby"
						type="text"
						bind:value={newPatient.hobby}
						placeholder="Enter hobby"
					/>
				</div>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						dialogOpen = false;
						validationErrors = {};
					}}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isCreating}>
					{isCreating ? 'Creating...' : 'Create Patient'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
