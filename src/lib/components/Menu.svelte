<script lang="ts">
	import { trapFocus } from 'trap-focus-svelte';
	import CloseMenuButton from '$lib/components/CloseMenuButton.svelte';
	import PushNotificationsSwitch from '$lib/components/PushNotificationsSwitch.svelte';

	let open = $state(false);
	let closing = $state(false);
</script>

<button
	class="
		w-[84px] cursor-pointer rounded-full bg-black pt-[3px] pb-[2px] text-[14px]
		tracking-[-.03em] text-white
		dark:bg-white dark:text-black
	"
	onclick={() => {
		open = !open;
		closing = false;
	}}
>
	Menu
</button>
<div
	class={[
		'transition-blur fixed top-0 left-0 z-10 h-full w-full duration-500',
		{
			'pointer-events-none': !open
		}
	]}
	style="--blur: {open ? 20 : 0}px;"
	use:trapFocus
	inert={!open}
>
	<button
		onclick={(e) => {
			if (e.target !== e.currentTarget) return;
			open = false;
		}}
		class="absolute top-0 left-0 h-full w-full"
		aria-label="Close menu"
		tabindex="-1"
	></button>
	<div
		class={[
			`
				menu-bg absolute right-0 flex h-full max-w-full flex-col bg-black py-8
				font-display text-4xl font-bold text-white transition-[width] duration-500
				ease-in-out will-change-[width]
			`,
			{
				'w-0': !open,
				'w-96': open
			}
		]}
	>
		<CloseMenuButton bind:closing onClose={() => (open = false)} />
		<div class="flex w-96 max-w-screen flex-1 flex-col">
			{#snippet link(label: string, href: string)}
				<a
					{href}
					class="
						px-8 py-2 transition-[letter-spacing,color]
						focus:outline-0
						focus-visible:bg-blue-400/20
						hf:tracking-wide hf:text-neutral-300
					"
				>
					{label}
				</a>
			{/snippet}
			{@render link('About Me', 'https://hloth.dev/me')}
			{@render link('My Portfolio', 'https://hloth.dev/portfolio')}
			<div class="mt-auto w-full px-8">
				<PushNotificationsSwitch />
			</div>
			<div
				class="
					mt-4 flex flex-wrap items-center justify-between gap-2 px-8 text-sm
					leading-none text-[#a3a3a3]
					dark:text-[#4b5563]
				"
			>
				<span class="font-medium">Contact me:</span>
				<span class="font-normal">hi@hloth.dev</span>
			</div>
		</div>
	</div>
</div>
