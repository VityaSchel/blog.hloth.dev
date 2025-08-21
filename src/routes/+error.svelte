<script>
	import { page } from '$app/state';
	import AppBar from '$lib/components/AppBar.svelte';
	import PageMetadata from '$lib/components/PageMetadata.svelte';
</script>

<PageMetadata title="hloth blog" />
<AppBar homepage />
<div class="flex flex-1 items-center justify-center">
	<div class="relative flex items-center justify-center text-center">
		<span
			class="
				optical-sizing-force absolute h-[100px] bg-gradient-to-b from-golden/50
				to-inverted-alt/0 bg-clip-text font-serif text-[150px] leading-[90px]
				font-bold tracking-tight text-transparent tabular-nums select-none
				xs:h-[130px] xs:text-[180px] xs:leading-[120px]
				sm:h-[200px] sm:text-[300px] sm:leading-[180px]
			"
		>
			{page.status}
		</span>
		<h1
			class="
				text-404 relative z-[1] font-display text-2xl font-bold tracking-normal
				break-all text-black-alt
				xs:text-4xl
				sm:text-6xl
				dark:text-cream-alt
			"
		>
			{#if page.status === 404}
				Page Not Found
			{:else if page.status === 500}
				Internal Server Error
			{:else}
				{page.error?.message}
			{/if}
		</h1>
	</div>
</div>

<style>
	.text-404 {
		text-shadow:
			0 10px 10px rgba(150, 150, 150, 0.15),
			0 15px 15px rgba(150, 150, 150, 0.05),
			0 20px 25px rgba(150, 150, 150, 0.05);
	}
</style>
