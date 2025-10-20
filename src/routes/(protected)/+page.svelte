<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	import { fade } from 'svelte/transition';
	import autorefBalloon from '$lib/assets/autoref_balloon_video.mp4';
	import bentoLogo from '$lib/assets/Bento_main_transparent.png';
</script>

<div
	class=" mx-auto flex min-h-screen w-full max-w-[1920px] flex-col items-center border-x-2 border-black"
>
	<h1 class="mt-20 text-4xl">welcome to</h1>
	<div class="mt-20 w-[700px]" in:fade={{ duration: 1500, delay: 200 }}>
		<img
			src={bentoLogo}
			alt="bento optix logo. the two 'o' in the logo form a pair of spectacles in the middle"
			class="h-auto w-full rounded-md"
		/>
	</div>
	<video
		class="mt-20 rounded-full border-black"
		src={autorefBalloon}
		aria-label="A hot air ballon at the end of a raod. NIDEK is going to sue me"
		autoplay
		muted
		loop
		playsinline
		in:fade={{ duration: 1500, delay: 200 }}
	>
		<track kind="captions" />
	</video>
	<div class="mt-auto mb-8 flex items-center space-x-2">
		<span class="text-xl text-gray-600">
			Logged in as: {data.user?.email}
		</span>

		{#if data.avatarUrl}
			<div></div>
			<img src={data.avatarUrl} alt="User avatar" class="h-8 w-8 rounded-full object-cover" />
		{/if}
	</div>
</div>
