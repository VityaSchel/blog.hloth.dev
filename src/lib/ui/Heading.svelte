<script lang="ts">
	let {
		depth,
		children,
		id,
	}: {
		depth: number;
		children: import("svelte").Snippet;
		id: string;
	} = $props();
</script>

<svelte:element this={"h" + depth} class="group">
	{@render children()}
	<a
		{id}
		href="#{id}"
		class="opacity-0 transition-opacity group-hover:opacity-100
			focus-visible:opacity-100"
		aria-label="Link to heading"
	>
		#
	</a>
</svelte:element>
