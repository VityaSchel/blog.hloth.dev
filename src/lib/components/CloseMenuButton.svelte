<script lang="ts">
	import { shameCorner } from '$lib/shame-corner.svelte';

	let {
		closing = $bindable(),
		onClose
	}: {
		closing: boolean;
		onClose: () => void;
	} = $props();
</script>

<input tabindex={-1} aria-hidden="true" class="absolute h-0 w-0 opacity-0" />
<button
	aria-label="Close menu"
	class={[
		`
			group flex cursor-pointer items-center
			focus:outline-0
			focus-visible:bg-blue-400/20
		`,
		{
			'w-0 ease-in-out': closing,
			'duration-500': closing && !shameCorner.safari,
			'duration-2000': closing && shameCorner.safari,
			'w-full min-w-[50px]': !closing
		}
	]}
	style="padding-inline-start: 32px; padding-inline-end: 32px;"
	onclick={() => {
		if (closing) return;
		closing = true;
		onClose();
	}}
>
	<span
		class={[
			'h-[2px] bg-white',
			{
				'w-0 transition-[width] duration-200 group-hf:w-full': !closing,
				'w-full min-w-0': closing
			}
		]}
	></span>
	<svg
		width="50"
		height="50"
		viewBox="0 0 100 100"
		xmlns="http://www.w3.org/2000/svg"
		class="shrink-0"
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
