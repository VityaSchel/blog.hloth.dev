<script lang="ts">
	import PhrasingContent from "./PhrasingContent.svelte";
	import Image from "$lib/ui/Image.svelte";
	import UnsupportedPlaceholder from "../../routes/[id=postid]/UnsupportedPlaceholder.svelte";

	let { content }: { content: import("mdast").PhrasingContent[] } = $props();
</script>

{#each content as node (node)}{#if node.type === "text"}{node.value}{:else if node.type === "strong"}<strong
			><PhrasingContent content={node.children} /></strong
		>{:else if node.type === "emphasis"}<em
			><PhrasingContent content={node.children} /></em
		>{:else if node.type === "break"}<br />{:else if node.type === "link"}<a
			href={node.url}><PhrasingContent content={node.children} /></a
		>{:else if node.type === "inlineCode"}<code>{node.value}</code
		>{:else if node.type === "delete"}<del
			><PhrasingContent content={node.children} /></del
		>{:else if node.type === "image"}<Image
			{node}
		/>{:else if node.type === "footnoteReference"}
		<sup><a href="#footnote-{node.identifier}">{node.label}</a></sup
		>{:else if ["linkReference", "imageReference", "html"].includes(node.type)}
		<UnsupportedPlaceholder>
			Unsupported block type: {node.type}
		</UnsupportedPlaceholder>
	{/if}{/each}
