<script lang="ts">
	import type { GetImageResult } from "astro";
	import { onMount } from "svelte";

	let {
		aspectRatio,
		url,
		name,
		children,
		referrer = false,
		preview,
		privacyPolicy,
	}: {
		aspectRatio: number;
		url: string;
		name: string;
		children?: import("svelte").Snippet;
		referrer?: boolean;
		preview?: {
			title: string;
			thumbnail: GetImageResult;
		};
		privacyPolicy?: string;
	} = $props();

	let load = $state(false);
	let browser = $state(false);

	onMount(() => {
		browser = true;
	});

	const linkProps = {
		href: url,
		target: "_blank",
		rel: `noopener nofollow${referrer ? "" : " noreferrer"}`,
		referrerpolicy: referrer
			? "strict-origin-when-cross-origin"
			: "no-referrer",
	} as const;
</script>

<figure>
	{#if !load}
		{#if preview}
			<div style="aspect-ratio: {aspectRatio};" class="relative rounded-lg">
				<div class="flex flex-col z-[1] relative h-full">
					<a
						class="font-semibold text-white no-underline! hover:underline! p-4 bg-gradient-to-b from-black/80 to-black/0 via-50% via-black/70 truncate"
						{...linkProps}
					>
						{preview.title}
					</a>
					{#if !browser}
						<a
							class="flex-1 flex justify-center items-center no-underline!"
							{...linkProps}
						>
							<span class="load-button mb-14">Open</span>
						</a>
					{:else}
						<button
							class="flex-1 flex justify-center cursor-pointer items-center"
							onclick={() => (load = true)}
						>
							<span class="load-button mb-14">Load widget</span>
						</button>
					{/if}
					<div
						class="flex justify-between absolute items-end pointer-events-none bottom-0 left-0 w-full"
					>
						<span
							class="px-2 py-1 h-8 bg-black/60 rounded-sm text-neutral-200 font-bold text-xs xs:text-sm mx-4 mb-4"
						>
							{name}
						</span>
						<div
							class="pointer-events-auto px-4 pb-4 flex self-stretch items-center justify-center"
						>
							<span
								class="font-text text-[10px] xs:text-xs font-medium text-slate-200 text-right text-shadow-md text-shadow-black tracking-tight"
							>
								{name} might collect your personal data.
								{#if privacyPolicy}
									<a
										href={privacyPolicy}
										target="_blank"
										rel="noopener noreferrer nofollow"
										class="underline text-nowrap"
									>
										Privacy Policy
									</a>
								{/if}
							</span>
						</div>
					</div>
				</div>
				<img
					src={preview.thumbnail.src}
					alt="Thumbnail"
					class="w-full h-full object-cover absolute top-0 left-0 text-[0px]"
				/>
			</div>
		{:else}
			<div
				class="
				flex flex-col items-center justify-center gap-4 rounded-lg bg-slate-600
				px-4 smol:px-8 sm:px-16 py-8 text-center text-white min-w-0
			"
				style="aspect-ratio: {aspectRatio};"
			>
				<span class="font-display text-xl font-semibold tracking-wide">
					To protect your privacy, embedded iframes are loaded upon your
					explicit request.
				</span>
				<span class="font-text text-sm font-medium text-slate-200">
					{name} might collect your personal data even when you are not interacting
					with the embedded widget.
					{#if privacyPolicy}
						<a
							href={privacyPolicy}
							target="_blank"
							rel="noopener noreferrer nofollow"
							class="underline"
						>
							Privacy Policy
						</a>
					{/if}
				</span>
				<div class="flex flex-col gap-2">
					<button
						class="load-button"
						disabled={!browser}
						onclick={() => (load = true)}
					>
						Load embedded {name} widget
					</button>
					{#if !browser}
						<span
							class="font-display text-sm font-semibold tracking-normal text-amber-300"
						>
							Enable JavaScript to load the iframe
						</span>
					{/if}
				</div>
				<div class="flex flex-col gap-1 text-xs">
					<span class="font-text font-medium tracking-normal">
						or open the URL in new tab:
					</span>
					<a {...linkProps}>
						{url}
					</a>
				</div>
			</div>
		{/if}
	{:else}
		<iframe
			src={url}
			frameborder="0"
			title={`Embedded ${name} frame${preview ? `: ${preview.title}` : ""}`}
			sandbox="allow-orientation-lock allow-presentation allow-scripts allow-same-origin"
			allow="picture-in-picture; fullscreen; autoplay; web-share"
			style="width: 100%; aspect-ratio: {aspectRatio}; height: auto;"
			class="bg-black"
			referrerpolicy={referrer
				? "strict-origin-when-cross-origin"
				: "no-referrer"}
		></iframe>
	{/if}
	{#if children}
		<figcaption>
			{@render children?.()}
		</figcaption>
	{/if}
</figure>

<style lang="postcss">
	@reference "tailwindcss";
	.load-button {
		@apply rounded-full border px-4 py-1 font-semibold tracking-tight text-black block w-fit h-fit;

		&:disabled,
		&:where(button:disabled .load-button) {
			@apply border-neutral-600/30 bg-neutral-500 text-neutral-800 opacity-80 grayscale-100;
		}

		&:not(:disabled),
		&:where(button:not(:disabled) .load-button) {
			@apply cursor-pointer border-slate-700/30 bg-white;
		}
	}
</style>
