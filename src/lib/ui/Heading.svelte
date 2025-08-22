<script lang="ts">
	import { sanitize } from '$lib/sanitizer';

	let {
		level,
		text
	}: {
		level: number;
		text: string;
	} = $props();

	let id = $derived(text.toLowerCase().replace(/\s/g, '-'));
</script>

<svelte:element this={'h' + level} class="group">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html sanitize(text)}
	<a
		{id}
		href="#{id}"
		class="
			opacity-0 transition-opacity
			group-hover:opacity-100
			focus-visible:opacity-100
		"
		aria-label="Link to heading"
	>
		#
	</a>
</svelte:element>
