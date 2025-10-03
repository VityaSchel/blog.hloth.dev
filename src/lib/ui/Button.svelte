<script lang="ts">
	let {
		class: className,
		...props
	}: import("svelte/elements").SvelteHTMLElements["button"] = $props();
</script>

<button
	class={[
		`cursor-pointer border border-l-0 border-black bg-sandy px-3 py-1
	font-medium tracking-normal text-black disabled:opacity-50`,
		className,
	]}
	{...props}
>
	{@render props.children?.()}
</button>
