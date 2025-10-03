<script lang="ts">
	import {
		categories,
		categoriesNames,
		type CategoryValue,
	} from "$lib/categories";

	let {
		category = $bindable(),
		readonly,
		disabled = false,
	}: {
		category: CategoryValue;
		readonly?: boolean;
		disabled?: boolean;
	} = $props();

	let categorySelector: HTMLSelectElement | undefined = $state();
</script>

{#snippet content()}
	<span
		class="
			border-text w-fit rounded-md border px-3 py-1.5 font-mono text-xs
			tracking-wide uppercase
		"
	>
		{categoriesNames[category]}
	</span>
{/snippet}
{#if readonly}
	{@render content()}
{:else}
	<button
		onclick={() => categorySelector?.showPicker()}
		{disabled}
		class="cursor-pointer"
	>
		<select
			bind:this={categorySelector}
			class="pointer-events-none absolute w-32 opacity-0"
			value={category}
			onchange={(e) => (category = e.currentTarget.value as CategoryValue)}
			tabIndex={-1}
		>
			{#each categories as category (category)}
				<option value={category}>
					{categoriesNames[category]}
				</option>
			{/each}
		</select>
		{@render content()}
	</button>
{/if}
