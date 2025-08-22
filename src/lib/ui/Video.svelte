<script lang="ts">
	import { sanitize } from '$lib/sanitizer';

	let {
		url,
		caption,
		aspectRatio
	}: { url: string; caption: string; aspectRatio: number } = $props();
</script>

<figure>
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		src={url}
		class="h-auto max-h-[500px] w-full"
		style="aspect-ratio: {aspectRatio};"
		controls
		autoPlay={false}
	></video>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<figcaption>{@html sanitize(caption)}</figcaption>
</figure>
