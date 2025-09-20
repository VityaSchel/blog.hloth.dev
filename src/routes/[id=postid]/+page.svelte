<script lang="ts">
	import { formatTitle } from '$lib/formatter';
	import { getUrl } from '$lib/media';
	import AppBar from '$lib/components/AppBar.svelte';
	import Category from '$lib/components/Category.svelte';
	import PageViews from '$lib/components/PageViews.svelte';
	import ReadTime from '$lib/components/ReadTime.svelte';
	import Renderer from '$lib/editorjs/Renderer.svelte';
	import LazyImage from '$lib/ui/LazyImage.svelte';
	import Separator from '$lib/ui/Separator.svelte';
	import PostReactions from './PostReactions.svelte';
	import { page } from '$app/state';

	let { data } = $props();
	const post = $derived(data.post);
	const nextPost = $derived(data.nextPost);
	const banner = $derived(data.post.banner);
	const bannerAlt = $derived(data.post.bannerAlt);
	const bannerUrl = $derived(getUrl(banner.id));
	const formattedTitle = $derived(formatTitle(post.title));
	const createdAt = $derived(new Date(post.createdAt));
	const updatedAt = $derived(
		post.createdAt === post.updatedAt ? null : new Date(post.updatedAt)
	);
	let reactions = $derived(data.post.reactions);

	const articleJsonLd = $derived(
		'<script type="application/ld+json">' +
			JSON.stringify({
				'@context': 'https://schema.org',
				'@type': 'Article',
				headline: post.title,
				description: post.excerpt,
				image: {
					'@type': 'ImageObject',
					url: bannerUrl,
					width: post.banner.width,
					height: post.banner.height,
					caption: post.bannerAlt
				},
				author: {
					'@type': 'Person',
					name: 'Viktor Shchelochkov',
					url: 'https://hloth.dev/me',
					email: 'hi@hloth.dev'
				},
				datePublished: createdAt.toISOString(),
				dateModified: updatedAt ? updatedAt.toISOString() : undefined,
				mainEntityOfPage: {
					'@type': 'WebPage',
					'@id': page.url.origin + '/' + post.id
				}
			}) +
			'<' +
			'/' +
			'script>'
	);
</script>

<AppBar
	homepage
	next={nextPost
		? { title: nextPost.title, path: '/' + nextPost.id }
		: undefined}
/>
<svelte:head>
	<title>{post.title}</title>
	<meta name="description" content={post.excerpt} />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={post.excerpt} />
	<meta property="og:site_name" content="hloth blog" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://blog.hloth.dev/{post.id}" />
	<meta property="og:image" content={bannerUrl} />
	<meta property="og:image:width" content={String(banner.width)} />
	<meta property="og:image:height" content={String(banner.height)} />
	<meta property="og:image:alt" content={bannerAlt} />
	<meta property="article:published_time" content={createdAt.toISOString()} />
	{#if updatedAt !== null}
		<meta property="article:modified_time" content={updatedAt.toISOString()} />
	{/if}
	<meta
		property="og:locale"
		content={post.locale === 'ru' ? 'ru_RU' : 'en_US'}
	/>
	<meta
		property="article:author"
		content="Viktor Shchelochkov (https://hloth.dev/me)"
	/>
	<meta property="article:section" content={post.category} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:url" content="https://blog.hloth.dev/{post.id}" />
	<meta name="twitter:title" content={post.title} />
	<meta name="twitter:description" content={post.excerpt} />
	<meta name="twitter:image" content={bannerUrl} />
	<meta name="twitter:creator" content="@hlothdev" />
	<link rel="preload" href="/me.webp" as="image" />

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html articleJsonLd}
</svelte:head>
<article class="pt-16">
	<div
		class="
			flex flex-col-reverse items-start justify-between
			md:flex-row
		"
	>
		<div
			class="
				flex flex-col gap-8 self-stretch
				md:max-w-[50%] md:flex-[50%]
			"
		>
			<div class="flex items-center gap-5">
				<Category category={post.category} />
				<ReadTime value={post.readTime} />
				{#if data.admin}
					<a
						href="/post?edit={post.id}"
						class="
							ml-2 rounded-full p-2 transition-colors
							hover:bg-cream-alt
							dark:hover:bg-black-alt
						"
						aria-label="Edit post"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z"
							></path>
						</svg>
					</a>
				{/if}
				<PageViews views={post.views} />
			</div>
			<h1
				class="
					one-storey-a leading-tighter line-clamp-3 font-display text-3xl
					font-semibold tracking-tight
					md:text-6xl
				"
				title={post.title}
			>
				<span class="optical-sizing-none font-serif font-normal italic">
					{formattedTitle.emphasized}
				</span>
				{formattedTitle.regular}
			</h1>
			<a class="mt-auto flex w-fit items-center gap-4" href="https://hloth.dev">
				<img
					src="/me.webp"
					alt="Viktor Shchelochkov"
					width={50}
					height={50}
					class="border-text rounded-full border"
				/>
				<div class="flex flex-col">
					<span class="font-display font-medium">Viktor Shchelochkov</span>
					<span class="text-alt font-mono text-sm uppercase">
						Fullstack developer
					</span>
				</div>
			</a>
		</div>
		<div
			class="
				banner-clip
				md:banner-clip-lg
				relative mb-8 aspect-[1.625/1] w-full overflow-clip
				md:mb-0 md:w-auto md:max-w-[40%] md:flex-[40%]
			"
		>
			<LazyImage
				src={bannerUrl}
				alt={bannerAlt}
				fill
				placeholder={banner.placeholder}
				class="object-cover"
				draggable={false}
				sizes="(max-width: 768px) 90vw, (max-width: 1168px) 36vw, 38vw"
				priority
			/>
		</div>
	</div>
	<Separator />
	<Renderer content={data.post.content} />
	<div class="flex w-full flex-col items-center">
		<div
			class="
				mt-16 flex w-full max-w-[560px] flex-col justify-between gap-2
				md:mt-8 md:flex-row md:items-center
			"
		>
			{#snippet dateRender(label: string, date: Date)}
				<div
					class="
						text-[#a3a3a3]
						dark:text-[#4b5563]
					"
				>
					<span class="font-display font-semibold">{label}</span>
					<time
						datetime={date.toISOString()}
						title={Intl.DateTimeFormat('en-US', {
							day: '2-digit',
							month: '2-digit',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit'
						}).format(date)}
					>
						{Intl.DateTimeFormat('en-US', {
							day: 'numeric',
							month: 'long',
							...(date.getFullYear() !== new Date().getFullYear() && {
								year: 'numeric'
							})
						}).format(date)}
					</time>
				</div>
			{/snippet}

			{@render dateRender('Published at:', createdAt)}
			{#if updatedAt !== null}
				{@render dateRender('Updated at:', updatedAt)}
			{/if}
		</div>
		<PostReactions bind:value={reactions} />
	</div>
</article>
