<script lang="ts">
	import PostPreview from '$lib/components/PostPreview.svelte';
	import Separator from '$lib/ui/Separator.svelte';
	import NoPostsYet from './NoPostsYet.svelte';
	import type { Image } from '$lib/media';
	import type { Category } from '$lib/server/db/schema';

	let {
		posts,
		category,
		drafts = false
	}: {
		posts: {
			id: string;
			locale: string;
			title: string;
			banner: Image;
			bannerAlt: string;
			excerpt: string;
			readTime: number;
			createdAt: number;
			category: Category;
			draft?: boolean;
		}[];
		category?: boolean;
		drafts?: boolean;
	} = $props();
</script>

<a id="posts" href="#posts" aria-hidden="true" tabindex={-1}></a>
<section class={{ 'mt-[60px]': !drafts }}>
	{#if posts.length}
		{#each posts as post, i (post.id)}
			{@const {
				id,
				locale,
				banner,
				bannerAlt,
				title,
				excerpt,
				readTime,
				createdAt,
				category
			} = post}
			<PostPreview
				{id}
				{banner}
				{locale}
				{bannerAlt}
				{title}
				{excerpt}
				{readTime}
				date={new Date(createdAt)}
				{category}
				first={i === 0}
			/>
			{#if i !== posts.length - 1}
				<Separator />
			{/if}
		{/each}
		{#if category}
			<div class="mt-24 flex justify-center">
				<a
					href="/#posts"
					class="rounded-full border px-4 text-base font-medium"
				>
					Show all
				</a>
			</div>
		{/if}
	{:else}
		<NoPostsYet />
	{/if}
</section>
