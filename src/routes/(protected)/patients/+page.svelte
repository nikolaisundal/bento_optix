<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { supabase } from '$lib/supabase';

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
	}

	function selectPatient(patient: Patient) {
		selectedPatient = patient;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
	}
</script>

<div
	class="mx-auto flex min-h-screen w-full max-w-[1920px] flex-col border-x-2 border-black sm:flex-row"
>
	<div class="flex w-full flex-col border-r-2 border-black sm:w-3/5">
		<div class="space-y-4 p-6">
			<h2 class="text-2xl font-bold">Search Patients</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSearch();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

	<div class="w-full border-t-2 border-black p-6 sm:w-2/5 sm:border-none">
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
