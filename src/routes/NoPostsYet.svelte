<script>
	import { page } from '$app/state';
</script>

<div
	class="
		flex h-64 w-full flex-col items-center justify-center gap-4 text-[24.5px]
	"
>
	<span class="font-text tracking-normal">No posts yet</span>
	<img src="/no.gif" alt="🙂‍↔️" />
	{#if page.url.searchParams.has('category')}
		<a href="/#posts" class="rounded-full border px-4 text-base font-medium">
			Show all posts
		</a>
	{/if}
</div>
