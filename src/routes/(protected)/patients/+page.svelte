<script>
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';

	// Search filters state
	let searchFilters = $state({
		lastName: '',
		firstName: '',
		patientId: '',
		dateOfBirth: '',
		phone: ''
	});

	async function handleSearch() {
		console.log('Searching with filters:', searchFilters);
		// Your Supabase query will go here
	}

	function clearFilters() {
		searchFilters = {
			lastName: '',
			firstName: '',
			patientId: '',
			dateOfBirth: '',
			phone: ''
		};
	}
</script>

<div class="mx-auto flex min-h-screen w-[1920px] bg-green-200">
	<div class="flex w-3/5 flex-col border-r-2 border-black">
		<div class="space-y-4 p-6">
			<h2 class="text-2xl font-bold">Search Patients</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSearch();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<!-- Last Name -->
					<div class="space-y-2">
						<Label for="lastName">Last Name</Label>
						<Input
							id="lastName"
							type="text"
							placeholder="Enter last name"
							bind:value={searchFilters.lastName}
						/>
					</div>

					<!-- First Name -->
					<div class="space-y-2">
						<Label for="firstName">First Name</Label>
						<Input
							id="firstName"
							type="text"
							placeholder="Enter first name"
							bind:value={searchFilters.firstName}
						/>
					</div>

					<!-- Patient ID -->
					<div class="space-y-2">
						<Label for="patientId">Patient ID</Label>
						<Input
							id="patientId"
							type="text"
							placeholder="Enter patient ID"
							bind:value={searchFilters.patientId}
						/>
					</div>

					<!-- Date of Birth -->
					<div class="space-y-2">
						<Label for="dateOfBirth">Date of Birth</Label>
						<Input id="dateOfBirth" type="date" bind:value={searchFilters.dateOfBirth} />
					</div>

					<!-- Phone Number -->
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

				<!-- Buttons -->
				<div class="flex gap-2">
					<Button type="submit">Search</Button>
					<Button type="button" variant="outline" onclick={clearFilters}>Clear</Button>
				</div>
			</form>
		</div>
		<div class="border-t-2 border-black">results talbe</div>
	</div>
	<div class="w-2/5">patient info</div>
</div>
