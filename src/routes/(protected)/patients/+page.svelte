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
		lastName: z.string().min(2, 'Must be at least 2 characters'),
		firstName: z.string().optional(),
		patientId: z.string().optional(),
		dateOfBirth: z.string().optional(),
		phone: z.string().optional()
	});

	// Set up the form
	const searchForm = superForm(defaults(zod4(searchSchema)), {
		validators: zod4(searchSchema),
		SPA: true,
		onSubmit: () => {
			handleSearch();
		}
	});

	const { form: searchFormData, enhance: searchEnhance } = searchForm;

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

	// Create the patient form
	const patientForm = superForm(defaults(zod4(patientSchema)), {
		validators: zod4(patientSchema),
		SPA: true,
		onSubmit: async () => {
			await createPatient();
		}
	});

	const { form: patientFormData, enhance: patientEnhance } = patientForm;

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

	function selectPatient(patient: Patient) {
		selectedPatient = patient;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('nb-NO'); // Norwegian format: DD.MM.YYYY
	}

	async function createPatient() {
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
					first_name: $patientFormData.firstName,
					last_name: $patientFormData.lastName,
					date_of_birth: $patientFormData.dateOfBirth,
					national_id: $patientFormData.nationalId || null,
					gender: $patientFormData.gender || null,
					phone_number: $patientFormData.phoneNumber || null,
					email: $patientFormData.email || null,
					address: $patientFormData.address || null,
					postal_code: $patientFormData.postalCode || null,
					occupation: $patientFormData.occupation || null,
					hobby: $patientFormData.hobby || null,
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

				// Reset form using superform's reset
				$patientFormData = {
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

		<form use:patientEnhance class="space-y-4">
			<!-- Required Fields -->
			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={patientForm} name="firstName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>First Name *</Form.Label>
							<Input
								{...props}
								bind:value={$patientFormData.firstName}
								placeholder="Enter first name"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={patientForm} name="lastName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Last Name *</Form.Label>
							<Input
								{...props}
								bind:value={$patientFormData.lastName}
								placeholder="Enter last name"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field form={patientForm} name="dateOfBirth">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Date of Birth *</Form.Label>
						<Input {...props} type="date" bind:value={$patientFormData.dateOfBirth} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Optional Fields -->
			<Form.Field form={patientForm} name="nationalId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>National ID</Form.Label>
						<Input
							{...props}
							bind:value={$patientFormData.nationalId}
							placeholder="Enter national ID"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={patientForm} name="gender">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Gender</Form.Label>
						<select
							{...props}
							bind:value={$patientFormData.gender}
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
				<Form.Field form={patientForm} name="phoneNumber">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Phone Number</Form.Label>
							<Input
								{...props}
								type="tel"
								bind:value={$patientFormData.phoneNumber}
								placeholder="Enter phone number"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={patientForm} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								bind:value={$patientFormData.email}
								placeholder="Enter email"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field form={patientForm} name="address">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Address</Form.Label>
						<Input {...props} bind:value={$patientFormData.address} placeholder="Enter address" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={patientForm} name="postalCode">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Postal Code</Form.Label>
						<Input
							{...props}
							bind:value={$patientFormData.postalCode}
							placeholder="Enter postal code"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="grid grid-cols-2 gap-4">
				<Form.Field form={patientForm} name="occupation">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Occupation</Form.Label>
							<Input
								{...props}
								bind:value={$patientFormData.occupation}
								placeholder="Enter occupation"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={patientForm} name="hobby">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Hobby</Form.Label>
							<Input {...props} bind:value={$patientFormData.hobby} placeholder="Enter hobby" />
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
						// Reset form when user explicitly cancels
						$patientFormData = {
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
