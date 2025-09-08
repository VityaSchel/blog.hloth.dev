<script lang="ts">
	let {
		variant = 'line',
		class: className
	}: {
		variant?: 'line' | 'asterisk';
		class?: import('svelte/elements').ClassValue;
	} = $props();
</script>

<hr
	class={[
		'w-full border-none',
		{
			'asterisk relative h-16': variant === 'asterisk',
			'my-[60px] h-[2px] bg-black dark:bg-sandy': variant === 'line'
		},
		className
	]}
/>

<style>
	.asterisk::before {
		display: block;
		position: absolute;
		content: '***';
		font-size: 30px;
		letter-spacing: 0.2em;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		height: 32px;
	}
</style>
