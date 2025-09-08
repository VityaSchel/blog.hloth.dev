<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { beforeNavigate, goto } from '$app/navigation';
	import {
		categoriesNames,
		categories,
		type CategoryValue
	} from '$lib/categories';
	import {
		clearDraft,
		saveDraft,
		type PostDraftSchema
	} from '$lib/local-drafts';
	import ReadTime from '$lib/components/ReadTime.svelte';
	import Separator from '$lib/ui/Separator.svelte';
	import Category from '$lib/components/Category.svelte';
	import BannerUploader from './BannerUploader.svelte';
	import Editor from '$lib/editorjs/Editor.svelte';
	import { getUrl } from '$lib/media';

	let {
		initial,
		saveDraftsLocally = $bindable(),
		existingPost
	}: {
		initial: PostDraftSchema | null;
		saveDraftsLocally: boolean;
		existingPost: boolean;
	} = $props();

	let id: string = $derived(initial?.id ?? '');
	let idExists: null | boolean = $state(null);
	let title: string = $derived(initial?.title ?? '');
	let category: CategoryValue = $derived(initial?.category ?? 'life_story');
	let readTime: number = $derived(initial?.readTime ?? 0);
	let banner: string | null = $derived(initial?.banner ?? null);
	let bannerAlt = $derived(initial?.bannerAlt ?? '');
	let forceShowBannerAlt = $state(false);
	let excerpt = $derived(initial?.excerpt ?? '');

	const content = $derived.by(() => {
		if (!initial) return null;
		return {
			time: initial.content.time,
			version: initial.content.version,
			blocks: initial.content.blocks.map((block) =>
				['image', 'video'].includes(block.type)
					? {
							...block,
							data: {
								...block.data,
								file: { ...block.data.file, url: getUrl(block.data.file.id) }
							}
						}
					: block
			)
		};
	});

	let submitting = $state(false);

	let editor: Editor;
	let categorySelector: HTMLSelectElement;

	const handleSave = async (
		visibility: 'hidden' | 'unlisted' | 'published'
	) => {
		if (!banner || !editor) return;
		if (!bannerAlt) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
			forceShowBannerAlt = true;
			return;
		}
		try {
			const request = await fetch('/api/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id,
					title,
					category,
					readTime,
					bannerId: banner,
					bannerAlt,
					content: await editor.getData(),
					excerpt,
					visibility
				})
			});
			if (request.ok) {
				saveDraftsLocally = false;
				clearDraft();
				goto(visibility === 'hidden' ? '/drafts' : '/' + id);
			} else {
				console.error(await request.text());
				toast.error('Error saving post');
			}
		} catch (error) {
			console.error(error);
			toast.error('Error during request to save post');
		} finally {
			submitting = false;
		}
	};

	$effect(() => {
		if (saveDraftsLocally) {
			const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
			window.addEventListener('beforeunload', onBeforeUnload);
			return () => window.removeEventListener('beforeunload', onBeforeUnload);
		}
	});

	const savePostDraft = async () => {
		const draft = {
			id,
			title,
			content: await editor.getData(),
			excerpt,
			category,
			readTime,
			banner,
			bannerAlt
		};
		try {
			saveDraft(draft);
		} catch (error) {
			console.log('Draft:', draft);
			console.error(error);
			toast.error('Error saving draft');
		}
	};

	$effect(() => {
		if (saveDraftsLocally) {
			const interval = setInterval(savePostDraft, 5000);
			return () => clearInterval(interval);
		}
	});

	beforeNavigate(() => {
		if (saveDraftsLocally) {
			savePostDraft();
		}
	});

	$effect(() => {
		if (!existingPost) {
			idExists = null;
			if (id !== '') {
				fetch('/api/posts/' + id, {
					method: 'HEAD'
				})
					.then((req) => {
						if (req.status === 200) idExists = true;
						else if (req.status === 404) idExists = false;
						else throw new Error('Unexpected response status: ' + req.status);
					})
					.catch(() => {
						toast.error('Error checking ID conflict');
					});
			}
		}
	});
</script>

