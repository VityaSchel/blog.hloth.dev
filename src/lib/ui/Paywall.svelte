<script lang="ts">
	import { browser } from '$app/environment';

	let {
		links
	}: {
		links: { url: string; title: string }[];
	} = $props();

	let reveal = $state(false);

	const mangle = (text: string) => {
		const chars = 'abcdefghijklmnopqrstuvwxyz';
		const mangled = text
			.split('')
			.map(() => {
				const randChar = chars[Math.floor(Math.random() * chars.length)];
				if (Math.random() > 0.5) return randChar.toUpperCase();
				else return randChar;
			})
			.join('');
		return mangled;
	};
</script>

<h6>Attached files & links</h6>
<div class="relative mt-2 flex flex-col overflow-clip rounded-lg">
	<div
		class={[
			'relative flex w-full items-center font-text',
			{
				'min-h-[128px] bg-slate-600': !reveal && browser,
				'bg-cream-alt dark:bg-black-alt': reveal || !browser
			}
		]}
	>
		<ol
			class={[
				'!m-0 flex w-full flex-col gap-3 p-4 !ps-10',
				{
					'select-none': !reveal
				}
			]}
		>
			{#each links as { url, title }, i (i)}
				<li class="w-full pl-2">
					<div class="flex w-full flex-col break-words">
						<span class="text-alt text-base">{title}</span>
						{#if reveal || !browser}
							<a
								href={url}
								target="_blank"
								rel="noreferrer nofollow"
								class="w-fit font-mono text-sm font-medium"
							>
								{url}
							</a>
						{:else}
							<span class="font-mono text-sm font-medium underline">
								{mangle(url)}
							</span>
						{/if}
					</div>
				</li>
				{#if i !== links.length - 1}
					<hr class="bg-gray h-[1px] w-full border-none" />
				{/if}
			{/each}
		</ol>
	</div>
	<div
		class={[
			`
				z-[1] flex h-full w-full flex-col items-center justify-center gap-1 p-4
				backdrop-blur-sm
			`,
			{
				hidden: reveal && browser,
				'absolute top-0 left-0': browser,
				'bg-slate-600': !browser
			}
		]}
	>
		<span class="text-center font-bold text-white">
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
					mb-2 text-center text-xs leading-[1.2] font-medium tracking-tight
					text-slate-300
				"
			>
				Clicking the button below will open donation page in a new tab and
				reveal files and links. Donations are not mandatory, but highly
				appreciated.
			</span>
			<a
				href="https://hloth.dev/donate"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-md bg-blue-600 px-4 py-2 font-bold text-white !no-underline"
				onclick={() => (reveal = true)}
			>
				Donate
			</a>
		{/if}
	</div>
</div>
