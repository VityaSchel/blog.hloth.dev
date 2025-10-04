<script lang="ts">
	import { unified } from "unified";
	import remarkParse from "remark-parse";
	import AstNode from "./AstNode.svelte";
	// import { getUrl } from "$lib/media";

	let { content }: { content: string } = $props();

	const root = $derived(unified().use(remarkParse).parse(content));
</script>

<div class="flex w-full justify-center">
	<div class="article-content w-[680px] max-w-full [&>div]:w-full">
		{#each root.children as node (node)}
			<AstNode {node} />
		{/each}
	</div>
</div>
