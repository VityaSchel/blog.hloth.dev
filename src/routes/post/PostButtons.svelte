<script lang="ts">
	let {
		disabled,
		onclick,
	}: {
		disabled?: boolean;
		onclick: (visibility: "hidden" | "unlisted" | "published") => void;
	} = $props();
</script>

<div class="flex w-[680px] max-w-full justify-between">
	{#snippet button(
		arg: "hidden" | "unlisted" | "published",
		emoji: string,
		text: string,
	)}
		<button
			class="
				border-text cursor-pointer rounded-full border bg-cream-alt px-6 py-2
				text-xl shadow-md
				disabled:opacity-50
				dark:bg-black-alt
			"
			onclick={() => onclick(arg)}
			{disabled}
		>
			{emoji}
			&nbsp;&nbsp;
			{text}
		</button>
	{/snippet}
	<div class="flex items-center gap-5">
		{@render button("hidden", "📝", "Draft")}
		{@render button("unlisted", "👀", "Unlist")}
	</div>
	{@render button("published", "🚀", "Post")}
</div>
