<script lang="ts">
	import { getUrl } from "$lib/media";
	import AppBar from "$lib/components/AppBar.svelte";
	import Category from "$lib/components/Category.svelte";
	import PageViews from "$lib/components/PageViews.svelte";
	import ReadTime from "$lib/components/ReadTime.svelte";
	import LazyImage from "$lib/ui/LazyImage.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	import PostContent from "./PostContent.svelte";
	import PostReactions from "./PostReactions.svelte";
	import Me from "$lib/components/Me.svelte";
	import PostMetadata from "./PostMetadata.svelte";
	import PostAdminTools from "./PostAdminTools.svelte";
	import PostTitle from "./PostTitle.svelte";
	import PostDates from "./PostDates.svelte";

	let { data } = $props();
	const post = $derived(data.post);
	const nextPost = $derived(data.nextPost);
	const banner = $derived(data.post.banner);
	const bannerAlt = $derived(data.post.bannerAlt);
	const bannerUrl = $derived(getUrl(banner.id));
	const createdAt = $derived(new Date(post.createdAt));
	const updatedAt = $derived(
		post.createdAt === post.updatedAt ? null : new Date(post.updatedAt),
	);
	let reactions = $derived(data.post.reactions);
</script>

<AppBar
	homepage
	next={nextPost
		? { title: nextPost.title, path: "/" + nextPost.id }
		: undefined}
/>
<PostMetadata post={data.post} />
<article class="pt-16">
	<div class="flex flex-col-reverse items-start justify-between md:flex-row">
		<div class="flex flex-col gap-8 self-stretch md:max-w-[50%] md:flex-[50%]">
			<div class="flex items-center gap-5">
				<Category category={post.category} readonly />
				<ReadTime value={post.readTime} />
				<PostAdminTools />
				<PageViews views={post.views} />
			</div>
			<PostTitle title={post.title} />
			<Me />
		</div>
		<div
			class="banner-clip md:banner-clip-lg relative mb-8 aspect-[1.625/1] w-full
				overflow-clip md:mb-0 md:w-auto md:max-w-[40%] md:flex-[40%]"
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
	<PostContent content={data.post.content} />
	<div class="flex w-full flex-col items-center">
		<PostDates {createdAt} {updatedAt} />
		<PostReactions bind:value={reactions} />
	</div>
</article>
