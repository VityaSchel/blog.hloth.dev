<script lang="ts">
	let {
		children,
	}: {
		children: import("svelte").Snippet;
	} = $props();
</script>

<p>
	{@render children?.()}
</p>

<style>
	p:not(:only-child) {
		margin: 16px 0;
		overflow-wrap: break-word;
		padding: 0;
		line-height: 24px;
	}
</style>
