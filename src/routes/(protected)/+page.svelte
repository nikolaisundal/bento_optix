<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
</script>

<div class="mx-auto max-w-4xl">
	<p class="text-gray-600">
		Logged in as: {data.user?.email}
	</p>
</div>
