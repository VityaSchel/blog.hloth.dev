<script lang="ts">
	import Paywall from "$lib/ui/Paywall.svelte";
	import AstNode from "./AstNode.svelte";

	let {
		node,
	}: {
		node: import("mdast-util-directive").ContainerDirective;
	} = $props();
</script>

<Paywall>
	{#each node.children as child (child)}
		<AstNode node={child} />
	{/each}
</Paywall>
