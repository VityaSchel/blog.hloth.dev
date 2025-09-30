<script lang="ts">
	import { trapFocus } from 'trap-focus-svelte';
	import CloseMenuButton from '$lib/components/CloseMenuButton.svelte';
	import PushNotificationsSwitch from '$lib/components/PushNotificationsSwitch.svelte';
	import { browser } from '$app/environment';

	let open = $state(false);
</script>

<div use:trapFocus={open} class="visible w-auto">
	<input
		type="checkbox"
		class="peer menu-peer absolute h-0 w-0 opacity-0"
		id="menu-toggle"
		aria-label="Toggle menu"
		bind:checked={open}
	/>
	<label
		class="
			menu-open-button inline-block w-[84px] cursor-pointer rounded-full bg-black
			pt-[3px] pb-[2px] text-center text-[14px] tracking-[-.03em] text-white
			dark:bg-white dark:text-black
		"
		for="menu-toggle"
	>
		Menu
	</label>
	<div
		class="
			transition-blur menu fixed top-0 left-0 z-10 h-full w-full duration-500
		"
		inert={browser && !open}
	>
		<!-- inert={!open} -->
		<label
			class="absolute top-0 left-0 h-full w-full"
			aria-label="Close menu"
			for="menu-toggle"
		></label>
		<div
			class="
				menu-bg absolute right-0 flex h-full max-w-full flex-col bg-black py-8
				font-display text-4xl font-bold text-white transition-[width] duration-500
				ease-in-out will-change-[width]
			"
		>
			<CloseMenuButton />
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
</div>

<style lang="postcss">
	@reference "tailwindcss";

	/* :global(body:has(.menu-peer:checked)) {
		visibility: hidden;
	} */

	.menu {
		--blur: 0px;
	}
	.menu-peer:not(:checked) ~ .menu {
		pointer-events: none;
		/* visibility: hidden; */

		.menu-bg {
			width: 0;
		}
	}
	.menu-peer:checked ~ .menu {
		--blur: 20px;

		.menu-bg {
			width: calc(var(--spacing) * 96);
		}
	}
	.menu-peer:checked ~ .menu :global(.arrow-line) {
		@apply w-0 transition-[width] duration-200 group-focus-visible:w-full pointer-fine:group-hover:w-full;
	}
	.menu-peer:not(:checked) ~ .menu :global(.arrow-line) {
		@apply w-full min-w-0;
	}
	.menu-peer:focus-visible ~ .menu :global(.menu-arrow) {
		@apply bg-blue-400/20;
	}
	.menu-peer:focus-visible ~ .menu-open-button {
		@apply outline-2 outline-offset-1 outline-blue-500;
	}
</style>
