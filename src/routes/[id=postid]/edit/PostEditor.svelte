<script lang="ts">
	import { toast } from "svelte-sonner";
	import { beforeNavigate, goto } from "$app/navigation";
	import { type CategoryValue } from "$lib/categories";
	import {
		clearDraft,
		saveDraft,
		type PostDraftSchema,
	} from "$lib/local-drafts";
	import ReadTime from "$lib/components/ReadTime.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	import Category from "$lib/components/Category.svelte";
	import BannerUploader from "./BannerUploader.svelte";
	import { Editor } from "@milkdown/kit/core";
	import { getMarkdown } from "@milkdown/kit/utils";
	import SlugEditor from "./SlugEditor.svelte";
	import ExcerptEditor from "./ExcerptEditor.svelte";
	import ContentEditor from "./ContentEditor.svelte";
	import TitleEditor from "./TitleEditor.svelte";
	import Me from "$lib/components/Me.svelte";
	import PostButtons from "./PostButtons.svelte";

	let {
		initial,
		existingPost,
		saveDraftsLocally = $bindable(),
	}: {
		initial: PostDraftSchema | null;
		existingPost: boolean;
		saveDraftsLocally: boolean;
	} = $props();

	let id: string = $derived(initial?.id ?? "");
	let idExists: null | boolean = $state(null);
	let title: string = $derived(initial?.title ?? "");
	let category: CategoryValue = $derived(initial?.category ?? "life_story");
	let readTime: number = $derived(initial?.readTime ?? 0);
	let banner: string | null = $derived(initial?.banner ?? null);
	let bannerAlt = $derived(initial?.bannerAlt ?? "");
	let forceShowBannerAlt = $state(false);
	let excerpt = $derived(initial?.excerpt ?? "");

	let statistics: {
		wordsCount: number;
		mediaFiles: number;
		embedBlocks: number;
	} | null = $state(null);

	let submitting = $state(false);

	const handleSave = async (
		visibility: "hidden" | "unlisted" | "published",
	) => {
		if (!banner || !editorInstance) return;
		if (!bannerAlt) {
			window.scrollTo({ top: 0, behavior: "smooth" });
			forceShowBannerAlt = true;
			return;
		}
		try {
			const request = await fetch("/api/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id,
					title,
					category,
					readTime,
					bannerId: banner,
					bannerAlt,
					content: editorInstance.action(getMarkdown()),
					excerpt,
					visibility,
				}),
			});
			if (request.ok) {
				saveDraftsLocally = false;
				clearDraft();
				if (visibility === "hidden") {
					goto("/drafts");
				} else {
					goto(`/${id}`);
				}
			} else {
				console.error(await request.text());
				toast.error("Error saving post");
			}
		} catch (error) {
			console.error(error);
			toast.error("Error during request to save post");
		} finally {
			submitting = false;
		}
	};

	$effect(() => {
		if (saveDraftsLocally) {
			const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
			window.addEventListener("beforeunload", onBeforeUnload);
			return () => window.removeEventListener("beforeunload", onBeforeUnload);
		}
	});

	const savePostDraft = async () => {
		if (!editorInstance) return;
		const draft = {
			id,
			title,
			content: editorInstance.action(getMarkdown()),
			excerpt,
			category,
			readTime,
			banner,
			bannerAlt,
		};
		try {
			saveDraft(draft);
		} catch (error) {
			console.log("Draft:", draft);
			console.error(error);
			toast.error("Error saving draft");
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
			if (id !== "") {
				fetch("/api/posts/" + id, {
					method: "HEAD",
				})
					.then((req) => {
						if (req.status === 200) idExists = true;
						else if (req.status === 404) idExists = false;
						else throw new Error("Unexpected response status: " + req.status);
					})
					.catch(() => {
						toast.error("Error checking ID conflict");
					});
			}
		}
	});

	let editorInstance: Editor | null = $state(null);

	const disabled = $derived(submitting);
</script>

<article class="pt-16">
	<div class="flex items-start justify-between">
		<div class="flex max-w-[50%] flex-[50%] flex-col gap-8 self-stretch">
			<div class="flex shrink-0 items-center gap-2">
				<Category bind:category />
				<ReadTime bind:value={readTime} editable class="mx-3" />
				{#snippet badge(text: string)}
					<span
						class="
							inline-block rounded-md bg-black px-2 font-serif text-sm text-white
							dark:bg-sandy dark:text-black
						"
					>
						{text}
					</span>
				{/snippet}
				{#if statistics !== null}
					{@const { wordsCount, mediaFiles, embedBlocks } = statistics}
					{@render badge(`${wordsCount} word${wordsCount !== 1 ? "s" : ""}`)}
					{@render badge(`${mediaFiles} pic${mediaFiles !== 1 ? "s" : ""}`)}
					{@render badge(`${embedBlocks} embed${embedBlocks !== 1 ? "s" : ""}`)}
					{@render badge(
						`avg. ${Math.round(wordsCount / 220 + mediaFiles * (15 / 60) + embedBlocks * (30 / 60))} min`,
					)}
				{/if}
			</div>
			<TitleEditor bind:value={title} {disabled} />
			<Me />
		</div>
		<BannerUploader
			bind:value={banner}
			bind:alt={bannerAlt}
			{disabled}
			forceShowAlt={forceShowBannerAlt}
		/>
	</div>
	<Separator />
	<ContentEditor
		bind:editor={editorInstance}
		initial={initial?.content ?? null}
		{disabled}
		bind:statistics
	/>
	<Separator />
	<div class="flex flex-col items-center gap-6">
		<SlugEditor
			bind:value={id}
			placeholder={title
				.toLowerCase()
				.replace(/[ _]/g, "-")
				.replace(/[^a-z0-9-]/g, "")}
			disabled={submitting || existingPost}
			exists={idExists}
		/>
		<ExcerptEditor bind:value={excerpt} {disabled} />
		<PostButtons
			disabled={!banner ||
				!title ||
				!excerpt ||
				!id ||
				submitting ||
				readTime === 0 ||
				(idExists !== false && !existingPost)}
			onclick={handleSave}
		/>
	</div>
</article>
