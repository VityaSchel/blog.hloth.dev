<script lang="ts">
	import { onMount } from "svelte";

	let {
		aspectRatio,
		url,
		title,
		children,
	}: {
		aspectRatio: number;
		url: string;
		title: string;
		children?: import("svelte").Snippet;
	} = $props();

	let load = $state(false);
	let browser = $state(false);

	onMount(() => {
		browser = true;
	});
</script>

<figure>
	{#if !load}
		<div
			class="
				flex flex-col items-center justify-center gap-4 rounded-lg bg-slate-600
				px-16 py-8 text-center text-white
			"
			style="aspect-ratio: {aspectRatio};"
		>
			<span class="font-display text-xl font-semibold tracking-wide">
				To protect your privacy, embedded iframes are loaded upon your explicit
				request.
			</span>
			<span class="font-text text-sm font-medium text-slate-200">
				Websites such as YouTube collect metric data even when you are not
				interacting with their embedded player.
			</span>
			<div class="flex flex-col gap-2">
				<button
					class={[
						`
							rounded-full border px-4 py-1 font-semibold tracking-tight
							text-black
						`,
						{
							"border-neutral-600 bg-neutral-500 text-neutral-800 opacity-80 grayscale-100":
								!browser,
							"cursor-pointer border-slate-700 bg-white": browser,
						},
					]}
					disabled={!browser}
					onclick={() => (load = true)}
				>
					Load “{title}”
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
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="font-semibold"
				>
					{url}
				</a>
			</div>
		</div>
	{:else}
		<iframe
			src={url}
			frameborder="0"
			{title}
			sandbox="allow-orientation-lock allow-presentation allow-scripts allow-same-origin"
			allow="picture-in-picture; fullscreen; autoplay"
			style="width: 100%; aspect-ratio: {aspectRatio}; height: auto;"
		></iframe>
	{/if}
	{#if children}
		<figcaption>
			{@render children?.()}
		</figcaption>
	{/if}
</figure>
