<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import PageMetadata from '$lib/components/PageMetadata.svelte';
	import { getDraft, type PostDraftSchema } from '$lib/local-drafts';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let initial: PostDraftSchema | null = $derived(null);
	let initialLoaded = $state(false);
	let saveDraftsLocally = $derived(!data.initial);

	onMount(() => {
		try {
			if (data?.initial) {
				initial = data.initial;
			} else {
				initial = getDraft();
			}
		} catch (error) {
			console.error(error);
			toast.error('Failed to load initial data');
		} finally {
			initialLoaded = true;
		}
	});
</script>

<PageMetadata title="post @ hloth blog" />
{#snippet label(text: string, tag: 'span' | 'noscript')}
	<div
		class="
			flex flex-1 items-center justify-center font-caption text-3xl font-bold
		"
	>
		<svelte:element this={tag}>{text}</svelte:element>
	</div>
{/snippet}
<AppBar homepage />
{#if initialLoaded}
	{#await import('./JSEditor.svelte')}
		{@render label('Loading...', 'span')}
	{:then { default: JsEditor }}
		<JsEditor
			{initial}
			bind:saveDraftsLocally
			existingPost={Boolean(data.initial)}
		/>
	{/await}
{:else}
	{@render label('JavaScript is required for editor', 'noscript')}
{/if}
