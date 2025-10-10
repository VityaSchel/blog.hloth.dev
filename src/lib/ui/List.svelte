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

<style>
	ul {
		list-style-type: disc;
	}

	ol {
		list-style-type: decimal;
	}

	ul,
	ol {
		padding-inline-start: 32px;
		margin: 16px 0;
		padding-top: 0px;
		padding-bottom: 0px;
		padding-inline-end: 0px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
