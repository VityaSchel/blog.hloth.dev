<script lang="ts">
	let {
		emoji,
		ref = $bindable(),
		...props
	}: {
		emoji: string;
		ref?: HTMLButtonElement;
	} & import("svelte/elements").SvelteHTMLElements["button"] = $props();
</script>

<button
	class="border-text rounded-full border bg-cream-alt px-6 py-2 text-xl
		shadow-md not-disabled:cursor-pointer disabled:opacity-50 dark:bg-black-alt"
	{...props}
	bind:this={ref}
>
	{emoji}
	&nbsp;&nbsp;
	{@render props.children?.()}
</button>
