<script lang="ts">
	import z from "zod";
	import { ReactionButton } from "pow-reaction";
	import { API_URL } from "astro:env/client";
	import {
		reactions,
		reactionSchema,
		type Reaction,
	} from "blog.hloth.dev-shared";
	import { fade, slide } from "svelte/transition";
	import { toast } from "svelte-sonner";

	let {
		postId,
	}: {
		postId: string;
	} = $props();

	let query = $derived.by(async () => {
		const req = await fetch(new URL(`posts/${postId}/reactions`, API_URL));
		if (!req.ok) {
			throw new Error("Failed to fetch reactions");
		}
		const reactions = z
			.record(reactionSchema, z.number().int().min(0))
			.parse(await req.json());
		return reactions;
	});
</script>

{#await query then value}
	<div
		class="mt-16 flex w-full flex-wrap items-center gap-x-[2.75px] gap-y-2
			md:mt-8"
		in:slide={{ duration: 300 }}
	>
		{#snippet Reaction(emoji: Reaction, i: number)}
			<div in:fade|global={{ duration: 200, delay: i * 10 }}>
				<ReactionButton
					reaction={emoji}
					value={value[emoji] ?? 0}
					onclick={async () => {
						console.log("Reacting with", emoji);
						toast.success("Thanks for your reaction!");
						const req = await fetch(
							new URL(`posts/${postId}/reactions/challenge`, API_URL),
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ reaction: emoji }),
							},
						);
						if (!req.ok) {
							// TODO: use sonner
							alert("An error occurred, please try again later.");
							console.error(await req.text());
							throw new Error("Failed to get challenge");
						}
						return z.object({ challenge: z.string() }).parse(await req.json());
					}}
					onreact={async ({ challenge, solutions }) => {
						const req = await fetch(
							new URL(`posts/${postId}/reactions`, API_URL),
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ challenge, solutions, reaction: emoji }),
							},
						);
						if (!req.ok) {
							alert("An error occurred, please try again later.");
							console.error(await req.text());
							throw new Error("Failed to submit reaction");
						}
						const { reactions } = z
							.object({
								ok: z.literal(true),
								reactions: z.record(reactionSchema, z.number().int().min(0)),
							})
							.parse(await req.json());
						query = Promise.resolve(reactions);
					}}
				/>
			</div>
		{/snippet}
		{#each reactions as emoji, i (emoji)}
			{@render Reaction(emoji, i)}
		{/each}
	</div>
{/await}

<style>
	div {
		--reaction-button-text-color: light-dark(
			rgba(0, 0, 0, 0.6),
			rgba(212, 212, 212, 0.6)
		);
		--reaction-button-highlight-color: light-dark(
			rgba(0, 0, 0, 0.1),
			rgba(161, 161, 161, 0.3)
		);
	}
</style>
