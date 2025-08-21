<script lang="ts">
	import { categoriesNames, type CategoryValue } from '$lib/categories';

	let {
		category
	}: {
		category: CategoryValue;
	} = $props();
</script>

<span
	class="
		border-text w-fit rounded-md border px-3 py-1.5 font-mono text-xs
		tracking-wide uppercase
	"
>
	{categoriesNames[category]}
</span>
