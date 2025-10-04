<script lang="ts">
	let {
		node,
	}: {
		node: import("mdast").RootContent;
	} = $props();

	import Heading from "$lib/ui/Heading.svelte";
	// import RichLink from "$lib/ui/RichLink.svelte";
	import Paragraph from "$lib/ui/Paragraph.svelte";
	// import Warning from "$lib/ui/Warning.svelte";
	// import Video from "$lib/ui/Video.svelte";
	import Image from "$lib/ui/Image.svelte";
	// import Quote from "$lib/ui/Quote.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	import UnsupportedPlaceholder from "./UnsupportedPlaceholder.svelte";
	import Code from "$lib/ui/Code.svelte";
	// import Paywall from "$lib/ui/Paywall.svelte";
	import List from "$lib/ui/List.svelte";
	// import IsolatedIframe from "$lib/ui/IsolatedIframe.svelte";
</script>

{#if node.type === "heading"}
	<Heading depth={node.depth} content={node.children} />
{:else if node.type === "paragraph"}
	<Paragraph content={node.children} />
{:else if node.type === "image"}
	<Image {node} />
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
	<List
		style={node.ordered ? "ordered" : "unordered"}
		start={node.start}
		items={node.children}
	/>
	<!-- TODO: add paywall -->
	<!-- {:else if node.type === "paywall"}
		<Paywall links={node.data.links} /> -->
	<!-- TODO: add embed -->
	<!-- {:else if node.type === "embed"}
		<IsolatedIframe
			url={node.data.embed}
			width={node.data.width}
			height={node.data.height}
			title="Embedded {node.data.service} frame"
			caption={node.data.caption}
		/> -->
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
{:else}
	<UnsupportedPlaceholder>
		Unknown block type: {node.type}
	</UnsupportedPlaceholder>
{/if}
