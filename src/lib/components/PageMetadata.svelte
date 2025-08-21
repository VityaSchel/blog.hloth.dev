<script lang="ts">
	import { page } from '$app/state';

	let {
		title,
		description = 'Personal blog about web dev, my IRL stuff, tutorials, life stories, shitpost. by hloth aka Viktor Shchelochkov 😘'
	}: {
		title: string;
		description?: string;
	} = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content="hloth blog" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://blog.hloth.dev{page.url.pathname}" />
	<meta property="og:image" content="https://blog.hloth.dev/banner.jpg" />
	<meta property="og:image:width" content="https://blog.hloth.dev/banner.jpg" />
	<meta
		property="og:image:height"
		content="https://blog.hloth.dev/banner.jpg"
	/>
	<meta property="og:image:alt" content="hloth blog" />
	<meta property="og:locale" content="en_US" />
</svelte:head>
