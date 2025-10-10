<script lang="ts">
	let { children }: { children?: import("svelte").Snippet } = $props();
</script>

<div
	class="rounded-xl bg-red-700 px-3 py-2 font-mono font-semibold
		whitespace-pre-wrap text-white not-first:mt-2"
	data-render-error
>
	{@render children?.()}
</div>
