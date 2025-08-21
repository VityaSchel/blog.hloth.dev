<script lang="ts">
	import { getUrl, type Image } from '$lib/media';
	import { sanitize } from '$lib/sanitizer';
	import LazyImage from '$lib/ui/LazyImage.svelte';

	let {
		file,
		caption,
		alt,
		border,
		background
	}: {
		file: Image;
		caption: string;
		alt: string;
		border: boolean;
		background: boolean;
	} = $props();

	const stretched = $derived(!background);

	const imgProps: { width: number; height: number } | { aspectRatio: number } =
		$derived(
			stretched
				? { aspectRatio: file.width / file.height }
				: { width: file.width, height: file.height }
		);
</script>

<figure>
	<div
		class={[
			'w-full',
			{
				border,
				'flex h-fit max-h-[500px] items-center justify-center overflow-clip rounded-lg bg-white p-4':
					background
			}
		]}
	>
		<LazyImage
			src={getUrl(file.id)}
			placeholder={file.placeholder}
			{alt}
			{...imgProps}
			sizes={background ? undefined : '(max-width: 608px) 100vw, 560px'}
			rounded={!background}
		/>
	</div>
	<figcaption>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html sanitize(caption)}
	</figcaption>
</figure>
