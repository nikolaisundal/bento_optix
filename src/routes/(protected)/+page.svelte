<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import bentoLogo from '$lib/assets/bentologo_main.png';
</script>

<div
	class=" mx-auto flex min-h-screen w-full max-w-[1920px] flex-col items-center space-y-10 border-x-2 border-black"
>
	<h1 class="mt-20 text-4xl">welcome to</h1>
	<div class="w-[700px]">
		<img
			src={bentoLogo}
			alt="bento optix logo. the two 'o' in the logo form a pair of spectacles in the middle"
			class="h-auto w-full rounded-md"
		/>
	</div>
	<div class="flex items-center space-x-2">
		<span class="text-xl text-gray-600">
			Logged in as: {data.user?.email}
		</span>

		{#if data.avatarUrl}
			<div></div>
			<img src={data.avatarUrl} alt="User avatar" class="h-8 w-8 rounded-full object-cover" />
		{/if}
	</div>
</div>
