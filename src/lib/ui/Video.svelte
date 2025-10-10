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

<figure class="max-w-full">
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		{src}
		class={[
			"mx-auto max-h-[500px]",
			{
				"h-auto w-full": aspectRatio >= 1,
				"h-full w-auto": aspectRatio < 1,
			},
		]}
		controls
		autoPlay={false}
		playsinline
		style="aspect-ratio: {aspectRatio};"
	></video>
	{#if caption}
		<figcaption>{@render caption?.()}</figcaption>
	{/if}
</figure>
