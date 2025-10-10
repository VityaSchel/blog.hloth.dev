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
			src: z.url(),
			ar: z.coerce.number().min(0).max(100).default(1),
		})
		.parse(node.attributes);
</script>

<Video {src} {aspectRatio}>
	{#snippet caption()}
		<PhrasingContent content={node.children} />
	{/snippet}
</Video>
