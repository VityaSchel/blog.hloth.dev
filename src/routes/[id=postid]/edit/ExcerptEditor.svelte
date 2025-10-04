<script lang="ts">
	let {
		value = $bindable(),
		disabled,
	}: {
		value: string;
		disabled?: boolean;
	} = $props();
</script>

<div class="relative flex w-full flex-col gap-2">
	<span class="font-semibold">Excerpt:</span>
	<textarea
		bind:value={
			() => value, (newValue) => (value = newValue.replace(/\n/g, ""))
		}
		placeholder="Sum up in 260 characters..."
		class="text-text w-full resize-none rounded-lg bg-white px-3 py-2 pb-6
			font-text text-base font-normal focus:outline-none disabled:opacity-50
			dark:bg-[#222128]"
		rows={5}
		{disabled}
	></textarea>
	<span
		class="absolute right-1 bottom-1 rounded-sm bg-gray-200 px-2 py-0.5 text-xs
			font-medium text-black tabular-nums dark:bg-gray-800 dark:text-white"
	>
		{value.length}/260
	</span>
</div>
