<script lang="ts">
	let {
		caption,
		children
	}: {
		caption: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<blockquote>
	<p>{@render children()}</p>
	<footer>— {caption}</footer>
</blockquote>
