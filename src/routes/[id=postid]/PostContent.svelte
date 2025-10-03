<script lang="ts">
	import { unified } from "unified";
	import remarkParse from "remark-parse";
	// import { getUrl } from "$lib/media";

	import Heading from "$lib/ui/Heading.svelte";
	// import RichLink from "$lib/ui/RichLink.svelte";
	import Paragraph from "$lib/ui/Paragraph.svelte";
	// import Warning from "$lib/ui/Warning.svelte";
	// import Video from "$lib/ui/Video.svelte";
	// import Image from "$lib/ui/Image.svelte";
	// import Quote from "$lib/ui/Quote.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	// import Code from "$lib/ui/Code.svelte";
	// import Paywall from "$lib/ui/Paywall.svelte";
	// import List from "$lib/ui/List.svelte";
	// import IsolatedIframe from "$lib/ui/IsolatedIframe.svelte";

	let { content }: { content: string } = $props();

	const root = $derived(unified().use(remarkParse).parse(content));
</script>

<div class="flex w-full justify-center">
	<div class="article-content w-[680px] max-w-full [&>div]:w-full">
		{#each root.children as node (node)}
			{#if node.type === "heading"}
				<Heading depth={node.depth} content={node.children} />
			{:else if node.type === "paragraph"}
				<Paragraph content={node.children} />
				<!-- {:else if node.type === "image"} -->
				<!-- background={node.data.withBackground} -->
				<!-- border={node.data.withBorder} -->
				<!-- {#if node.alt}
					<Image
						file={node.data.file}
						caption={node.title ?? undefined}
						alt={node.alt}
					/>
				{:else}
					<span class="rounded-md bg-red-500 px-2 py-1 font-bold text-white">
						Image with no alt!
					</span>
				{/if} -->
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
				<!-- {:else if node.type === "code"}
				<Code
					language={node.lang.substring("language-".length)}
					code={node.data.code}
					ssr={node.data.ssr}
				/>
			{:else if node.type === "list"}
				<List
					style={node.ordered ? "ordered" : "unordered"}
					items={node.children}
				/> -->
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
				<div
					class="
						rounded-xl bg-red-700 px-3 py-2 font-mono font-semibold text-white
						not-first:mt-2
					"
				>
					Unknown block type: {node.type}
				</div>
			{/if}
		{/each}
	</div>
</div>
