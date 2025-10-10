<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { LayoutData } from './$types';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	let { data, children }: { data: LayoutData; children: any } = $props();

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="min-h-screen w-full">
	<nav class="flex w-full items-center bg-gray-50">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Item><a href="/patients">Patients</a></DropdownMenu.Item>
					<DropdownMenu.Item>Eye exam</DropdownMenu.Item>
					<DropdownMenu.Item>Appointments</DropdownMenu.Item>
					<DropdownMenu.Item>Order glasses</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={handleLogout} class="font-bold">Log out</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<div class="flex w-full justify-end">
			<p class="p-4 text-gray-600">
				Logged in as: {data.user?.email}
			</p>
		</div>
	</nav>

	{@render children?.()}
</div>
