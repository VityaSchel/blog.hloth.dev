<script lang="ts">
	import { formatTitle } from '$lib/formatter';
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import Menu from '$lib/components/Menu.svelte';
	import { getThemeContext } from '$lib/theme';

	type Link = { path: string; title: string };

	let props: {
		next?: Link;
	} & (
		| {
				previous?: Link;
		  }
		| { homepage: true }
	) = $props();

	const startEl: Link | undefined = $derived(
		'homepage' in props
			? { path: '/', title: 'Go back to the home page' }
			: props.previous
	);
	const endEl: Link | undefined = $derived(props.next);

	const context = getThemeContext();
</script>

<header class="flex w-full flex-col gap-[12px]">
	{#if startEl || endEl}
		<nav class="mb-1">
			<ul
				class={[
					`
						flex flex-col gap-x-4 gap-y-3 leading-5
						md:flex-row
					`,
					{
						'justify-start': !endEl,
						'justify-end': !startEl,
						'justify-between': startEl && endEl
					}
				]}
			>
				{#if startEl}
					<li>
						<a href={startEl.path} class="flex items-center gap-2">
							<svg
								width="20"
								viewBox="0 0 100 60"
								xmlns="http://www.w3.org/2000/svg"
							>
								<line
									x1="10"
									y1="50"
									x2="90"
									y2="50"
									stroke="currentColor"
									stroke-width="6"
								/>
								<line
									x1="10"
									y1="50"
									x2="30"
									y2="30"
									stroke="currentColor"
									stroke-width="6"
								/>
							</svg>

							{formatTitle(startEl.title).title}
						</a>
					</li>
				{/if}
				{#if endEl}
					<li class="self-end text-right">
						<a href={endEl.path} class="flex items-center gap-2">
							{formatTitle(endEl.title).title}

							<svg
								width="20"
								viewBox="0 0 100 60"
								xmlns="http://www.w3.org/2000/svg"
							>
								<line
									x1="10"
									y1="50"
									x2="90"
									y2="50"
									stroke="currentColor"
									stroke-width="6"
								/>
								<line
									x1="70"
									y1="30"
									x2="90"
									y2="50"
									stroke="currentColor"
									stroke-width="6"
								/>
							</svg>
						</a>
					</li>
				{/if}
			</ul>
		</nav>
	{/if}
	<ThemeSwitch />
	<div
		class="
			mt-1 flex w-full items-center justify-end
			not-pointer-fine:justify-between
		"
	>
		<span
			class="
				optical-sizing-none hidden h-5 font-serif text-sm leading-tight
				text-black-alt/90 select-none
				not-pointer-fine:block
				dark:text-sandy/70
			"
		>
			tap to turn lights {context.theme === 'dark' ? 'on' : 'off'}
			<svg
				width="9"
				height="13"
				viewBox="0 0 9 13"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class="ml-1 inline-block"
			>
				<path
					d="M8.88672 5H6.5V9.5H1C0.723858 9.5 0.5 9.27614 0.5 9C0.5 8.72386 0.723858 8.5 1 8.5H5.5V5H3.11328L6 0L8.88672 5Z"
					fill="currentColor"
				/>
			</svg>
		</span>
		<Menu />
	</div>
</header>
