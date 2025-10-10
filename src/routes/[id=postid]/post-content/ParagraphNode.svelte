<script lang="ts">
	import Paragraph from "$lib/ui/Paragraph.svelte";
	import PhrasingContent from "./PhrasingContent.svelte";

	let {
		node,
	}: {
		node: import("mdast").Paragraph;
	} = $props();
</script>

<Paragraph>
	<PhrasingContent content={node.children} />
</Paragraph>
