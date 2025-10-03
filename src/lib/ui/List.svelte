<!-- <script lang="ts">
	import { sanitize } from "$lib/sanitizer";

	type ListItems = {
		content: string;
		meta: Record<string, unknown>;
		items: ListItems[];
	};

	let {
		items,
		style,
	}: {
		items: ListItems;
		style: "unordered" | "ordered" | "checklist";
	} = $props();
</script>

{#snippet list(items: ListItems)}
	<svelte:element this={style === "ordered" ? "ol" : "ul"}>
		{#each items as item, i (`${i}. ${item.content}`)}
			<li>
				{#if style === "checklist" && "checked" in item.meta}
					<input type="checkbox" checked={item.meta.checked} disabled />
				{/if}
				{item.content}
				{#if item.items.length > 0}
					{@render list(item.items)}
				{/if}
			</li>
		{/each}
	</svelte:element>
{/snippet}
{@render list(items)} -->
