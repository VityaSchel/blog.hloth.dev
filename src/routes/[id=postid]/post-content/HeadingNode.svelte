<script lang="ts">
	import Heading from "$lib/ui/Heading.svelte";
	import PhrasingContent from "./PhrasingContent.svelte";
	import { toString } from "mdast-util-to-string";

	let {
		node,
	}: {
		node: import("mdast").Heading;
	} = $props();

	const content = $derived(node.children);
	let id = $derived(toString(content).toLowerCase().replace(/\s/g, "-"));
</script>

<Heading depth={node.depth} {id}>
	<PhrasingContent {content} />
</Heading>
