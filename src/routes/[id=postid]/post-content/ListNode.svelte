<script lang="ts">
	import List from "$lib/ui/List.svelte";

	let {
		node,
	}: {
		node: import("mdast").List;
	} = $props();
</script>

<List
	style={node.ordered ? "ordered" : "unordered"}
	start={node.start}
	items={node.children}
/>
