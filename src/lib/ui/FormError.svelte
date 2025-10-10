<script lang="ts">
	import { fade } from "svelte/transition";

	let {
		children,
		...props
	}: {
		children?: import("svelte").Snippet;
	} & import("svelte/elements").SvelteHTMLElements["span"] = $props();
</script>

<span
	{...props}
	class={[
		"font-medium wrap-break-word whitespace-pre-wrap text-red-600",
		props.class,
	]}
	in:fade
>
	{@render children?.()}
</span>
