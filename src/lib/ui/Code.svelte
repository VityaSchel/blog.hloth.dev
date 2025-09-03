<script lang="ts">
	import { codeToHtml } from 'shiki';
	import { getThemeContext } from '$lib/theme';
	import { sanitizeHighlightedCode } from '$lib/sanitizer';

	let { language, code }: { language: string; code: string } = $props();

	const context = getThemeContext();

	let highlightedCode = $derived.by(async () => {
		try {
			return await codeToHtml(code, {
				lang: language,
				theme: context.theme === 'dark' ? 'github-dark' : 'github-light'
			});
		} catch (e) {
			console.error(`Language ${language} is not supported by shiki.`, e);
			return null;
		}
	});
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<div class="code-container font-mono text-sm whitespace-pre-wrap">
	{#snippet fallback()}
		<pre
			class="
				bg-white text-neutral-900
				dark:bg-[#1e1e1e] dark:text-neutral-200
			">{@html sanitizeHighlightedCode(code)}</pre>
	{/snippet}
	{#await highlightedCode}
		{@render fallback()}
	{:then highlightedCode}
		{#if highlightedCode === null}
			{@render fallback()}
		{:else}
			{@html sanitizeHighlightedCode(highlightedCode)}
		{/if}
	{/await}
</div>

<style>
	.code-container :global(pre) {
		padding: 1rem;
		border-radius: 12px;
	}
</style>
