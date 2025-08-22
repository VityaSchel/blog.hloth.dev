<script lang="ts">
	import { getUrl, mediaFileIdSchema } from '$lib/media';
	import { z } from 'zod';

	let {
		value = $bindable(),
		alt = $bindable(),
		disabled = false,
		forceShowAlt = false
	}: {
		value: string | null;
		alt: string;
		disabled?: boolean;
		forceShowAlt?: boolean;
	} = $props();

	let img: string | null = $derived(value ? getUrl(value) : null);

	let progress = $state(0);
	let uploading = $state(false);

	let fileSelector: HTMLInputElement;
</script>

<div
	class="
		banner-clip
		md:banner-clip-lg
		relative aspect-[1.625/1] max-w-[40%] flex-[40%] overflow-clip
	"
>
	<span
		class="absolute top-6 right-6 z-1 rounded-md bg-black/50 px-1.5 text-white"
	>
		1625x1000
	</span>
	<button
		class="
			absolute top-0 left-0 z-10 h-full w-full cursor-pointer bg-transparent
			focus-visible:outline-2
		"
		{disabled}
		onclick={() => fileSelector.click()}
		aria-label="Upload banner image"
	></button>
	<input
		type="file"
		accept="image/*"
		onchange={(e) => {
			const file = e.currentTarget.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = () => {
					img = reader.result as string;
				};
				reader.readAsDataURL(file);

				uploading = true;
				const formData = new FormData();
				formData.append('image', file);
				progress = 0;
				const xhr = new XMLHttpRequest();
				xhr.open('POST', '/api/media?remote=false&type=image&crop=banner');
				xhr.upload.onprogress = (event) =>
					(progress = event.loaded / event.total);
				xhr.onload = () => {
					try {
						if (xhr.status === 200) {
							value = z
								.object({
									success: z.literal(1),
									file: z.object({
										id: mediaFileIdSchema
									})
								})
								.parse(JSON.parse(xhr.responseText)).file.id;
						} else {
							img = null;
							fileSelector.value = '';
						}
					} catch (error) {
						console.error('Error parsing response:', error);
					} finally {
						uploading = false;
					}
				};
				xhr.send(formData);
			}
		}}
		class="hidden"
		bind:this={fileSelector}
		tabIndex={-1}
	/>
	{#if img}
		<img src={img} class="h-full w-full object-cover" {alt} />
		<input
			type="text"
			class={[
				`
					hover border-text absolute right-14 bottom-2 left-14 z-10 rounded-md border
					bg-white p-2 opacity-0 shadow-lg transition-opacity
					hover:opacity-100
					focus:opacity-100 focus:outline-none
					dark:bg-black-alt
				`,
				{
					'opacity-100': forceShowAlt
				}
			]}
			onclick={(e) => e.stopPropagation()}
			placeholder="[alt]"
			bind:value={alt}
			maxLength={1024}
		/>
	{:else}
		<div class="bg-placeholder h-full w-full"></div>
	{/if}
	<div
		class={[
			'absolute bottom-0 left-0 z-10 h-[4px] bg-blue-700 transition-opacity',
			{
				'opacity-1': uploading,
				'opacity-0': !uploading
			}
		]}
		style="width: {(progress / 0.8 + 0.1) * 100}%"
	></div>
</div>
