<script lang="ts">
	import type { GetImageResult } from "astro";
	import { onMount } from "svelte";
	import { loadIsolatedFrame } from "./isolated-iframe-state.svelte";

	let {
		aspectRatio,
		url,
		name,
		serviceId,
		children,
		referrer = false,
		preview,
		privacyPolicy,
		containerClass,
	}: {
		aspectRatio?: number | null;
		url: string;
		name: string;
		serviceId: string;
		children?: import("svelte").Snippet;
		referrer?: boolean;
		preview?: {
			title: string;
			thumbnail: GetImageResult;
		};
		privacyPolicy?: string;
		containerClass?: import("svelte/elements").ClassValue;
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

	$effect(() => {
		if (loadIsolatedFrame[serviceId]) {
			load = true;
		}
	});
</script>

<figure>
	{#if !load}
		{#if preview}
			<div
				style={aspectRatio ? `aspect-ratio: ${aspectRatio};` : undefined}
				class="relative max-w-full rounded-lg"
			>
				<div class="relative z-[1] flex h-full flex-col">
					<a
						class="truncate bg-gradient-to-b from-black/80 via-black/70 via-50% to-black/0 p-4 font-semibold text-white no-underline! hover:underline!"
						{...linkProps}
					>
						{preview.title}
					</a>
					{#if !browser}
						<a
							class="flex flex-1 items-center justify-center no-underline!"
							{...linkProps}
						>
							<span class="load-button mb-14">Open</span>
						</a>
					{:else}
						<button
							class="flex flex-1 cursor-pointer items-center justify-center"
							onclick={() => (load = true)}
						>
							<span class="load-button mb-14">Load widget</span>
						</button>
					{/if}
					<div
						class="pointer-events-none absolute bottom-0 left-0 flex w-full items-end justify-between"
					>
						<span
							class="mx-4 mb-4 rounded-sm bg-black/60 px-2 py-1 text-xs font-bold text-neutral-200 xs:text-sm"
						>
							{name}
						</span>
						<div
							class="pointer-events-auto flex items-center justify-center self-stretch px-4 pb-4"
						>
							<span
								class="text-right font-text text-[10px] font-medium tracking-tight text-slate-200 text-shadow-black text-shadow-md xs:text-xs"
							>
								{name} might collect your personal data.
								{#if privacyPolicy}
									<a
										href={privacyPolicy}
										target="_blank"
										rel="noopener noreferrer nofollow"
										class="text-nowrap underline"
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
					class="absolute top-0 left-0 h-full w-full object-cover text-[0px]"
				/>
			</div>
		{:else}
			<div
				class="
				flex min-w-0 flex-col items-center justify-center gap-4 rounded-lg
				bg-slate-600 px-4 py-8 text-center text-white smol:px-8 sm:px-16
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
						onclick={() => {
							load = true;
							loadIsolatedFrame[serviceId] = true;
						}}
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
			style={aspectRatio
				? `aspect-ratio: ${aspectRatio}; height: auto;`
				: undefined}
			class={["w-full bg-black", containerClass]}
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
		@apply block h-fit w-fit rounded-full border px-4 py-1 font-semibold tracking-tight text-black;

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
