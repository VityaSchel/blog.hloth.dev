<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let {
		alt,
		placeholder,
		priority = false,
		rounded,
		...props
	}: (
		| { width: number; height: number }
		| { aspectRatio: number }
		| { fill: boolean }
	) & {
		alt: string;
		placeholder?: string;
		priority?: boolean;
		rounded?: boolean;
	} & import('svelte/elements').SvelteHTMLElements['img'] = $props();

	let loaded = $state(false);

	const showPlaceholder = $derived(placeholder && browser && !loaded);
	const ar = $derived(
		'aspectRatio' in props
			? props.aspectRatio
			: 'fill' in props
				? null
				: props.width / props.height
	);
	const explicitSize = $derived('width' in props && 'height' in props);

	let img: HTMLImageElement;
	onMount(() => {
		if (img.complete) {
			loaded = true;
		}
	});
</script>

<svelte:head>
	{#if priority}
		<link rel="preload" href={props.src} as="image" />
	{/if}
</svelte:head>
<div
	class={[
		'relative',
		{
			'max-h-[500px]': explicitSize
		}
	]}
	style="aspect-ratio: {ar ?? 'unset'}; width: {explicitSize
		? props.width + 'px'
		: '100%'}; height: {explicitSize
		? props.height + 'px'
		: 'fill' in props
			? '100%'
			: 'auto'};"
>
	<!-- : `width: min(${props.width}px, 100%); height: min(${props.height}px, 100%);`} -->
	<img
		class={[
			{
				hidden: !showPlaceholder,
				'overflow-clip rounded-lg': rounded
			},
			props.class,
			'object-cover'
		]}
		src={placeholder}
		{alt}
	/>
	<img
		class={[
			{
				'opacity-0': showPlaceholder,
				'overflow-clip rounded-lg': rounded
			},
			props.class,
			'object-contain'
		]}
		{alt}
		{...props}
		onload={() => (loaded = true)}
		loading="lazy"
		bind:this={img}
	/>
</div>

<style lang="postcss">
	@reference "tailwindcss";
	img {
		@apply absolute top-0 left-0 h-full w-full;
	}
	img.contain {
		@apply max-h-full max-w-full;
	}
</style>
