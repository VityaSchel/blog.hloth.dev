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

<svelte:element
	this={"h" + depth}
	class={[
		"group heading m-0",
		{
			"font-semibold": depth <= 3,
			"font-medium": depth > 3,
			"mt-9 text-4xl": depth === 1,
			"mt-7 text-3xl": depth === 2,
			"mt-6 text-2xl": depth === 3,
			"text-xl": depth === 4,
			"text-lg": depth === 5,
			"text-base": depth === 6,
		},
	]}
>
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

<style>
	.heading {
		font-family: var(--font-serif);
		padding: 0;
		line-height: 1.5;
	}
</style>
