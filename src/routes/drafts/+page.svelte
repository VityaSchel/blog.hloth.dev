<script>
	import AppBar from '$lib/components/AppBar.svelte';
	import PageMetadata from '$lib/components/PageMetadata.svelte';
	import Separator from '$lib/ui/Separator.svelte';
	import Posts from '../Posts.svelte';

	let { data } = $props();
</script>

<AppBar homepage />
<PageMetadata title="drafts @ hloth blog" />
<h1 class="mt-24 mb-6 font-display text-6xl font-semibold">🙈 Drafts</h1>
<Separator />
<Posts posts={data.posts} />
