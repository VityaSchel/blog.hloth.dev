<script lang="ts">
	import { unified } from "unified";
	import remarkParse from "remark-parse";
	import remarkDirective from "remark-directive";
	import AstNode from "./AstNode.svelte";
	// import { getUrl } from "$lib/media";

	let { content }: { content: string } = $props();

	const root = $derived(
		unified().use(remarkParse).use(remarkDirective).parse(content),
	);
</script>

<div class="flex w-full justify-center">
	<div class="article-content w-full max-w-[680px] break-words">
		{#each root.children as node (node)}
			<AstNode {node} />
		{/each}
	</div>
</div>
