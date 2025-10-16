<script lang="ts">
	import { onMount } from "svelte";

	let {
		children,
	}: {
		children: import("svelte").Snippet;
	} = $props();

	let browser = $state(false);
	let reveal = $state(false);
	onMount(() => {
		browser = true;
	});
</script>

<div
	class={[
		"mt-2 overflow-clip rounded-lg",
		{
			"grid grid-cols-1 grid-rows-1": browser,
			"flex flex-col": !browser,
		},
	]}
>
	<div
		class={[
			"flex w-full py-6 font-text",
			{
				"min-h-[128px] bg-slate-800/50": !reveal && browser,
				"bg-cream-alt dark:bg-black-alt": reveal || !browser,
				"col-1 row-1": browser,
			},
		]}
	>
		<ol
			class={[
				"!m-0 flex w-full flex-col gap-3 p-4 !px-10",
				{
					"select-none": !reveal,
				},
			]}
		>
			{@render children()}
		</ol>
	</div>
	<div
		class={[
			` flex h-full w-full flex-col items-center justify-center gap-2
				bg-slate-900/60 p-6 backdrop-blur-sm `,
			{
				hidden: reveal && browser,
				"z-[1] col-1 row-1": browser,
				"bg-slate-600": !browser,
			},
		]}
	>
		<span class="text-center font-serif text-xl font-bold text-white">
			Please consider {#if !browser}<a
					href="https://hloth.dev/donate"
					target="_blank"
					rel="noopener noreferrer"
				>
					donating
				</a>
			{:else}donating{/if}
			to support the blog
		</span>
		{#if browser}
			<span
				class="
					my-2 mb-4 text-center font-text text-sm leading-tight tracking-normal
					text-slate-300
				"
			>
				Clicking the button below will open donation page in a new tab and
				reveal files and links. Donations are not mandatory but highly
				appreciated.
			</span>
			<a
				href="https://hloth.dev/donate"
				target="_blank"
				rel="noopener noreferrer"
				class="
					rounded-md border border-indigo-700/50 bg-indigo-600 px-4 py-2 font-medium
					text-white !no-underline
				"
				onclick={() => (reveal = true)}
			>
				Donate
			</a>
		{/if}
	</div>
</div>
