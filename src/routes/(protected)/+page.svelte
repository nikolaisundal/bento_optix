<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	import { fade } from 'svelte/transition';
	import autorefBalloon from '$lib/assets/autoref_balloon_video.mp4';
	import bentoLogo from '$lib/assets/Bento_main_transparent.png';
</script>

<div
	class=" mx-auto flex min-h-screen w-full max-w-[1920px] flex-col items-center border-black sm:border-x-2"
>
	<div class="mt-20 w-[300px] sm:w-[700px]" in:fade={{ duration: 1500, delay: 200 }}>
		<img
			src={bentoLogo}
			alt="bento optix logo. the two 'o' in the logo form a pair of spectacles in the middle"
			class="h-auto w-full rounded-md"
		/>
	</div>
	<video
		class="sm:v-[400px] v-[250px] mt-20 h-[250px] rounded-full border-black sm:h-[400px]"
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
	<div class="mt-28 mb-8 flex flex-col items-center space-y-2">
		<span class="text-xl text-gray-600">
			Logged in as: {data.user?.email}
		</span>

		{#if data.avatarUrl}
			<div></div>
			<img src={data.avatarUrl} alt="User avatar" class="h-10 w-10 rounded-full object-cover" />
		{/if}
	</div>
</div>
