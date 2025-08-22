<script lang="ts">
	import hljs from 'highlight.js';
	import { sanitizeHighlightedCode } from '$lib/sanitizer';
	import lightTheme from 'highlight.js/styles/github.min.css?inline';
	import darkTheme from 'highlight.js/styles/github-dark.min.css?inline';
	import { getThemeContext } from '$lib/theme';

	const context = getThemeContext();

	let { language, code }: { language: string; code: string } = $props();

	const highlightedCode = $derived.by(() => {
		try {
			return hljs.highlight(code, { language }).value;
		} catch (e) {
			console.warn(e);
			console.error(
				`Unsupported language "${language}", falling back to plain text.`
			);
			return code;
		}
	});
</script>

<svelte:head>
	{#if context.theme === 'dark'}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html '<style type="text/css">' + darkTheme + '</style>'}
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html '<style type="text/css">' + lightTheme + '</style>'}
	{/if}
</svelte:head>

<!-- eslint-disable svelte/no-at-html-tags -->
<pre
	class="language-{language} bg-white p-7 text-neutral-900 dark:bg-[#1e1e1e] dark:text-neutral-200"><code
		class="language-{language}">{@html sanitizeHighlightedCode(
			highlightedCode
		)}</code></pre>
