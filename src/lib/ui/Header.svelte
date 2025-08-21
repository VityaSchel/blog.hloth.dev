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

<a {id} href="#{id}" aria-hidden="true" tabindex={-1}></a>
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<svelte:element this={'h' + level}>{@html sanitize(text)}</svelte:element>
