<script lang="ts">
	import * as z from 'zod';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';

	const testSchema = z.object({
		username: z.string().min(2, 'Username must be at least 2 characters')
	});

	const form = superForm(defaults(zod4(testSchema)), {
		validators: zod4(testSchema),
		SPA: true,
		onUpdate: ({ form: f }) => {
			if (f.valid) {
				alert(`Submitted: ${f.data.username}`);
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<div class="p-8">
	<h1 class="mb-4 text-2xl font-bold">Test Form - One Field</h1>

	<form use:enhance class="max-w-md space-y-4">
		<Form.Field {form} name="username">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Username</Form.Label>
					<Input {...props} bind:value={$formData.username} />
				{/snippet}
			</Form.Control>
			<Form.Description>Enter at least 2 characters</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Button type="submit">Submit</Button>
	</form>

	<div class="mt-8">
		<h2 class="font-bold">Current Value:</h2>
		<pre>{JSON.stringify($formData, null, 2)}</pre>
	</div>
</div>
