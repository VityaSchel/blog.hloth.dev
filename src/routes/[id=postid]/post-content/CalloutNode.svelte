<script lang="ts">
	import Callout from "$lib/ui/Callout.svelte";
	import z from "zod";
	import AstNode from "./AstNode.svelte";

	let {
		node,
	}: {
		node: import("mdast-util-directive").ContainerDirective;
	} = $props();

	const { emoji } = z
		.object({
			emoji: z
				.string()
				.regex(/^\p{Emoji}$/u, "`emoji` must be a single emoji character"),
		})
		.parse(node.attributes);
</script>

<Callout {emoji}>
	{#each node.children as child (child)}
		<AstNode node={child} />
	{/each}
</Callout>
