<script lang="ts">
	let {
		editable = false,
		value = $bindable(),
		class: className
	}: {
		editable?: boolean;
		value: number;
		class?: import('svelte/elements').ClassValue;
	} = $props();
</script>

{#snippet content(child: boolean = false)}
	<span class={['text-alt font-mono text-sm uppercase', child && className]}>
		{value} min read
	</span>
{/snippet}

{#if editable}
	<button
		onmousedown={(e) => {
			const startY = e.clientY;
			const startX = e.clientY;
			const handleMouseMove = (e: MouseEvent) => {
				const diff = Math.max(e.clientY - startY, e.clientX - startX);
				value = Math.min(Math.abs(Math.round(diff / 15)), 90);
			};
			const handleEndEditing = () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleEndEditing);
			};
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleEndEditing);
		}}
		class={['cursor-pointer py-0.5', className]}
	>
		{@render content(true)}
	</button>
{:else}
	{@render content()}
{/if}
