<script lang="ts">
	import Image from "$lib/ui/Image.svelte";
	import z from "zod";
	import RenderError from "./RenderError.svelte";
	import PhrasingContent from "./PhrasingContent.svelte";

	let {
		node,
	}: {
		node: import("mdast").Image | import("mdast-util-directive").LeafDirective;
	} = $props();
</script>

{#if node.type === "image"}
	<RenderError>
		Use ::img{#if node.title}[{node.title}]{/if}&#123;src={node.url} alt={node.alt}&#125;&#32;instead
	</RenderError>
{:else}
	{@const { width, height, alt, src, background, border } = z
		.object({
			src: z.url(),
			alt: z.string().min(1, "alt is required"),
			width: z.coerce.number().int(),
			height: z.coerce.number().int(),
			background: z
				.string()
				.transform(() => true)
				.default(false),
			border: z
				.string()
				.transform(() => true)
				.default(false),
		})
		.parse(node.attributes)}
	{#if !alt}
		<RenderError>Image without alt is not allowed</RenderError>
	{:else}
		<Image {src} {width} {height} {alt} {background} {border}>
			{#snippet caption()}
				{#if node.children.length}
					<PhrasingContent content={node.children} />
				{/if}
			{/snippet}
		</Image>
	{/if}
{/if}
