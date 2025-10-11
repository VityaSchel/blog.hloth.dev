<script lang="ts">
	import z, { ZodError } from "zod";

	let {
		node,
		allowAuthor = false,
	}: {
		node: import("mdast").RootContent;
		allowAuthor?: boolean;
	} = $props();

	import HeadingNode from "./HeadingNode.svelte";
	import ParagraphNode from "./ParagraphNode.svelte";
	import ImageNode from "./ImageNode.svelte";
	import QuoteNode from "./QuoteNode.svelte";
	import SeparatorNode from "./SeparatorNode.svelte";
	import CodeNode from "./CodeNode.svelte";
	import ListNode from "./ListNode.svelte";
	import RichLinkNode from "./RichLinkNode.svelte";
	import EmbedNode from "./EmbedNode.svelte";
	import VideoNode from "./VideoNode.svelte";
	import PaywallNode from "./PaywallNode.svelte";
	import CalloutNode from "./CalloutNode.svelte";
	import BlockquoteAuthorNode from "./BlockquoteAuthorNode.svelte";
	import RenderError from "./RenderError.svelte";
	import type {
		ContainerDirective,
		LeafDirective,
		TextDirective,
		Directives,
	} from "mdast-util-directive";
	import type { RootContentMap } from "mdast";

	type DirectivesNodeMap = {
		containerDirective: ContainerDirective;
		leafDirective: LeafDirective;
		textDirective: TextDirective;
	};

	const components: {
		[K in keyof RootContentMap]?: import("svelte").Component<{
			node: RootContentMap[K];
		}>;
	} = {
		heading: HeadingNode,
		paragraph: ParagraphNode,
		image: ImageNode,
		blockquote: QuoteNode,
		thematicBreak: SeparatorNode,
		code: CodeNode,
		list: ListNode,
	};

	const directivesComponents: {
		[K in Directives["type"]]: {
			[key: string]: import("svelte").Component<{
				node: DirectivesNodeMap[K];
			}>;
		};
	} = {
		textDirective: {},
		leafDirective: {
			embed: EmbedNode,
			img: ImageNode,
			video: VideoNode,
			richlink: RichLinkNode,
			author: BlockquoteAuthorNode,
		},
		containerDirective: {
			callout: CalloutNode,
			paywall: PaywallNode,
		},
	};
</script>

{#snippet directiveRender<T extends Directives["type"]>(
	directiveName: T,
	node: DirectivesNodeMap[T],
)}
	{@const directiveComponents = directivesComponents[directiveName]}
	{#if directiveComponents && node.name in directiveComponents}
		{#if node.name === "author" && !allowAuthor}
			<RenderError>Author directive is not allowed here.</RenderError>
		{:else}
			{@const Component = directiveComponents[node.name]}
			<Component {node} />
		{/if}
	{:else}
		<!-- TODO: hint that it's in other directive -->
		<RenderError>
			Unknown directive type: {node.type}
		</RenderError>
	{/if}
{/snippet}

{#snippet componentRender<T extends keyof RootContentMap>(
	componentType: T,
	node: RootContentMap[T],
)}
	{@const Component = components[componentType]}
	<Component {node} />
{/snippet}
<svelte:boundary>
	{#snippet failed(error)}
		<RenderError>
			at node.name
			<br />{#if error instanceof ZodError}
				{z.prettifyError(error)}
			{:else if error instanceof Error}
				{error.message}
			{:else}
				{String(error)}
			{/if}
		</RenderError>
	{/snippet}
	{#if node.type in components}
		{@render componentRender(node.type, node)}
	{:else if node.type in directivesComponents}
		{#if node.type === "containerDirective"}
			{@render directiveRender("containerDirective", node)}
		{:else if node.type === "leafDirective"}
			{@render directiveRender("leafDirective", node)}
		{:else if node.type === "textDirective"}
			{@render directiveRender("textDirective", node)}
		{:else}
			<RenderError>
				Unknown directive node: {node.type}
			</RenderError>
		{/if}
	{:else}
		<RenderError>Unknown block type: {node.type}</RenderError>
	{/if}
</svelte:boundary>
