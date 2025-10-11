<script lang="ts">
	let {
		emoji,
		children,
	}: { emoji: string; children: import("svelte").Snippet } = $props();
</script>

<div class="flex items-start gap-2 rounded-[10px] bg-cream-alt p-3">
	<span class="flex w-6 shrink-0 items-center justify-center pt-1 text-base">
		{emoji}
	</span>
	<div
		class="callout-content min-w-0 flex-1 px-0.5 pt-[5px] pb-[3px] break-words"
	>
		{@render children()}
	</div>
</div>

<style>
	.callout-content {
		:global(p:first-child) {
			margin-top: 0;
		}
		:global(p:last-child) {
			margin-bottom: 0;
		}
	}
</style>
