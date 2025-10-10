<script lang="ts">
	import z, { ZodError } from "zod";

	let {
		node,
	}: {
		node: import("mdast").RootContent;
	} = $props();

	import HeadingNode from "./HeadingNode.svelte";
	import ParagraphNode from "./ParagraphNode.svelte";
	import ImageNode from "./ImageNode.svelte";
	import ListNode from "./ListNode.svelte";

	import EmbedNode from "./EmbedNode.svelte";
	// import RichLink from "$lib/ui/RichLink.svelte";
	// import Warning from "$lib/ui/Warning.svelte";
	// import Video from "$lib/ui/Video.svelte";
	// import Quote from "$lib/ui/Quote.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	import RenderError from "./RenderError.svelte";
	import Code from "$lib/ui/Code.svelte";
	// import Paywall from "$lib/ui/Paywall.svelte";

	$inspect(node);
</script>

{#if node.type === "heading"}
	<HeadingNode {node} />
{:else if node.type === "paragraph"}
	<ParagraphNode {node} />
{:else if node.type === "image"}
	<ImageNode {node} />
	<!-- TODO: add video -->
	<!-- {:else if node.type === "video"}
		<Video
			url={getUrl(node.data.file.id)}
			caption={node.data.caption}
			aspectRatio={node.data.aspectRatio}
		/> -->
	<!--  TODO: add blockquote -->
	<!-- {:else if node.type === "blockquote"}
				<Quote caption={node.} content={node.children} /> -->
{:else if node.type === "thematicBreak"}
	<Separator variant="asterisk" />
{:else if node.type === "code"}
	<Code language={node.lang} code={node.value} ssr="" />
	<!-- TODO: ssr code -->
{:else if node.type === "list"}
	<ListNode {node} />
	<!-- TODO: add paywall -->
	<!-- {:else if node.type === "paywall"}
		<Paywall links={node.data.links} /> -->
	<!-- TODO: add embed -->
	<!-- {:else if node.type === "embed"}
		 -->
	<!-- TODO: add warning -->
	<!-- {:else if node.type === "warning"}
		<Warning title={node.data.title} message={node.data.message} /> -->
	<!-- TODO: add link -->
	<!-- {:else if node.type === "linkTool"}
		<RichLink
			title={node.data.meta.title}
			href={node.data.link}
			description={node.data.meta.description}
			imageUrl={node.data.meta.image?.url}
		/> -->
{:else if node.type === "leafDirective"}
	<svelte:boundary>
		{#snippet failed(error)}
			<RenderError>
				at {node.name}
				<br />{#if error instanceof ZodError}
					{z.prettifyError(error)}
				{:else if error instanceof Error}
					{error.message}
				{:else}
					{String(error)}
				{/if}
			</RenderError>
		{/snippet}
		{#if node.name === "embed"}
			<EmbedNode {node} />
		{:else if node.name === "img"}
			<ImageNode {node} />
		{:else}
			<RenderError>Unknown directive: {node.name}</RenderError>
		{/if}
	</svelte:boundary>
{:else}
	<RenderError>
		Unknown block type: {node.type}
	</RenderError>
{/if}
