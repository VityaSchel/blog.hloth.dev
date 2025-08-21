<script>
	import HlothBlog from '$lib/assets/HlothBlog.svelte';
	import AppBar from '$lib/components/AppBar.svelte';
	import PageMetadata from '$lib/components/PageMetadata.svelte';
	import Posts from './Posts.svelte';

	let { data } = $props();
</script>

<AppBar />
<PageMetadata title="hloth blog" />
<HlothBlog class="headline mt-12" />
<Posts posts={data.posts} category={data.category} />
