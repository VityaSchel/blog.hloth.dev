<script lang="ts">
	import '../app.css';
	import '../pp-mori.css';
	import { setThemeContext } from '$lib/theme';
	import Container from '$lib/components/Container.svelte';
	import { Toaster } from 'svelte-sonner';
	import Footer from '$lib/components/Footer.svelte';
	import '@fontsource/poppins/400.css';
	import '@fontsource/poppins/500.css';
	import '@fontsource/poppins/600.css';
	import '@fontsource/poppins/400-italic.css';
	import '@fontsource/poppins/500-italic.css';
	import '@fontsource/poppins/600-italic.css';
	import '@fontsource-variable/source-serif-4/opsz.css';
	import '@fontsource-variable/source-serif-4/wght-italic.css';
	import '@fontsource-variable/montserrat/wght.css';
	import '@fontsource-variable/montserrat/wght-italic.css';
	import { version } from '$app/environment';

	let { children, data } = $props();

	let context = $state({ theme: data.theme });
	$effect(() => {
		context.theme = data.theme;
	});
	setThemeContext(context);
</script>

<svelte:head>
	<meta name="blog-hloth-dev-version" content={version} />
</svelte:head>
<div class="relative z-0">
	<Container>
		{@render children?.()}
	</Container>
	<Footer />
	<Toaster />
</div>
