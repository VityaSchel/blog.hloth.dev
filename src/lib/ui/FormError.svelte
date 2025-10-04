<script lang="ts">
	import { fade } from "svelte/transition";

	let { children }: { children?: import("svelte").Snippet } = $props();
</script>

<span
	class="w-full font-medium wrap-break-word whitespace-pre-wrap text-red-600"
	in:fade
>
	{@render children?.()}
</span>
