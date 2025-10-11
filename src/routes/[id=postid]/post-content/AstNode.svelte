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

{#snippet renderDirective<T extends Directives["type"]>(
	directiveName: T,
	node: DirectivesNodeMap[T],
)}
	{@const directiveComponents = directivesComponents[directiveName]}
	{#if directiveComponents && node.name in directiveComponents}
		{#if node.name === "author" && !allowAuthor}
			<RenderError>Author directive is not allowed here.</RenderError>
		{:else}
			{@const Component = directiveComponents[node.name]}
			{#if Component}
				<Component {node} />
			{:else}
				<RenderError>
					<!-- TODO: hint that it's in other directive -->
					Unknown {directiveName}: {node.name}
				</RenderError>
			{/if}
		{/if}
	{:else}
		<RenderError>
			Unknown directive type: {node.type}
		</RenderError>
	{/if}
{/snippet}

{#snippet renderComponent<T extends keyof RootContentMap>(
	componentType: T,
	node: RootContentMap[T],
)}
	{@const Component = components[componentType]}
	<Component {node} />
{/snippet}

<svelte:boundary>
	{#snippet failed(error)}
		<RenderError>
			at
			{#if ["containerDirective", "leafDirective", "textDirective"].includes(node.type)}
				{@const directive = node as Directives}
				{directive.name}
			{:else}
				{node.type}
			{/if}
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
		{@render renderComponent(node.type, node)}
	{:else if node.type in directivesComponents}
		{@const directiveNodeType = node.type as Directives["type"]}
		{@render renderDirective(
			directiveNodeType,
			node as DirectivesNodeMap[typeof directiveNodeType],
		)}
	{:else}
		<RenderError>Unknown block type: {node.type}</RenderError>
	{/if}
</svelte:boundary>
