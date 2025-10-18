<script lang="ts">
	import { API_URL } from "astro:env/client";
	import { expoOut } from "svelte/easing";
	import { blur, scale } from "svelte/transition";
	import z from "zod";

	let {
		postId,
	}: {
		postId: string;
	} = $props();
	let query = $derived.by(async () => {
		const req = await fetch(new URL(`posts/${postId}/views`, API_URL));
		if (!req.ok) {
			throw new Error("Failed to fetch views");
		}
		const views = z
			.number()
			.int()
			.min(0)
			.parse(await req.json());
		return views;
	});

	$effect(() => {
		const timeout = setTimeout(() => {
			fetch(new URL(`posts/${postId}/views`, API_URL), {
				method: "POST",
			})
				.then((req) => req.json())
				.then((res) => {
					const views = z
						.object({
							ok: z.literal(true),
							value: z.number().int().min(0),
						})
						.parse(res);
					query = Promise.resolve(views.value);
				});
		}, 30 * 1000);
		return () => clearTimeout(timeout);
	});
</script>

{#await query then value}
	<div
		class="
		font-display font-normal text-[#a3a3a3] tabular-nums
		dark:text-[#4b5563]
	"
		in:scale|global={{ duration: 300, easing: expoOut, start: 0.5 }}
	>
		<span
			class="flex items-center gap-1"
			in:blur|global={{ duration: 300, easing: expoOut }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="1em"
				height="1em"
				viewBox="0 0 24 24"
			>
				<path
					fill="currentColor"
					d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
				></path>
			</svg>
			{value}
		</span>
	</div>
{/await}
