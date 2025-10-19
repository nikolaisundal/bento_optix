<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import { supabase } from '$lib/supabase';
	import * as z from 'zod';
	import { goto } from '$app/navigation';
	import * as Form from '$lib/components/ui/form';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

	// Create search schema
	const searchSchema = z.object({
		lastName: z.string().optional(),
		firstName: z.string().optional(),
		patientId: z.string().optional(),
		dateOfBirth: z.string().optional(),
		phone: z.string().optional()
	});

	// Set up the search form
	const searchForm = superForm(defaults(zod4(searchSchema)), {
		validators: zod4(searchSchema),
		SPA: true,
		onSubmit: () => {
			handleSearch();
		}
	});

	const { form: searchFormData, enhance: searchEnhance } = searchForm;

	// Patient schema (shared between create and edit)
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

	// CREATE patient form (for dialog)
	const createPatientForm = superForm(defaults(zod4(patientSchema)), {
		validators: zod4(patientSchema),
		SPA: true,
		onSubmit: async () => {
			await createPatient();
		}
	});

	const { form: createPatientFormData, enhance: createPatientEnhance } = createPatientForm;

	// EDIT patient form (for right panel)
	const editPatientForm = superForm(defaults(zod4(patientSchema)), {
		validators: zod4(patientSchema),
		SPA: true,
		onSubmit: async () => {
			await updatePatient();
		}
	});

	const { form: editPatientFormData, enhance: editPatientEnhance } = editPatientForm;

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

	let isEditMode = $state(false);
	let isUpdating = $state(false);

	// Search results state
	let searchResults = $state<Patient[]>([]);
	let isSearching = $state(false);
	let selectedPatient = $state<Patient | null>(null);

	// Dialog state
	let dialogOpen = $state(false);
	let isCreating = $state(false);

	async function handleSearch() {
		isSearching = true;

		try {
			let query = supabase.from('patients').select('*').is('deleted_at', null);

			if ($searchFormData.patientId) {
				query = query.eq('patient_number', parseInt($searchFormData.patientId));
			}

			if ($searchFormData.lastName) {
				query = query.ilike('last_name', `%${$searchFormData.lastName}%`);
			}

			if ($searchFormData.firstName) {
				query = query.ilike('first_name', `%${$searchFormData.firstName}%`);
			}

			if ($searchFormData.dateOfBirth) {
				query = query.eq('date_of_birth', $searchFormData.dateOfBirth);
			}

			if ($searchFormData.phone) {
				query = query.ilike('phone_number', `%${$searchFormData.phone}%`);
			}

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
		$searchFormData = {
			lastName: '',
			firstName: '',
			patientId: '',
			dateOfBirth: '',
			phone: ''
		};
		searchResults = [];
		selectedPatient = null;
		goto('', { replaceState: true });
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('nb-NO'); // Norwegian format: DD.MM.YYYY
	}

	async function createPatient() {
		isCreating = true;

		try {
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
					first_name: $createPatientFormData.firstName,
					last_name: $createPatientFormData.lastName,
					date_of_birth: $createPatientFormData.dateOfBirth,
					national_id: $createPatientFormData.nationalId || null,
					gender: $createPatientFormData.gender || null,
					phone_number: $createPatientFormData.phoneNumber || null,
					email: $createPatientFormData.email || null,
					address: $createPatientFormData.address || null,
					postal_code: $createPatientFormData.postalCode || null,
					occupation: $createPatientFormData.occupation || null,
					hobby: $createPatientFormData.hobby || null,
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
				selectedPatient = data;
				$editPatientFormData = patientToFormData(data);

				$createPatientFormData = {
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

	async function updatePatient() {
		if (!selectedPatient) return;

		isUpdating = true;

		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				alert('You must be logged in to update a patient');
				return;
			}

			const { data, error } = await supabase
				.from('patients')
				.update({
					first_name: $editPatientFormData.firstName,
					last_name: $editPatientFormData.lastName,
					date_of_birth: $editPatientFormData.dateOfBirth,
					national_id: $editPatientFormData.nationalId || null,
					gender: $editPatientFormData.gender || null,
					phone_number: $editPatientFormData.phoneNumber || null,
					email: $editPatientFormData.email || null,
					address: $editPatientFormData.address || null,
					postal_code: $editPatientFormData.postalCode || null,
					occupation: $editPatientFormData.occupation || null,
					hobby: $editPatientFormData.hobby || null
				})
				.eq('id', selectedPatient.id)
				.select()
				.single();

			if (error) {
				console.error('Error updating patient:', error);
				alert('Error updating patient: ' + error.message);
				return;
			}

			if (data) {
				selectedPatient = data;
				isEditMode = false;
				alert('Patient updated successfully!');
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			alert('An unexpected error occurred');
		} finally {
			isUpdating = false;
		}
	}

	function patientToFormData(patient: Patient) {
		return {
			firstName: patient.first_name,
			lastName: patient.last_name,
			dateOfBirth: patient.date_of_birth,
			nationalId: patient.national_id || '',
			gender:
				patient.gender === 'male' || patient.gender === 'female' || patient.gender === 'other'
					? patient.gender
					: ('' as '' | 'male' | 'female' | 'other'),
			phoneNumber: patient.phone_number || '',
			email: patient.email || '',
			address: patient.address || '',
			postalCode: patient.postal_code || '',
			occupation: patient.occupation || '',
			hobby: patient.hobby || ''
		};
	}

	function selectPatient(patient: Patient) {
		selectedPatient = patient;
		isEditMode = false;
		$editPatientFormData = patientToFormData(patient);
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
					}}
				>
					Create New Patient
				</Button>
			</div>

			<form use:searchEnhance class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<Form.Field form={searchForm} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Last Name</Form.Label>
								<Input
									{...props}
									bind:value={$searchFormData.lastName}
									placeholder="Enter last name"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={searchForm} name="firstName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>First Name</Form.Label>
								<Input
									{...props}
									bind:value={$searchFormData.firstName}
									placeholder="Enter first name"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={searchForm} name="patientId">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Patient ID</Form.Label>
								<Input
									{...props}
									bind:value={$searchFormData.patientId}
									placeholder="Enter patient ID"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={searchForm} name="dateOfBirth">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Date of Birth</Form.Label>
								<Input {...props} type="date" bind:value={$searchFormData.dateOfBirth} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={searchForm} name="phone">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Phone Number</Form.Label>
								<Input
									{...props}
									type="tel"
									bind:value={$searchFormData.phone}
									placeholder="Enter phone number"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
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
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Patient Info</h2>
				{#if !isEditMode}
					<Button
						onclick={() => {
							isEditMode = true;
						}}
					>
						Edit
					</Button>
				{/if}
			</div>

			<form use:editPatientEnhance class="space-y-4">
				<!-- Patient Number (always disabled) -->
				<div class="space-y-2">
					<Label>Patient #</Label>
					<Input disabled value={selectedPatient.patient_number} />
				</div>

				<!-- First Name & Last Name -->
				<div class="grid grid-cols-2 gap-4">
					<Form.Field form={editPatientForm} name="firstName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>First Name</Form.Label>
								<Input
									{...props}
									bind:value={$editPatientFormData.firstName}
									disabled={!isEditMode}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={editPatientForm} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Last Name</Form.Label>
								<Input
									{...props}
									bind:value={$editPatientFormData.lastName}
									disabled={!isEditMode}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<!-- Date of Birth -->
				<Form.Field form={editPatientForm} name="dateOfBirth">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Date of Birth</Form.Label>
							<Input
								{...props}
								type="date"
								bind:value={$editPatientFormData.dateOfBirth}
								disabled={!isEditMode}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- National ID -->
				<Form.Field form={editPatientForm} name="nationalId">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>National ID</Form.Label>
							<Input
								{...props}
								bind:value={$editPatientFormData.nationalId}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Gender -->
				<Form.Field form={editPatientForm} name="gender">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Gender</Form.Label>
							<select
								{...props}
								bind:value={$editPatientFormData.gender}
								disabled={!isEditMode}
								class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="">Select gender</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
								<option value="other">Other</option>
							</select>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Phone Number -->
				<Form.Field form={editPatientForm} name="phoneNumber">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Phone Number</Form.Label>
							<Input
								{...props}
								type="tel"
								bind:value={$editPatientFormData.phoneNumber}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Email -->
				<Form.Field form={editPatientForm} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								bind:value={$editPatientFormData.email}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Address -->
				<Form.Field form={editPatientForm} name="address">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Address</Form.Label>
							<Input
								{...props}
								bind:value={$editPatientFormData.address}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Postal Code -->
				<Form.Field form={editPatientForm} name="postalCode">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Postal Code</Form.Label>
							<Input
								{...props}
								bind:value={$editPatientFormData.postalCode}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Occupation -->
				<Form.Field form={editPatientForm} name="occupation">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Occupation</Form.Label>
							<Input
								{...props}
								bind:value={$editPatientFormData.occupation}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Hobby -->
				<Form.Field form={editPatientForm} name="hobby">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Hobby</Form.Label>
							<Input
								{...props}
								bind:value={$editPatientFormData.hobby}
								disabled={!isEditMode}
								placeholder="N/A"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Action Buttons (only show in edit mode) -->
				{#if isEditMode}
					<div class="flex gap-2">
						<Button type="submit" disabled={isUpdating}>
							{isUpdating ? 'Saving...' : 'Save Changes'}
						</Button>
						<Button
							type="button"
							variant="outline"
							onclick={() => {
								isEditMode = false;
								if (selectedPatient) {
									$editPatientFormData = patientToFormData(selectedPatient);
								}
							}}
						>
							Cancel
						</Button>
					</div>
				{/if}
			</form>
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

		<form use:createPatientEnhance class="space-y-4">
			<!-- Required Fields -->
			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={createPatientForm} name="firstName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>First Name *</Form.Label>
							<Input
								{...props}
								bind:value={$createPatientFormData.firstName}
								placeholder="Enter first name"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createPatientForm} name="lastName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Last Name *</Form.Label>
							<Input
								{...props}
								bind:value={$createPatientFormData.lastName}
								placeholder="Enter last name"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field form={createPatientForm} name="dateOfBirth">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Date of Birth *</Form.Label>
						<Input {...props} type="date" bind:value={$createPatientFormData.dateOfBirth} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Optional Fields -->
			<Form.Field form={createPatientForm} name="nationalId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>National ID</Form.Label>
						<Input
							{...props}
							bind:value={$createPatientFormData.nationalId}
							placeholder="Enter national ID"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={createPatientForm} name="gender">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Gender</Form.Label>
						<select
							{...props}
							bind:value={$createPatientFormData.gender}
							class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Select gender</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
						</select>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={createPatientForm} name="phoneNumber">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Phone Number</Form.Label>
							<Input
								{...props}
								type="tel"
								bind:value={$createPatientFormData.phoneNumber}
								placeholder="Enter phone number"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createPatientForm} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								bind:value={$createPatientFormData.email}
								placeholder="Enter email"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field form={createPatientForm} name="address">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Address</Form.Label>
						<Input
							{...props}
							bind:value={$createPatientFormData.address}
							placeholder="Enter address"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={createPatientForm} name="postalCode">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Postal Code</Form.Label>
						<Input
							{...props}
							bind:value={$createPatientFormData.postalCode}
							placeholder="Enter postal code"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={createPatientForm} name="occupation">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Occupation</Form.Label>
							<Input
								{...props}
								bind:value={$createPatientFormData.occupation}
								placeholder="Enter occupation"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={createPatientForm} name="hobby">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Hobby</Form.Label>
							<Input
								{...props}
								bind:value={$createPatientFormData.hobby}
								placeholder="Enter hobby"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						$createPatientFormData = {
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
						dialogOpen = false;
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
