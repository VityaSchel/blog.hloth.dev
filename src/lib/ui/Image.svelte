<script lang="ts">
	import UnsupportedPlaceholder from "../../routes/[id=postid]/UnsupportedPlaceholder.svelte";

	// import { getUrl, type Image } from "$lib/media";
	import LazyImage from "$lib/ui/LazyImage.svelte";

	let {
		node,
	}: {
		node: import("mdast").Image;
	} = $props();

	const border = false;
	const background = false;

	const stretched = false; //$derived(!node.background);

	const imgProps: { width: number; height: number } | { aspectRatio: number } =
		$derived(
			stretched
				? { aspectRatio: 0 /*file.width / file.height*/ }
				: { width: /*file.width*/ 0, height: /*file.height*/ 0 },
		);
</script>

{#if node.alt}
	<figure>
		<div
			class={[
				"w-full",
				{
					border,
					"flex h-fit max-h-[500px] items-center justify-center overflow-clip rounded-lg bg-white p-4":
						background,
				},
			]}
		>
			<!-- TODO: placeholder -->
			<LazyImage
				src={node.url}
				placeholder=""
				alt={node.alt}
				sizes={background ? undefined : "(max-width: 608px) 100vw, 560px"}
				rounded={!background}
				{...imgProps}
			/>
		</div>
		{#if node.title}
			<figcaption>
				{node.title}
			</figcaption>
		{/if}
	</figure>
{:else}
	<UnsupportedPlaceholder>Image without alt!</UnsupportedPlaceholder>
{/if}
