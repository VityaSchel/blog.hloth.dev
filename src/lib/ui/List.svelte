<script lang="ts">
	import type { ListItems } from '$lib/editorjs/blocks';
	import { sanitize } from '$lib/sanitizer';

	let {
		items,
		style
	}: {
		items: ListItems;
		style: 'unordered' | 'ordered' | 'checklist';
	} = $props();
</script>

{#snippet list(items: ListItems)}
	<svelte:element this={style === 'ordered' ? 'ol' : 'ul'}>
		{#each items as item, i (i)}
			<li>
				{#if style === 'checklist' && 'checked' in item.meta}
					<input type="checkbox" checked={item.meta.checked} disabled />
				{/if}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html sanitize(item.content)}
				{#if item.items.length > 0}
					{@render list(item.items)}
				{/if}
			</li>
		{/each}
	</svelte:element>
{/snippet}
{@render list(items)}
