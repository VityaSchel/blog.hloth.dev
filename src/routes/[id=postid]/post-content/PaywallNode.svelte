<script lang="ts">
	import Paywall from "$lib/ui/Paywall.svelte";
	import PhrasingContent from "./PhrasingContent.svelte";

	let {
		node,
	}: {
		node: import("mdast-util-directive").LeafDirective;
	} = $props();
</script>

<Paywall>
	<PhrasingContent content={node.children} />
</Paywall>
