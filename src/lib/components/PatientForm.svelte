<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { Snippet } from 'svelte';

	interface Props {
		form: SuperForm<any>;
		enhance: any;
		isSubmitting: boolean;
		mode: 'create' | 'edit';
		disabled?: boolean;
		footer?: Snippet;
	}

	let { form, enhance, isSubmitting, mode, disabled = false, footer }: Props = $props();

	const { form: formData } = form;
</script>

<form use:enhance class="space-y-4">
	<!-- Required Fields Section -->
	<div class="space-y-4">
		<h3 class="text-sm font-medium">Required Information</h3>

		<div class="grid grid-cols-2 gap-4">
			<Form.Field {form} name="firstName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>First Name *</Form.Label>
						<Input
							{...props}
							bind:value={$formData.firstName}
							placeholder="Enter first name"
							disabled={isSubmitting || disabled}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="lastName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Last Name *</Form.Label>
						<Input
							{...props}
							bind:value={$formData.lastName}
							placeholder="Enter last name"
							disabled={isSubmitting || disabled}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Form.Field {form} name="dateOfBirth">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Date of Birth *</Form.Label>
					<Input
						{...props}
						type="date"
						bind:value={$formData.dateOfBirth}
						disabled={isSubmitting || disabled}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<!-- Optional Fields Section -->
	<div class="space-y-4">
		<h3 class="text-sm font-medium">Additional Information</h3>

		<Form.Field {form} name="nationalId">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>National ID</Form.Label>
					<Input
						{...props}
						bind:value={$formData.nationalId}
						placeholder="Enter national ID"
						disabled={isSubmitting || disabled}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="gender">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Gender</Form.Label>
					<Select.Root
						type="single"
						bind:value={$formData.gender}
						name={props.name}
						disabled={isSubmitting || disabled}
					>
						<Select.Trigger {...props}>
							{$formData.gender
								? $formData.gender.charAt(0).toUpperCase() + $formData.gender.slice(1)
								: 'Select gender'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="male" label="Male" />
							<Select.Item value="female" label="Female" />
							<Select.Item value="other" label="Other" />
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="grid grid-cols-2 gap-4">
			<Form.Field {form} name="phoneNumber">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Phone Number</Form.Label>
						<Input
							{...props}
							type="tel"
							bind:value={$formData.phoneNumber}
							placeholder="Enter phone number"
							disabled={isSubmitting || disabled}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
						<Input
							{...props}
							type="email"
							bind:value={$formData.email}
							placeholder="Enter email"
							disabled={isSubmitting || disabled}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<Form.Field {form} name="address">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Address</Form.Label>
					<Input
						{...props}
						bind:value={$formData.address}
						placeholder="Enter address"
						disabled={isSubmitting || disabled}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="postalCode">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Postal Code</Form.Label>
					<Input
						{...props}
						bind:value={$formData.postalCode}
						placeholder="Enter postal code"
						disabled={isSubmitting || disabled}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="grid grid-cols-2 gap-4">
			<Form.Field {form} name="occupation">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Occupation</Form.Label>
						<Input
							{...props}
							bind:value={$formData.occupation}
							placeholder="Enter occupation"
							disabled={isSubmitting || disabled}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="hobby">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Hobby</Form.Label>
						<Input
							{...props}
							bind:value={$formData.hobby}
							placeholder="Enter hobby"
							disabled={isSubmitting || disabled}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>

	<!-- Footer - use custom snippet if provided, otherwise default buttons -->
	<!-- Footer - use custom snippet if provided, otherwise default buttons -->
	{#if footer}
		{@render footer()}
	{/if}
</form>
