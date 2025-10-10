<script lang="ts">
	import LazyImage from "$lib/ui/LazyImage.svelte";

	let {
		src,
		width,
		height,
		alt,
		background,
		border,
		caption,
	}: {
		src: string;
		width: number;
		height: number;
		background?: boolean;
		border?: boolean;
		alt: string;
		caption: import("svelte").Snippet;
	} = $props();

	const stretched = $derived(!background);

	const imgProps: { width: number; height: number } | { aspectRatio: number } =
		$derived(
			stretched
				? { aspectRatio: width / height }
				: { width: width, height: height },
		);
</script>

<figure>
	<div
		class={[
			"w-full",
			{
				border,
				[`flex h-fit max-h-[500px] items-center justify-center overflow-clip
		rounded-lg bg-white p-4`]: background,
			},
		]}
	>
		<!-- TODO: placeholder -->
		<LazyImage
			{src}
			placeholder=""
			{alt}
			sizes={background ? undefined : "(max-width: 728px) 100vw, 680px"}
			rounded={!background}
			{...imgProps}
		/>
	</div>
	{#if caption}
		<figcaption>
			{@render caption()}
		</figcaption>
	{/if}
</figure>
