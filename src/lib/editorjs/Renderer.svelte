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
				{#if block.data.media == 'video'}
					<Video url={getUrl(block.data.file.id)} />
				{:else}
					<Image
						file={block.data.file}
						background={block.data.withBackground}
						border={block.data.withBorder}
						caption={block.data.caption}
						alt={block.data.alt}
					/>
				{/if}
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
			{/if}
		{/each}
	</div>
</div>
