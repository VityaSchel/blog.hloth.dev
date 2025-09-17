<script lang="ts">
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

	let hasPlaceholder = $derived(false);

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
			hasPlaceholder = false;
		} else {
			hasPlaceholder = true;
			img.style.opacity = '0';
			img.addEventListener('load', () => {
				img.style.opacity = '1';
				hasPlaceholder = false;
			});
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
		'relative overflow-clip',
		{
			'max-h-[500px]': explicitSize,
			'rounded-lg': rounded
		}
	]}
	style="aspect-ratio: {ar ?? 'unset'}; width: {explicitSize
		? props.width + 'px'
		: '100%'}; height: {explicitSize
		? props.height + 'px'
		: 'fill' in props
			? '100%'
			: 'auto'};{hasPlaceholder
		? `background-image: url('${placeholder}'); `
		: ''} background-size: cover;"
>
	<img
		class={[
			{
				'overflow-clip rounded-lg': rounded
			},
			props.class,
			'object-contain backdrop-blur-2xl'
		]}
		{alt}
		{...props}
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
