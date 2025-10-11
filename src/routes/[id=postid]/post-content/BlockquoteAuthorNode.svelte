<script lang="ts">
	import PhrasingContent from "./PhrasingContent.svelte";

	let {
		node,
	}: {
		node: import("mdast-util-directive").LeafDirective;
	} = $props();
</script>

<footer>— <PhrasingContent content={node.children} /></footer>

<style>
	footer {
		margin-top: 30px;
		font-size: 18px;
	}
</style>
