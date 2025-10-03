<script lang="ts">
	let {
		class: className,
		...props
	}: import("svelte/elements").SvelteHTMLElements["button"] = $props();
</script>

<button
	class={[
		`cursor-pointer border border-l-0 border-black bg-sandy px-3 py-1
	font-display font-semibold tracking-tight text-black disabled:opacity-50`,
		className,
	]}
	{...props}
>
	<span class="block translate-y-[1px]"> {@render props.children?.()} </span>
</button>
