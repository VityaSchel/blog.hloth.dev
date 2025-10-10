<script lang="ts">
	import Video from "$lib/ui/Video.svelte";
	import z from "zod";
	import PhrasingContent from "./PhrasingContent.svelte";

	let {
		node,
	}: {
		node: import("mdast-util-directive").LeafDirective;
	} = $props();

	const { src, ar: aspectRatio } = z
		.object({
			src: z.string(),
			ar: z.coerce.number().min(0).max(100).default(1),
		})
		.parse(node.attributes);
</script>

{#snippet caption()}
	<PhrasingContent content={node.children} />
{/snippet}
<Video {src} {aspectRatio} caption={node.children.length ? caption : undefined}
></Video>
