<script lang="ts">
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
<div
	class={[
		'relative mt-2 flex w-full items-center overflow-clip rounded-lg font-text',
		{
			'min-h-[128px] bg-slate-600': !reveal,
			'bg-cream-alt dark:bg-black-alt': reveal
		}
	]}
>
	{#if !reveal}
		<div
			class="
				absolute top-0 left-0 z-[1] flex h-full w-full flex-col items-center
				justify-center gap-1 rounded-lg p-4 backdrop-blur-sm
			"
		>
			<span class="text-center font-bold text-white">
				Please consider donating to support the blog
			</span>
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
				rel="nofollow noreferrer"
				class="rounded-md bg-blue-600 px-4 py-2 font-bold text-white !no-underline"
				onclick={() => (reveal = true)}
			>
				Donate
			</a>
		</div>
	{/if}
	<ol class="!m-0 flex w-full flex-col gap-3 p-4 !ps-10">
		{#each links as { url, title }, i (i)}
			<li class="w-full pl-2">
				<div class="flex w-full flex-col break-words">
					<span class="text-alt text-base">{title}</span>
					{#if reveal}
						<a
							href={url}
							target="_blank"
							rel="noreferrer nofollow"
							class="font-mono text-sm font-medium"
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
