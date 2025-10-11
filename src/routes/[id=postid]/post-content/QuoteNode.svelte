<script lang="ts">
	import Quote from "$lib/ui/Quote.svelte";
	import AstNode from "./AstNode.svelte";

	let { node }: { node: import("mdast").Blockquote } = $props();
</script>

<Quote>
	{#each node.children as child (child)}
		<AstNode allowAuthor node={child} />
	{/each}
</Quote>
