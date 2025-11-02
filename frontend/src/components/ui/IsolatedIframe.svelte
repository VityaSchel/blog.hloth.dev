<script lang="ts">
	import { onMount } from "svelte";

	let {
		aspectRatio,
		url,
		name,
		children,
		referrer = false,
	}: {
		aspectRatio: number;
		url: string;
		name: string;
		children?: import("svelte").Snippet;
		referrer?: boolean;
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
				px-4 smol:px-8 sm:px-16 py-8 text-center text-white min-w-0
			"
			style="aspect-ratio: {aspectRatio};"
		>
			<span class="font-display text-xl font-semibold tracking-wide">
				To protect your privacy, embedded iframes are loaded upon your explicit
				request.
			</span>
			<span class="font-text text-sm font-medium text-slate-200">
				{name} might collect your personal data even when you are not interacting
				with the embedded widget.
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
				<a
					href={url}
					target="_blank"
					rel="noopener nofollow{referrer ? '' : ' noreferrer'}"
					class="font-semibold"
					referrerpolicy={referrer
						? "strict-origin-when-cross-origin"
						: "no-referrer"}
				>
					{url}
				</a>
			</div>
		</div>
	{:else}
		<iframe
			src={url}
			frameborder="0"
			title={`Embedded ${name} frame`}
			sandbox="allow-orientation-lock allow-presentation allow-scripts allow-same-origin"
			allow="picture-in-picture; fullscreen; autoplay"
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
