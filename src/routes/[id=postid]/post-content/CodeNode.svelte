<script lang="ts">
	import Code from "$lib/ui/Code.svelte";

	let {
		node,
	}: {
		node: import("mdast").Code;
	} = $props();
</script>

<!-- TODO: ssr code -->
<Code language={node.lang} code={node.value} ssr="" />
