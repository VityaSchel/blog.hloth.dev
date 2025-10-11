<script lang="ts">
	import Separator from "$lib/ui/Separator.svelte";

	let { node }: { node: import("mdast").ThematicBreak } = $props();
</script>

{#if node}
	<Separator />
{/if}
