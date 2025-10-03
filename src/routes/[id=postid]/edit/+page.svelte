<script lang="ts">
	import { browser } from "$app/environment";
	import AppBar from "$lib/components/AppBar.svelte";
	import PageMetadata from "$lib/components/PageMetadata.svelte";

	let { data, form }: import("./$types").PageProps = $props();
	let draft = $derived(data.draft);

	let error = $derived(form?.error ?? null);
</script>

<PageMetadata title="post @ hloth blog" />
<AppBar homepage />
{#await import('./PostEditor.svelte')}
	<noscript>JavaScript is required for post editor</noscript>
	{#if browser}
		<div
			class="flex flex-1 items-center justify-center font-display text-3xl font-bold"
		>
			<span>Loading...</span>
		</div>
	{/if}
{:then { default: PostEditor }}
	<PostEditor {draft} bind:error />
{/await}
