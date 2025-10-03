<script lang="ts">
	import PhrasingContent from "$lib/ui/PhrasingContent.svelte";

	let {
		content,
	}: {
		content: import("mdast").PhrasingContent[];
	} = $props();
</script>

<p>
	<PhrasingContent {content} />
</p>