<article class="pt-16">
	<div class="flex items-start justify-between">
		<div class="flex max-w-[50%] flex-[50%] flex-col gap-8 self-stretch">
			<div class="flex shrink-0 items-center gap-5">
				<button
					onclick={() => categorySelector.showPicker()}
					disabled={submitting}
					class="cursor-pointer"
				>
					<select
						bind:this={categorySelector}
						class="pointer-events-none absolute w-32 opacity-0"
						value={category}
						onchange={(e) =>
							(category = e.currentTarget.value as CategoryValue)}
						tabIndex={-1}
					>
						{#each categories as category (category)}
							<option value={category}>
								{categoriesNames[category]}
							</option>
						{/each}
					</select>
					<Category {category} />
				</button>
				<ReadTime bind:value={readTime} editable />
			</div>
			<textarea
				class={[
					`
						text-text line-clamp-3 h-full min-h-0 flex-1 resize-none bg-transparent
						font-display text-6xl leading-tight font-medium
						focus:outline-none
					`
				]}
				bind:value={title}
				placeholder="Title"
				maxLength={64}
				disabled={submitting}
			></textarea>
			<div class="mt-auto flex shrink-0 items-center gap-4">
				<img
					src="/me.webp"
					alt="Viktor Shchelochkov"
					width={50}
					height={50}
					class="border-text rounded-full border"
				/>
				<div class="flex flex-col">
					<span class="font-display font-medium">Viktor Shchelochkov</span>
					<span class="text-alt font-mono text-sm uppercase">
						Fullstack developer
					</span>
				</div>
			</div>
		</div>
		<BannerUploader
			bind:value={banner}
			bind:alt={bannerAlt}
			disabled={submitting}
			forceShowAlt={forceShowBannerAlt}
		/>
	</div>
	<Separator />
	<Editor initial={content} bind:this={editor} disabled={submitting} />
	<Separator />
	<div class="flex flex-col items-center gap-6">
		<div class="relative flex w-[680px] max-w-full flex-col gap-2">
			<span class="font-semibold">Slug:</span>
			<input
				bind:value={
					() => id,
					(newValue) =>
						(id = newValue
							.toLowerCase()
							.replaceAll(/[ _]/g, '-')
							.replaceAll(/[^a-z0-9-]/g, ''))
				}
				placeholder={title
					.toLowerCase()
					.replaceAll(/[ _]/g, '-')
					.replaceAll(/[^a-z0-9-]/g, '')}
				class="
					text-text w-full rounded-lg bg-white px-3 py-2 font-text text-base
					font-normal
					focus:outline-none
					disabled:opacity-50
					dark:bg-[#222128]
				"
				disabled={submitting || existingPost}
			/>
			{#if idExists !== null}
				<span class="absolute right-3 bottom-3">
					{#if idExists}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
						>
							<path
								fill="red"
								d="m12 13.4l2.9 2.9q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.9-2.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.1 7.7q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.9 2.9l-2.9 2.9q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0 8.6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
							></path>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
						>
							<path
								fill="currentColor"
								d="m10.6 16.6l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
							></path>
						</svg>
					{/if}
				</span>
			{/if}
		</div>
		<div class="flex w-[680px] max-w-full flex-col gap-2">
			<span class="font-semibold">Excerpt:</span>
			<textarea
				bind:value={
					() => excerpt, (newValue) => (excerpt = newValue.replaceAll('\n', ''))
				}
				placeholder="Sum up in 260 characters..."
				class="
					text-text w-full resize-none rounded-lg bg-white px-3 py-2 font-text
					text-base font-normal
					focus:outline-none
					disabled:opacity-50
					dark:bg-[#222128]
				"
				rows={5}
				disabled={submitting}
			></textarea>
		</div>
		<div class="flex w-[680px] max-w-full justify-between">
			{#snippet button(
				arg: 'hidden' | 'unlisted' | 'published',
				emoji: string,
				text: string
			)}
				<button
					class="
						border-text cursor-pointer rounded-full border bg-cream-alt px-6 py-2
						text-xl shadow-md
						disabled:opacity-50
						dark:bg-black-alt
					"
					onclick={() => handleSave(arg)}
					disabled={!banner ||
						!title ||
						!excerpt ||
						!id ||
						submitting ||
						readTime === 0 ||
						(idExists !== false && !existingPost)}
				>
					{emoji}
					&nbsp;&nbsp;
					{text}
				</button>
			{/snippet}
			<div class="flex items-center gap-5">
				{@render button('hidden', '📝', 'Draft')}
				{@render button('unlisted', '👀', 'Unlist')}
			</div>
			{@render button('published', '🚀', 'Post')}
		</div>
	</div>
</article>
