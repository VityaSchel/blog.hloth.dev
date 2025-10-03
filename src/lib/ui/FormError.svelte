<script lang="ts">
	import { fade } from "svelte/transition";

	let { children }: { children?: import("svelte").Snippet } = $props();
</script>

<span class="font-medium text-red-600" in:fade>{@render children?.()}</span>
