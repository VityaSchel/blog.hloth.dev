<script lang="ts">
	let {
		size,
		class: className
	}: {
		size: 'sm' | 'lg';
		class?: import('svelte/elements').ClassValue;
	} = $props();
</script>

<hr
	class={[
		`
			w-full border-none bg-black
			dark:bg-sandy
		`,
		{
			'my-[32px] h-[1px]': size === 'sm',
			'my-[60px] h-[2px]': size === 'lg'
		},
		className
	]}
/>
