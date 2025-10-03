<script lang="ts">
	import { formatTitle } from "$lib/formatter";

	let {
		title,
	}: {
		title: string;
	} = $props();

	const formattedTitle = $derived(formatTitle(title));
</script>

<h1
	class="one-storey-a leading-tighter line-clamp-3 font-display text-3xl
		font-semibold tracking-tight md:text-6xl"
	{title}
>
	<span class="optical-sizing-none font-serif font-normal italic">
		{formattedTitle.emphasized}
	</span>
	{formattedTitle.regular}
</h1>
