<script lang="ts">
	let {
		value = $bindable(),
		disabled,
	}: {
		value: string;
		disabled?: boolean;
	} = $props();
</script>

<div class="flex w-[680px] max-w-full flex-col gap-2">
	<span class="font-semibold">Excerpt:</span>
	<textarea
		bind:value={
			() => value, (newValue) => (value = newValue.replace(/\n/g, ""))
		}
		placeholder="Sum up in 260 characters..."
		class="text-text w-full resize-none rounded-lg bg-white px-3 py-2 font-text
			text-base font-normal focus:outline-none disabled:opacity-50
			dark:bg-[#222128]"
		rows={5}
		{disabled}
	></textarea>
</div>
