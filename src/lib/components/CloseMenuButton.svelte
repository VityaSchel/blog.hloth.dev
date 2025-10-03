<script lang="ts">
	let {
		onclick,
	}: {
		onclick: import("svelte/elements").SvelteHTMLElements["button"]["onclick"];
	} = $props();
</script>

<button
	aria-label="Close menu"
	class="group menu-arrow flex w-full min-w-[50px] cursor-pointer items-center
		transition-none duration-500 focus:outline-0 focus-visible:bg-blue-400/20"
	style="padding-inline-start: 32px; padding-inline-end: 32px;"
	{onclick}
>
	<span class="arrow-line h-[2px] bg-white" aria-hidden="true"></span>
	<svg
		width="50"
		height="50"
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
		class="shrink-0"
		aria-hidden="true"
	>
		<line
			x1="0"
			y1="50"
			x2="90"
			y2="50"
			stroke="currentColor"
			stroke-width="4"
		/>
		<line
			x1="70"
			y1="30"
			x2="90"
			y2="51"
			stroke="currentColor"
			stroke-width="4"
		/>
		<line
			x1="70"
			y1="70"
			x2="90"
			y2="49"
			stroke="currentColor"
			stroke-width="4"
		/>
	</svg>
</button>
