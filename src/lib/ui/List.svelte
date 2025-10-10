<script lang="ts">
	import AstNode from "../../routes/[id=postid]/post-content/AstNode.svelte";

	let {
		style,
		start,
		items,
	}: {
		items: import("mdast").ListItem[];
		start?: number | null;
		style: "unordered" | "ordered" /* | "checklist"*/;
	} = $props();
</script>

<svelte:element this={style === "ordered" ? "ol" : "ul"} {start}>
	{#each items as item (item)}
		<li>
			{#if item.checked !== undefined && item.checked !== null}
				<input type="checkbox" checked={item.checked} disabled />
			{/if}
			{#each item.children as node (node)}
				<AstNode {node} />
			{/each}
		</li>
	{/each}
</svelte:element>
