<script lang="ts">
	import PhrasingContent from "./PhrasingContent.svelte";
	import ImageNode from "./ImageNode.svelte";
	import RenderError from "./RenderError.svelte";

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
		>{:else if node.type === "image"}<ImageNode
			{node}
		/>{:else if node.type === "footnoteReference"}
		<sup><a href="#footnote-{node.identifier}">{node.label}</a></sup>{:else}
		<RenderError>
			Unsupported block type: {node.type}
		</RenderError>
	{/if}{/each}
