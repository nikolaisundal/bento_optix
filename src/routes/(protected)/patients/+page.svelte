<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Table from '$lib/components/ui/table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import * as Form from '$lib/components/ui/form';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import SaveIcon from '@lucide/svelte/icons/save';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';

	import { supabase } from '$lib/supabase';
	import * as z from 'zod';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { onMount } from 'svelte';

	import PatientForm from '$lib/components/PatientForm.svelte';
	import { patientService } from '$lib/services/patientService';
	import type { Patient } from '$lib/types/patient.types';

	import NotesCard from '@/components/NotesCard.svelte';

	import { noteService } from '$lib/services/noteService';
	import type { Note } from '$lib/services/noteService';

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
		id: 'create-patient-form',
		validators: zod4(patientSchema),
		SPA: true,
		onSubmit: async () => {
			await createPatient();
		}
	});

	const { form: createPatientFormData, enhance: createPatientEnhance } = createPatientForm;

	// EDIT patient form (for right panel)
	const editPatientForm = superForm(defaults(zod4(patientSchema)), {
		id: 'edit-patient-form',
		validators: zod4(patientSchema),
		SPA: true,
		onSubmit: async () => {
			await updatePatient();
		}
	});

	const { form: editPatientFormData, enhance: editPatientEnhance } = editPatientForm;

	const noteSchema = z.object({
		noteText: z.string().min(1, 'Must contain at least 1 character'),
		noteDate: z.string().min(1, 'Date is required')
	});

	// Complete the createNoteForm setup
	const createNoteForm = superForm(defaults(zod4(noteSchema)), {
		id: 'create-note-form',
		validators: zod4(noteSchema),
		SPA: true,
		onSubmit: async () => {
			await createNote();
		}
	});

	const { form: createNoteFormData, enhance: createNoteEnhance } = createNoteForm;
	const createNoteErrors = createNoteForm.errors;
	// editNoteForm is already correct, just add the missing const destructuring

	// One form for editing notes (shared by all note cards)
	const editNoteForm = superForm(defaults(zod4(noteSchema)), {
		id: 'edit-note-form',
		validators: zod4(noteSchema),
		SPA: true,
		onSubmit: async () => {
			await updateNote();
		}
	});

	const { form: editNoteFormData, enhance: editNoteEnhance } = editNoteForm;

	function startEditingNote(note: Note) {
		if (isAnyEditActive) {
			alert('Please save or cancel current changes first');
			return;
		}
		editingNoteId = note.id;
		// Populate the form with the note's data
		$editNoteFormData.noteText = note.note_text;
		$editNoteFormData.noteDate = note.note_date;
	}

	// Search results state
	let searchResults = $state<Patient[]>([]);
	let isSearching = $state(false);
	let selectedPatient = $state<Patient | null>(null);
	let isLoadingPatient = $state(false);

	// Dialog state
	let dialogOpen = $state(false);
	let isCreating = $state(false);

	//Info
	let activeTab = $state('notes');
	let isEditMode = $state(false);
	let isUpdating = $state(false);

	//notes
	let newNoteActive = $state(false);
	let editingNoteId = $state<string | null>(null);
	let notes = $state<Note[]>([]);
	let isLoadingNotes = $state(false);
	let isUpdatingNote = $state(false);
	let isCreatingNote = $state(false);

	const isAnyEditActive = $derived(isEditMode || newNoteActive || editingNoteId !== null);

	// Load notes when patient is selected
	async function loadNotes(patientId: string) {
		isLoadingNotes = true;
		try {
			const result = await noteService.getByPatientId(supabase, patientId);
			if (result.success) {
				notes = result.data || [];
			} else {
				alert(result.error);
				notes = [];
			}
		} catch (err) {
			console.error('Error loading notes:', err);
			notes = [];
		} finally {
			isLoadingNotes = false;
		}
	}

	// Create new note
	async function createNote() {
		if (!selectedPatient) return;

		isCreatingNote = true;
		try {
			const noteData = {
				patient_id: selectedPatient.id,
				note_text: $createNoteFormData.noteText,
				note_date: new Date().toISOString() // Auto-generate current date
			};

			const result = await noteService.create(supabase, noteData);

			if (result.success && result.data) {
				notes = [result.data, ...notes]; // Add to top
				newNoteActive = false;
				$createNoteFormData.noteText = '';
			} else {
				alert(result.error);
			}
		} catch (err) {
			console.error('Error creating note:', err);
			alert('An unexpected error occurred');
		} finally {
			isCreatingNote = false;
		}
	}

	// Update note
	async function updateNote() {
		if (!editingNoteId) return;

		isUpdatingNote = true;
		try {
			const noteData = {
				note_text: $editNoteFormData.noteText
			};

			const result = await noteService.update(supabase, editingNoteId, noteData);

			if (result.success) {
				const index = notes.findIndex((n) => n.id === editingNoteId);
				if (index !== -1 && result.data) {
					notes[index] = result.data;
				}
				editingNoteId = null;
			} else {
				alert(result.error);
			}
		} catch (err) {
			console.error('Error updating note:', err);
			alert('An unexpected error occurred');
		} finally {
			isUpdatingNote = false;
		}
	}

	// Cancel editing
	function cancelEditingNote() {
		editingNoteId = null;
		$editNoteFormData.noteText = '';
		newNoteActive = false;
	}

	// Delete note
	async function deleteNote(noteId: string) {
		if (!confirm('Are you sure you want to delete this note?')) {
			return;
		}

		try {
			const result = await noteService.softDelete(supabase, noteId);

			if (result.success) {
				notes = notes.filter((n) => n.id !== noteId);
			} else {
				alert(result.error);
			}
		} catch (err) {
			console.error('Error deleting note:', err);
			alert('An unexpected error occurred');
		}
	}

	// Load patient from URL on mount and when URL changes
	onMount(() => {
		loadPatientFromUrl();
	});

	$effect(() => {
		// Watch for URL changes
		const patientId = page.url.searchParams.get('patientId');
		if (patientId && (!selectedPatient || selectedPatient.id !== patientId)) {
			loadPatientFromUrl();
		} else if (!patientId && selectedPatient) {
			selectedPatient = null;
		}
	});

	async function loadPatientFromUrl() {
		const patientId = page.url.searchParams.get('patientId');

		if (!patientId) {
			selectedPatient = null;
			notes = []; // Clear notes
			return;
		}

		if (selectedPatient?.id === patientId) {
			return;
		}

		isLoadingPatient = true;

		try {
			const result = await patientService.getById(supabase, patientId);

			if (result.success) {
				if (result.data) {
					selectedPatient = result.data;
					$editPatientFormData = patientToFormData(result.data);
					isEditMode = false;

					// Load notes for this patient
					await loadNotes(patientId);
				} else {
					await goto('', { replaceState: true });
					selectedPatient = null;
					notes = [];
				}
			} else {
				alert(result.error);
				selectedPatient = null;
				notes = [];
			}
		} catch (err) {
			console.error('Unexpected error loading patient:', err);
			selectedPatient = null;
			notes = [];
		} finally {
			isLoadingPatient = false;
		}
	}

	async function handleSearch() {
		isSearching = true;

		try {
			const filters = {
				lastName: $searchFormData.lastName || undefined,
				firstName: $searchFormData.firstName || undefined,
				patientNumber: $searchFormData.patientId ? parseInt($searchFormData.patientId) : undefined,
				dateOfBirth: $searchFormData.dateOfBirth || undefined,
				phoneNumber: $searchFormData.phone || undefined
			};

			const result = await patientService.search(supabase, filters);

			if (result.success) {
				searchResults = result.data;
			} else {
				alert(result.error);
				searchResults = [];
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
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('nb-NO'); // Norwegian format: DD.MM.YYYY
	}

	async function createPatient() {
		isCreating = true;

		try {
			const patientData = {
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
				hobby: $createPatientFormData.hobby || null
			};

			const result = await patientService.create(supabase, patientData);

			if (result.success) {
				alert(`Patient created successfully! Patient #${result.data.patient_number}`);
				selectedPatient = result.data;
				$editPatientFormData = patientToFormData(result.data);
				await goto(`?patientId=${result.data.id}`, { replaceState: true });

				dialogOpen = false;
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
			} else {
				alert(result.error);
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
			const patientData = {
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
			};

			const result = await patientService.update(supabase, selectedPatient.id, patientData);

			if (result.success) {
				alert('Patient updated successfully!');
				selectedPatient = result.data;
				$editPatientFormData = patientToFormData(result.data);
				isEditMode = false;

				const index = searchResults.findIndex((p) => p.id === result.data.id);
				if (index !== -1) {
					searchResults[index] = result.data;
				}
			} else {
				alert(result.error);
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			alert('An unexpected error occurred');
		} finally {
			isUpdating = false;
		}
	}

	async function deletePatient() {
		if (!selectedPatient) return;

		if (
			!confirm(
				`Are you sure you want to delete ${selectedPatient.first_name} ${selectedPatient.last_name}?`
			)
		) {
			return;
		}

		try {
			const result = await patientService.softDelete(supabase, selectedPatient.id);

			if (result.success) {
				alert('Patient deleted successfully');
				await goto('', { replaceState: true });
				selectedPatient = null;
				searchResults = searchResults.filter((p) => p.id !== result.data.id);
			} else {
				alert(result.error);
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			alert('An unexpected error occurred');
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

	async function selectPatient(patient: Patient) {
		// Update URL with patient ID
		await goto(`?patientId=${patient.id}`, { keepFocus: true });
		// The $effect will handle loading the patient
	}

	async function deselectPatient() {
		await goto(page.url.pathname, { replaceState: true });
		selectedPatient = null;
		isEditMode = false;
	}
</script>

<!-- search -->
<div
	class="mx-auto flex min-h-screen w-full max-w-[1920px] flex-col border-black lg:flex-row lg:border-x-2 dark:border-slate-600"
>
	<div class="flex w-full flex-col border-black lg:w-3/5 lg:border-r-2 dark:border-slate-600">
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
		<div class="flex-1 overflow-auto border-t-2 border-black p-6 dark:border-slate-600">
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
									class="hover:bg-muted/50 cursor-pointer {selectedPatient?.id === patient.id
										? 'bg-muted'
										: ''}"
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
	<!-- patient info -->

	<div
		class="sm:lg-6 w-full border-t-2 border-black p-6 pb-96 lg:w-2/5 lg:border-none dark:border-slate-600"
	>
		{#if isLoadingPatient}
			<div class="flex items-center justify-center py-12">
				<p class="text-muted-foreground">Loading patient...</p>
			</div>
		{:else if selectedPatient}
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Patient Info</h2>

				<div class="flex gap-2">
					{#if activeTab === 'notes'}
						<Button onclick={() => (newNoteActive = true)}
							><PlusIcon class="h-4 w-4" /> Add new</Button
						>
					{/if}
					{#if !isEditMode && activeTab === 'info'}
						<Button
							onclick={() => {
								isEditMode = true;
							}}
						>
							Edit
						</Button>
					{/if}
					<Button variant="outline" onclick={deselectPatient}>Deselect</Button>
				</div>
			</div>

			<Tabs.Root bind:value={activeTab} class="w-full">
				<Tabs.List>
					<Tabs.Trigger value="info">Info</Tabs.Trigger>
					<Tabs.Trigger value="notes">Notes</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="info"
					><!-- Option A: Custom footer in edit mode -->
					{#if isEditMode}
						<PatientForm
							form={editPatientForm}
							enhance={editPatientEnhance}
							isSubmitting={isUpdating}
							mode="edit"
						>
							{#snippet footer()}
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
							{/snippet}
						</PatientForm>
					{:else}
						<!-- View mode - PatientForm with disabled=true and no footer -->
						<PatientForm
							form={editPatientForm}
							enhance={editPatientEnhance}
							isSubmitting={false}
							mode="edit"
							disabled={true}
						/>
					{/if}</Tabs.Content
				>
				<Tabs.Content value="notes" class="space-y-2">
					{#if newNoteActive}<Card.Root class="w-full">
							<Card.Content>
								<form class="space-y-4" use:createNoteEnhance>
									<Form.Field form={createNoteForm} name="noteText">
										<Form.Control>
											{#snippet children({ props })}
												<div class="flex flex-col gap-4 md:flex-row lg:flex-col 2xl:flex-row">
													<div class="text-muted-foreground min-w-[80px] text-sm">Today</div>
													<Textarea
														{...props}
														bind:value={$createNoteFormData.noteText}
														placeholder="Enter note text..."
														class="flex-1 resize-none"
														rows={4}
													/>
													<div class="flex flex-row justify-between gap-2">
														<Button
															type="submit"
															size="icon"
															variant="ghost"
															disabled={isUpdatingNote}
															title="Save"
														>
															<SaveIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
														</Button>
														<Button
															type="button"
															size="icon"
															variant="ghost"
															onclick={cancelEditingNote}
															disabled={isUpdatingNote}
															title="Cancel"
														>
															<XIcon class="h-4 w-4" />
														</Button>
													</div>
												</div>
											{/snippet}
										</Form.Control>
										{#if $createNoteErrors.noteText}
											<Form.FieldErrors />
										{/if}
									</Form.Field>
								</form>
							</Card.Content>
						</Card.Root>{/if}
					{#each notes as note (note.id)}
						<NotesCard
							{note}
							isEditing={editingNoteId === note.id}
							form={editingNoteId === note.id ? editNoteForm : undefined}
							enhance={editingNoteId === note.id ? editNoteEnhance : undefined}
							disabled={isUpdatingNote}
							onEdit={() => startEditingNote(note)}
							onCancel={cancelEditingNote}
							onDelete={() => deleteNote(note.id)}
						/>
					{/each}
				</Tabs.Content>
			</Tabs.Root>
		{:else}
			<p class="text-muted-foreground text-center">
				Select a patient from the search results to view details
			</p>
		{/if}
	</div>
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="max-h-[90vh] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Create New Patient</Dialog.Title>
			<Dialog.Description>
				Enter the patient's information below. Required fields are marked with *.
			</Dialog.Description>
		</Dialog.Header>

		<PatientForm
			form={createPatientForm}
			enhance={createPatientEnhance}
			isSubmitting={isCreating}
			mode="create"
		>
			{#snippet footer()}
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
			{/snippet}
		</PatientForm>
	</Dialog.Content>
</Dialog.Root>
