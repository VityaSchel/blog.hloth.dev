<script lang="ts">
	import z, { ZodError } from "zod";

	let {
		node,
		allowAuthor = false,
	}: {
		node: import("mdast").RootContent;
		allowAuthor: boolean;
	} = $props();

	import HeadingNode from "./HeadingNode.svelte";
	import ParagraphNode from "./ParagraphNode.svelte";
	import ImageNode from "./ImageNode.svelte";
	import ListNode from "./ListNode.svelte";
	// import RichLink from "$lib/ui/RichLink.svelte";
	// import Warning from "$lib/ui/Warning.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	import RenderError from "./RenderError.svelte";
	// import Code from "$lib/ui/Code.svelte";
	import CodeNode from "./CodeNode.svelte";
	import VideoNode from "./VideoNode.svelte";
	import EmbedNode from "./EmbedNode.svelte";
	import PaywallNode from "./PaywallNode.svelte";
	import QuoteNode from "./QuoteNode.svelte";
	import BlockquoteAuthorNode from "./BlockquoteAuthorNode.svelte";
</script>

{#if node.type === "heading"}
	<HeadingNode {node} />
{:else if node.type === "paragraph"}
	<ParagraphNode {node} />
{:else if node.type === "image"}
	<ImageNode {node} />
{:else if node.type === "blockquote"}
	<QuoteNode {node} />
{:else if node.type === "thematicBreak"}
	<Separator variant="asterisk" />
{:else if node.type === "code"}
	<CodeNode {node} />
{:else if node.type === "list"}
	<ListNode {node} />
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
		{:else if node.name === "video"}
			<VideoNode {node} />
		{:else if node.name === "paywall"}
			<PaywallNode {node} />
		{:else if node.name === "author"}
			{#if allowAuthor}
				<BlockquoteAuthorNode {node} />
			{:else}
				<RenderError>Author directive is not allowed here</RenderError>
			{/if}
		{:else}
			<RenderError>Unknown leaf directive: {node.name}</RenderError>
		{/if}
	</svelte:boundary>
{:else if node.type === "textDirective"}
	<RenderError>Unknown text directive: {node.name}</RenderError>
{:else}
	<RenderError>
		Unknown block type: {node.type}
	</RenderError>
{/if}
