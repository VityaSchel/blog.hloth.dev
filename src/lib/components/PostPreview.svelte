<script lang="ts">
	import Category from '$lib/components/Category.svelte';
	import type { Category as PostCategory } from '$lib/server/db/schema';
	import { formatTitle } from '$lib/formatter';
	import ReadTimer from '$lib/components/ReadTime.svelte';
	import LazyImage from '$lib/ui/LazyImage.svelte';
	import { getUrl, type Image } from '$lib/media';

	let {
		first = false,
		draft = false,
		id,
		locale,
		banner,
		bannerAlt,
		title,
		excerpt,
		category,
		readTime,
		date
	}: {
		first?: boolean;
		draft?: boolean;
		id: string;
		locale: string;
		banner: Image;
		bannerAlt: string;
		title: string;
		excerpt: string;
		category: PostCategory;
		readTime: number;
		date: Date;
	} = $props();

	const { emphasized, regular } = formatTitle(title);
</script>

<a
	class="article-preview block w-full"
	href="{draft ? '/post?edit=' : '/'}{id}"
>
	<article
		class="
			-mr-4 -ml-4 flex flex-col
			md:flex-row
		"
	>
		<time
			dateTime={date.toISOString()}
			title={Intl.DateTimeFormat('en-US', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			}).format(date)}
			class="
				col-span-2 px-4 font-display text-base font-medium
				md:max-w-[16.67%] md:flex-[16.67%]
			"
		>
			{Intl.DateTimeFormat('en-US', {
				day: 'numeric',
				month: 'short',
				...(date.getFullYear() !== new Date().getFullYear() && {
					year: 'numeric'
				})
			}).format(date)}
		</time>
		<div
			class="
				mt-2 flex flex-col px-4
				md:mt-0 md:max-w-[50%] md:flex-[50%]
				lg:max-w-[25%] lg:flex-[25%]
			"
		>
			<h2 class="font-display text-3xl font-semibold tracking-[-.03em]" {title}>
				<span class="font-serif font-normal italic">{emphasized}</span>
				{regular}
			</h2>
			<p
				class="
					mt-4 line-clamp-6 font-text text-ellipsis
					md:mt-6
				"
			>
				{#if locale === 'ru'}
					<span
						class="
							optical-sizing-force mr-0.5 mb-0.5 inline-block rounded-full bg-black
							px-2 py-0.5 align-middle font-serif text-xs font-medium tracking-normal
							text-white
							dark:bg-golden-creamy dark:text-black
						"
					>
						Read in Russian
					</span>
				{/if}
				{excerpt}
			</p>
			<div
				class="
					flex items-center gap-5 pt-8
					md:mt-auto
				"
			>
				<Category {category} />
				<ReadTimer value={readTime} />
			</div>
		</div>
		<div
			class="
				relative mt-8 ml-auto aspect-[1.625/1] w-full px-4
				md:mt-0 md:w-auto md:max-w-[41.67%] md:flex-[41.67%]
			"
		>
			<div
				class="
					banner-clip
					md:banner-clip-lg
					relative aspect-[1.625/1] h-auto w-full overflow-clip
				"
			>
				<LazyImage
					src={getUrl(banner.id)}
					placeholder={banner.placeholder}
					fill
					alt={bannerAlt}
					priority={first}
					class="object-cover"
					draggable={false}
					sizes="(max-width: 768px) 93vw, 38vw"
				/>
			</div>
			<div
				class="
					absolute top-10 right-14 z-[1] flex h-[50px] w-[50px] items-center
					justify-center
				"
			>
				<span
					class="
						open-indicator relative h-0 w-0 overflow-clip rounded-full bg-white
						text-3xl shadow-md transition-all duration-300
					"
				>
					<span
						class="
							absolute top-2.5 right-2.5 opacity-0 transition-opacity duration-[800ms]
						"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
						>
							<path
								fill="#000000"
								d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"
							></path>
						</svg>
					</span>
				</span>
			</div>
		</div>
	</article>
</a>
