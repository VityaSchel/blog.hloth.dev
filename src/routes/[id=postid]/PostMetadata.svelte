<script lang="ts">
	import { page } from "$app/state";
	import type { Post } from "$lib/post";

	let {
		post,
		bannerUrl,
		createdAt,
		updatedAt,
	}: {
		post: Post;
		bannerUrl: string;
		createdAt: Date;
		updatedAt: Date | null;
	} = $props();

	const articleJsonLd = $derived(
		'<script type="application/ld+json">' +
			JSON.stringify({
				"@context": "https://schema.org",
				"@type": "Article",
				headline: post.title,
				description: post.excerpt,
				image: {
					"@type": "ImageObject",
					url: bannerUrl,
					width: post.banner.width,
					height: post.banner.height,
					caption: post.bannerAlt,
				},
				author: {
					"@type": "Person",
					name: "Viktor Shchelochkov",
					url: "https://hloth.dev/me",
					email: "hi@hloth.dev",
				},
				datePublished: createdAt.toISOString(),
				dateModified: updatedAt ? updatedAt.toISOString() : undefined,
				mainEntityOfPage: {
					"@type": "WebPage",
					"@id": page.url.origin + "/" + post.id,
				},
			}) +
			"<" +
			"/" +
			"script>",
	);
</script>

<svelte:head>
	<title>{post.title}</title>
	<meta name="description" content={post.excerpt} />
	<meta property="og:title" content={post.title} />
	<meta property="og:description" content={post.excerpt} />
	<meta property="og:site_name" content="hloth blog" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content="https://blog.hloth.dev/{post.id}" />
	<meta property="og:image" content={bannerUrl} />
	<meta property="og:image:width" content={String(post.banner.width)} />
	<meta property="og:image:height" content={String(post.banner.height)} />
	<meta property="og:image:alt" content={post.bannerAlt} />
	<meta property="article:published_time" content={createdAt.toISOString()} />
	{#if updatedAt !== null}
		<meta property="article:modified_time" content={updatedAt.toISOString()} />
	{/if}
	<meta
		property="og:locale"
		content={post.locale === "ru" ? "ru_RU" : "en_US"}
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
