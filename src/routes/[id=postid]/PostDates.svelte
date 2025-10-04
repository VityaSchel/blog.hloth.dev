<script lang="ts">
	let {
		createdAt,
		updatedAt,
	}: {
		createdAt: Date;
		updatedAt: Date | null;
	} = $props();
</script>

<div
	class="mt-16 flex w-full flex-col justify-between gap-2 md:mt-8 md:flex-row
		md:items-center"
>
	{#snippet dateRender(label: string, date: Date)}
		<div
			class="
						text-[#a3a3a3]
						dark:text-[#4b5563]
					"
		>
			<span class="font-display font-semibold">{label}</span>
			<time
				datetime={date.toISOString()}
				title={Intl.DateTimeFormat("en-US", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}).format(date)}
			>
				{Intl.DateTimeFormat("en-US", {
					day: "numeric",
					month: "long",
					...(date.getFullYear() !== new Date().getFullYear() && {
						year: "numeric",
					}),
				}).format(date)}
			</time>
		</div>
	{/snippet}

	{@render dateRender("Published at:", createdAt)}
	{#if updatedAt !== null}
		{@render dateRender("Updated at:", updatedAt)}
	{/if}
</div>
