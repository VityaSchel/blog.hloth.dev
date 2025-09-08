<script lang="ts">
	import Separator from '$lib/ui/Separator.svelte';

	let {
		children
	}: {
		children: import('svelte').Snippet;
	} = $props();
</script>

<main
	class="
		flex min-h-screen flex-col bg-cream px-6 pt-6
		md:px-12 md:pt-9
		dark:bg-black
	"
>
	{@render children()}
	<div class="mt-auto">
		<Separator
			class="
				mb-6
				md:mb-9
			"
		/>
	</div>
</main>
