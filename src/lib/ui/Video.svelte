<script lang="ts">
	let {
		src,
		caption,
		aspectRatio,
	}: {
		src: string;
		caption?: import("svelte").Snippet;
		aspectRatio: number;
	} = $props();
</script>

<figure>
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		{src}
		class="h-auto max-h-[500px] w-full"
		style="aspect-ratio: {aspectRatio};"
		controls
		autoPlay={false}
		playsinline
	></video>
	{#if caption}
		<figcaption>{@render caption?.()}</figcaption>
	{/if}
</figure>
