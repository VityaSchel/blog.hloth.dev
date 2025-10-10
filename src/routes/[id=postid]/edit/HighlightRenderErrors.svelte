<script lang="ts">
	let {
		children,
	}: {
		children?: import("svelte").Snippet;
	} = $props();
</script>

<div class="highlight-errors relative">
	<button
		class="jump-to-error sticky top-[11px] z-[120] ml-auto cursor-pointer border
			border-black/20 bg-red-700 px-2 py-1 text-white"
		onclick={() => {
			const el = document.querySelector("[data-render-error]");
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}}
	>
		Jump to error
	</button>
	{@render children?.()}
</div>

<style>
	.jump-to-error {
		display: none;
	}
	:global {
		.highlight-errors:has([data-render-error]) .jump-to-error {
			display: block;
		}
	}
</style>
