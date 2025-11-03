<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button';
	import type { SuperForm } from 'sveltekit-superforms';

	import SaveIcon from '@lucide/svelte/icons/save';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		note: {
			id: string;
			note_text: string;
			note_date: string;
		};
		isEditing: boolean;
		// Only pass form props when editing
		form?: SuperForm<any>;
		enhance?: any;
		disabled?: boolean;
		onEdit: () => void;
		onCancel: () => void;
		onDelete: () => void;
	}

	let {
		note,
		isEditing,
		form,
		enhance,
		disabled = false,
		onEdit,
		onCancel,
		onDelete
	}: Props = $props();

	const editNoteFormData = $derived(form ? form.form : undefined);

	function formatDate(isoDate: string): string {
		const date = new Date(isoDate);
		return date.toLocaleDateString('nb-NO');
	}
</script>

<Card.Root class="w-full">
	<Card.Content class="pt-6">
		{#if isEditing && form}
			<!-- Edit mode with superform -->
			<form class="space-y-4" use:enhance>
				<Form.Field {form} name="noteText">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-start gap-4">
								<div class="text-muted-foreground min-w-[80px] text-sm">
									{formatDate(note.note_date)}
								</div>
								<Textarea
									{...props}
									bind:value={$editNoteFormData.noteText}
									placeholder="Enter note text..."
									class="flex-1 resize-none"
									rows={4}
								/>
								<div class="flex flex-col gap-2">
									<Button type="submit" size="icon" variant="ghost" {disabled} title="Save">
										<SaveIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
									</Button>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onclick={onCancel}
										{disabled}
										title="Cancel"
									>
										<XIcon class="h-4 w-4" />
									</Button>
								</div>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</form>
		{:else}
			<!-- View mode -->
			<div class="flex items-start gap-4">
				<div class="text-muted-foreground min-w-[80px] text-sm">
					{formatDate(note.note_date)}
				</div>
				<Textarea value={note.note_text} disabled class="flex-1 resize-none" rows={4} />
				<div class="flex flex-col gap-2">
					<Button size="icon" variant="ghost" onclick={onEdit} title="Edit">
						<PencilIcon class="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</Button>
					<Button size="icon" variant="ghost" onclick={onDelete} title="Delete">
						<Trash2Icon class="h-4 w-4 text-red-600 dark:text-red-400" />
					</Button>
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
