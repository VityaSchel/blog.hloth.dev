<script lang="ts">
	import { sanitize } from '$lib/sanitizer';

	let { title, message }: { title: string; message: string } = $props();
</script>

<div class="flex gap-4">
	<span class="-mt-1.5 shrink-0 text-2xl">☝️</span>
	<span class="shrink-0"><b>{title}</b></span>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<p class="!m-0 min-w-0 flex-1 break-words">{@html sanitize(message)}</p>
</div>
