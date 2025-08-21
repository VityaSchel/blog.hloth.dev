<script lang="ts">
	let {
		children
	}: {
		children: import('svelte').Snippet;
	} = $props();
</script>

<p>
	{@render children()}
</p>
