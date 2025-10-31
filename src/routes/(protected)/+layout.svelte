<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { LayoutData } from './$types';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import hamburgerIcon from '$lib/assets/hamburger_menu.svg';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	let { data, children }: { data: LayoutData; children: any } = $props();

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="min-h-screen w-full">
	<nav class="flex w-full items-center bg-gray-50 p-2 dark:bg-gray-900">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class=" h-10 w-10 cursor-pointer rounded-md bg-slate-200 p-1 hover:bg-slate-300 data-[state=open]:bg-slate-300 "
			>
				<img src={hamburgerIcon} alt="Menu" class="cursor-pointer" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Item><a href="/patients" class="w-full">Patients</a></DropdownMenu.Item>
					<DropdownMenu.Item>Eye exam</DropdownMenu.Item>
					<DropdownMenu.Item>Appointments</DropdownMenu.Item>
					<DropdownMenu.Item>Order glasses</DropdownMenu.Item>
					<DropdownMenu.Item><a href="/" class="w-full">home</a></DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onSelect={handleLogout} class="cursor-pointer font-bold"
						>Log out</DropdownMenu.Item
					>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		<div class=" flex w-full items-center justify-end">
			<Button onclick={toggleMode} variant="outline" size="icon">
				<SunIcon
					class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
				/>
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</nav>

	{@render children?.()}
</div>
