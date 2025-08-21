<script lang="ts">
	import Prism from 'prismjs';
	import loadLanguages from 'prismjs/components/';
	import { sanitize } from '$lib/sanitizer';
	import './prism-theme.css';

	let { language, code }: { language: string; code: string } = $props();

	const highlightedCode = $derived.by(() => {
		loadLanguages([language]);
		return Prism.highlight(code, Prism.languages[language], language);
	});
</script>

<pre><code class="language-{language}">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html sanitize(highlightedCode)}
</code></pre>
