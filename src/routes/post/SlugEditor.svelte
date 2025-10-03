<script lang="ts">
	let {
		value = $bindable(),
		placeholder,
		disabled,
		exists,
	}: {
		value: string;
		placeholder: string;
		disabled: boolean;
		exists: boolean | null;
	} = $props();
</script>

<div class="relative flex w-[680px] max-w-full flex-col gap-2">
	<span class="font-semibold">Slug:</span>
	<input
		bind:value={
			() => value,
			(newValue) =>
				(value = newValue
					.toLowerCase()
					.replace(/[ _]/g, "-")
					.replace(/[^a-z0-9-]/g, ""))
		}
		{placeholder}
		class="text-text w-full rounded-lg bg-white px-3 py-2 font-text text-base
			font-normal focus:outline-none disabled:opacity-50 dark:bg-[#222128]"
		{disabled}
	/>
	{#if exists !== null}
		<span class="absolute right-3 bottom-3">
			{#if exists}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 24 24"
				>
					<path
						fill="red"
						d="m12 13.4l2.9 2.9q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.9-2.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.1 7.7q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.9 2.9l-2.9 2.9q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0 8.6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
					></path>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1em"
					height="1em"
					viewBox="0 0 24 24"
				>
					<path
						fill="currentColor"
						d="m10.6 16.6l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
					></path>
				</svg>
			{/if}
		</span>
	{/if}
</div>
