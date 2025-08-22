<script lang="ts">
	import { sanitize } from '$lib/sanitizer';
	import { getUrl } from '$lib/media';
	import Heading from '$lib/ui/Heading.svelte';
	import Paragraph from '$lib/ui/Paragraph.svelte';
	import Video from '$lib/ui/Video.svelte';
	import Image from '$lib/ui/Image.svelte';
	import Quote from '$lib/ui/Quote.svelte';
	import Delimiter from '$lib/ui/Separator.svelte';
	import Code from '$lib/ui/Code.svelte';
	import Paywall from '$lib/ui/Paywall.svelte';
	import List from '$lib/ui/List.svelte';
	import IsolatedIframe from '$lib/ui/IsolatedIframe.svelte';
	import Warning from '$lib/ui/Warning.svelte';
	import type { Content } from './blocks';

	let { content }: { content: Content } = $props();
</script>

<div class="flex w-full justify-center">
	<div
		class="
			article-content w-[560px] max-w-full
			[&>div]:w-full
		"
	>
		{#each content.blocks as block (block.id)}
			{#if block.type === 'header'}
				<Heading level={block.data.level} text={block.data.text} />
			{:else if block.type === 'paragraph'}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<Paragraph>{@html sanitize(block.data.text)}</Paragraph>
			{:else if block.type === 'image'}
				<Image
					file={block.data.file}
					background={block.data.withBackground}
					border={block.data.withBorder}
					caption={block.data.caption}
					alt={block.data.alt}
				/>
			{:else if block.type === 'video'}
				<Video
					url={getUrl(block.data.file.id)}
					caption={block.data.caption}
					aspectRatio={block.data.aspectRatio}
				/>
			{:else if block.type === 'quote'}
				<Quote caption={block.data.caption}>
					{sanitize(block.data.text)}
				</Quote>
			{:else if block.type === 'delimiter'}
				<Delimiter size="sm" />
			{:else if block.type === 'code'}
				<Code
					language={block.data.languageCode.substring('language-'.length)}
					code={block.data.code}
				/>
			{:else if block.type === 'list'}
				<List style={block.data.style} items={block.data.items} />
			{:else if block.type === 'paywall'}
				<Paywall links={block.data.links} />
			{:else if block.type === 'embed'}
				<IsolatedIframe
					url={block.data.embed}
					width={block.data.width}
					height={block.data.height}
					title="Embedded {block.data.service} frame"
					caption={block.data.caption}
				/>
			{:else if block.type === 'warning'}
				<Warning title={block.data.title} message={block.data.message} />
			{:else}
				<div
					class="rounded-xl bg-red-700 px-3 py-2 font-mono font-semibold text-white"
				>
					Unknown block type: {(block as { type: string }).type}
				</div>
			{/if}
		{/each}
	</div>
</div>
