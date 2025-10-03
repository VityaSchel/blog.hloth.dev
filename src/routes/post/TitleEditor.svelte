<script lang="ts">
	let {
		value = $bindable(),
		disabled,
	}: {
		value: string;
		disabled?: boolean;
	} = $props();
</script>

<textarea
	class={[
		` one-storey-a text-text leading-tighter line-clamp-3 h-full min-h-0 flex-1
	resize-none bg-transparent font-display text-6xl font-semibold tracking-tight
	focus:outline-none `,
	]}
	bind:value
	placeholder="Title"
	maxLength={64}
	{disabled}
></textarea>
