<script lang="ts">
	import { sanitize } from '$lib/sanitizer';
	import { getUrl } from '$lib/media';
	import Header from '$lib/ui/Header.svelte';
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
				<Header level={block.data.level} text={block.data.text} />
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

<style>
	.article-content {
		:global {
			p {
				margin: 16px 0;
				overflow-wrap: break-word;
			}

			figure {
				padding: 16px 0;
				display: block;

				figcaption {
					color: var(--text-alt);
					font-size: 13px;
					margin-top: 16px;
				}
			}

			code {
				display: block;
				border-radius: 8px;
				padding: 28px 0px;
				font-size: 14px;
				white-space: pre;
				overflow: auto;
				word-break: break-word;
				font-family:
					Menlo,
					Consolas,
					DejaVu Sans Mono,
					ui-monospace,
					SFMono-Regular,
					Monaco,
					'Liberation Mono',
					'Courier New',
					monospace;

				.token-line {
					border: solid transparent;
					border-width: 2px 0px 2px 0px;
					background-color: inherit;

					& > span:first-child {
						width: 28px + 28px;
						display: inline-block;
						user-select: none;
						color: #878787;
						transition: color 50ms;
						pointer-events: none;
						position: sticky;
						left: 0;
						background-color: inherit;
						padding-left: 28px;
					}

					&:hover {
						border-color: rgba(62, 62, 62, 0.35);

						& > span:first-child {
							color: white;
						}
					}
				}
			}

			blockquote {
				border-left: 2px solid var(--text);
				padding-left: 30px;
				margin: 32px 0;

				p {
					font-family: var(--font-caption);
					font-style: italic;
					font-weight: 400;
					font-size: 31px;
					font-feature-settings:
						'liga' 1,
						'clig' 1,
						'calt' 1,
						'dlig' 0;
					line-height: 1.15;
					transform: scaleY(1.1);

					&::before {
						content: '“';
						font-size: 36px;
						vertical-align: middle;
						margin-right: 4px;
					}

					&::after {
						content: '”';
						font-size: 36px;
						vertical-align: bottom;
						margin-left: 4px;
					}
				}

				footer {
					margin-top: 30px;
					font-size: 18px;
				}
			}

			ul {
				list-style-type: disc;
			}

			ol {
				list-style-type: decimal;
			}

			ul,
			ol {
				padding-inline-start: 32px;
				margin: 16px 0;
			}

			a {
				text-decoration: underline;
			}
		}
	}
</style>
