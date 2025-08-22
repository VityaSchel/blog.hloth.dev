<script lang="ts">
	import { sanitize } from '$lib/sanitizer';

	let {
		width,
		height,
		url,
		title,
		caption
	}: {
		width: number;
		height: number;
		url: string;
		title: string;
		caption: string;
	} = $props();
</script>

<figure>
	<iframe
		src={url}
		frameborder="0"
		{width}
		{height}
		{title}
		sandbox="allow-orientation-lock allow-presentation allow-scripts allow-same-origin"
		style="max-width: 100%; aspect-ratio: {width / height}; height: auto;"
	></iframe>
	<figcaption>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html sanitize(caption)}
	</figcaption>
</figure>
