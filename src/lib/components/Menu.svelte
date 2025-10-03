<script lang="ts">
	import CloseMenuButton from "$lib/components/CloseMenuButton.svelte";
	import PushNotificationsSwitch from "$lib/components/PushNotificationsSwitch.svelte";

	let menu: HTMLDialogElement;
</script>

<button
	class="inline-block w-[84px] cursor-pointer rounded-full bg-black py-[3px]
		text-center text-[14px] font-medium tracking-[-.03em] text-white
		dark:bg-white dark:text-black"
	onclick={() => menu.showModal()}
>
	Menu
</button>
<dialog
	class="fixed top-0 z-[100] ml-auto flex h-dvh max-h-none max-w-screen bg-black
		py-8 text-4xl font-bold text-white transition-[width] duration-500
		ease-in-out will-change-[width]"
	bind:this={menu}
	closedby="any"
>
	<div class="flex h-full w-full min-w-0 flex-col overflow-clip">
		<CloseMenuButton onclick={() => menu.close()} />
		<div class="flex w-96 flex-1 flex-col">
			{#snippet link(label: string, href: string)}
				<a
					{href}
					class="
							px-8 py-2 font-display
							tracking-tight
							transition-[letter-spacing,color]
							focus:outline-0
							focus-visible:bg-blue-400/20 hf:tracking-wide
							hf:text-neutral-300
						"
				>
					{label}
				</a>
			{/snippet}
			{@render link("About Me", "https://hloth.dev/me")}
			{@render link("My Portfolio", "https://hloth.dev/portfolio")}
			<div class="mt-auto w-full px-8">
				<PushNotificationsSwitch />
			</div>
			<div
				class="mt-4 flex flex-wrap items-center justify-between gap-2 px-8
					text-sm leading-none text-[#a3a3a3] dark:text-[#4b5563]"
			>
				<span class="font-medium">Contact me:</span>
				<span class="font-normal">hi@hloth.dev</span>
			</div>
		</div>
	</div>
</dialog>

<style lang="postcss">
	@reference "tailwindcss";

	dialog {
		width: 0;
		visibility: hidden;
		transition:
			width 500ms ease-in-out,
			visibility 500ms ease-in-out,
			display 500ms ease-in-out allow-discrete,
			overlay 500ms ease-in-out allow-discrete;

		background-color: #000000;
		background:
			radial-gradient(
				circle,
				transparent 20%,
				#000000 20%,
				#000000 80%,
				transparent 80%,
				transparent
			),
			radial-gradient(
					circle,
					transparent 20%,
					#000000 20%,
					#000000 80%,
					transparent 80%,
					transparent
				)
				10px 10px,
			linear-gradient(#2b2b2b 0.8px, transparent 0.8px) 0 -0.4px,
			linear-gradient(90deg, #2b2b2b 0.8px, #000000 0.8px) -0.4px 0;
		background-size:
			20px 20px,
			20px 20px,
			10px 10px,
			10px 10px;
	}

	dialog[open] {
		visibility: visible;
		width: calc(var(--spacing) * 96);
	}

	@starting-style {
		dialog[open] {
			width: 0;
		}
	}

	dialog::backdrop {
		height: 100%;
		backdrop-filter: blur(var(--blur));
		transition: --blur 500ms ease-in-out;
		--blur: 0px;
	}

	dialog[open]::backdrop {
		--blur: 20px;
	}

	@starting-style {
		dialog[open]::backdrop {
			--blur: 0px;
		}
	}

	dialog[open] :global(.arrow-line) {
		@apply w-0 transition-[width] duration-200 group-focus-visible:w-full pointer-fine:group-hover:w-full;
	}

	dialog:not([open]) :global(.arrow-line) {
		@apply w-full min-w-0;
	}
</style>
