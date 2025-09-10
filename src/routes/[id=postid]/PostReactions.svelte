<script lang="ts">
	import z from 'zod';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { ReactionButton } from 'pow-reaction';
	import {
		reactions,
		reactionSchema,
		type Reaction
	} from '../../lib/reactions';
	import { getThemeContext } from '$lib/theme';

	const context = getThemeContext();

	let {
		value = $bindable()
	}: {
		value: Record<Reaction, number>;
	} = $props();
</script>

<div
	class="
		mt-16 flex w-full max-w-[560px] flex-wrap items-center gap-x-[2.75px] gap-y-2
		md:mt-8
	"
>
	{#snippet Reaction(emoji: Reaction)}
		<ReactionButton
			--reaction-button-text-color={context.theme === 'dark'
				? 'rgba(212, 212, 212, 0.6)'
				: 'rgba(0, 0, 0, 0.6)'}
			--reaction-button-highlight-color={context.theme === 'dark'
				? 'rgba(161, 161, 161, 0.3)'
				: 'rgba(0, 0, 0, 0.1)'}
			reaction={emoji}
			value={value[emoji] ?? 0}
			onclick={async () => {
				const req = await fetch(`/${page.params.id}/reactions/challenge`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ reaction: emoji })
				});
				if (!req.ok) {
					toast.error('An error occured, please try again later.');
					console.error(await req.text());
					throw new Error('Failed to get challenge');
				}
				return z.object({ challenge: z.string() }).parse(await req.json());
			}}
			onreact={async ({ challenge, solutions }) => {
				const req = await fetch(`/${page.params.id}/reactions`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ challenge, solutions, reaction: emoji })
				});
				if (!req.ok) {
					toast.error('An error occured, please try again later.');
					console.error(await req.text());
					throw new Error('Failed to submit reaction');
				}
				const { reactions } = z
					.object({
						success: z.literal(true),
						reactions: z.record(reactionSchema, z.number().int().min(0))
					})
					.parse(await req.json());
				value = reactions;
			}}
		/>
	{/snippet}
	{#each reactions as emoji (emoji)}
		{@render Reaction(emoji)}
	{/each}
</div>
