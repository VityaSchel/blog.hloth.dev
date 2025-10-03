<script lang="ts">
	import PhrasingContent from "$lib/ui/PhrasingContent.svelte";
	import { toString } from "mdast-util-to-string";

	let {
		depth,
		content,
	}: {
		depth: number;
		content: import("mdast").PhrasingContent[];
	} = $props();

	let id = $derived(toString(content).toLowerCase().replace(/\s/g, "-"));
</script>

<svelte:element this={"h" + depth} class="group">
	<PhrasingContent {content} />
	<a
		{id}
		href="#{id}"
		class="opacity-0 transition-opacity group-hover:opacity-100
			focus-visible:opacity-100"
		aria-label="Link to heading"
	>
		#
	</a>
</svelte:element>
