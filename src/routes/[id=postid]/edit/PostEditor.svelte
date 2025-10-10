<script lang="ts">
	import { beforeNavigate, goto } from "$app/navigation";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import hotkeys from "hotkeys-js";
	import Category from "$lib/components/Category.svelte";
	import ReadTime from "$lib/components/ReadTime.svelte";
	import TitleEditor from "./TitleEditor.svelte";
	import Me from "$lib/components/Me.svelte";
	import BannerUploader from "./BannerUploader.svelte";
	import ContentEditor from "./ContentEditor.svelte";
	import DiffEditor from "./DiffEditor.svelte";
	import ExcerptEditor from "./ExcerptEditor.svelte";
	import Separator from "$lib/ui/Separator.svelte";
	import PostButton from "./PostButton.svelte";
	import FormError from "$lib/ui/FormError.svelte";
	import type { Draft } from "$lib/post";
	import ModeSwitch from "./ModeSwitch.svelte";
	import PostContent from "../post-content/PostContent.svelte";
	import PageMetadata from "$lib/components/PageMetadata.svelte";
	import HighlightRenderErrors from "./HighlightRenderErrors.svelte";

	let {
		draft,
		diff,
		error = $bindable(),
	}: {
		draft: Draft;
		diff: string;
		error: string | null;
	} = $props();

	const defaultTitle = $derived(draft.title ?? "");
	let title = $derived(defaultTitle);
	const defaultCategory = $derived(draft.category ?? null);
	let category = $derived(defaultCategory);
	const defaultReadTime = $derived(draft.readTime ?? 0);
	let readTime = $derived(defaultReadTime);
	const defaultBanner = $derived(draft.banner);
	let banner = $derived(defaultBanner);
	const defaultBannerAlt = $derived(draft.bannerAlt ?? "");
	let bannerAlt = $derived(defaultBannerAlt);
	const defaultExcerpt = $derived(draft.excerpt ?? "");
	let excerpt = $derived(defaultExcerpt);
	const defaultContent = $derived(draft.content ?? "");
	let content = $derived(defaultContent);

	let unsavedChanges = $derived(
		title !== defaultTitle ||
			category !== defaultCategory ||
			readTime !== defaultReadTime ||
			banner !== defaultBanner ||
			bannerAlt !== defaultBannerAlt ||
			excerpt !== defaultExcerpt ||
			content !== defaultContent,
	);

	let statistics: {
		wordsCount: number;
		mediaFiles: number;
		embedBlocks: number;
	} | null = $state(null);
	let submitting = $state(false);
	let editorMode = $state<"edit" | "preview">("edit");

	const disabled = $derived(submitting);

	$effect(() => {
		if (unsavedChanges) {
			const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
			window.addEventListener("beforeunload", onBeforeUnload);
			return () => window.removeEventListener("beforeunload", onBeforeUnload);
		}
	});

	beforeNavigate(({ cancel, type }) => {
		if (unsavedChanges) {
			cancel();
			if (type !== "leave") {
				toast.warning(
					"You have unsaved changes. Press ⌘+S to save or Discard.",
					{
						duration: 4000,
						action: {
							label: "Discard",
							onClick: () => {
								if (confirm("Discard changes?")) {
									unsavedChanges = false;
									goto(location.href);
								}
							},
						},
					},
				);
			}
		}
	});

	let saveButton: HTMLButtonElement | undefined = $state();
	$effect(() => {
		if (saveButton && !submitting) {
			const key = "command+s, ctrl+s";
			const onPress = (e: KeyboardEvent) => {
				e.preventDefault();
				saveButton?.click();
			};
			hotkeys(key, onPress);
			return () => {
				hotkeys.unbind(key, onPress);
			};
		}
	});
</script>

<PageMetadata
	title={title ? (unsavedChanges ? "💾 " : "") + title : "post @ hloth blog"}
/>
<article class="pt-16">
	<div class="flex items-start justify-between">
		<div class="flex max-w-[50%] flex-[50%] flex-col gap-8 self-stretch">
			<div class="flex shrink-0 flex-wrap items-center gap-2">
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
		<BannerUploader bind:value={banner} bind:alt={bannerAlt} {disabled} />
	</div>
	<Separator />
	<div class="flex w-full justify-center">
		<div class="w-full max-w-[680px]">
			<ModeSwitch bind:value={editorMode} />
			{#if editorMode === "edit"}
				<ContentEditor
					bind:content
					{disabled}
					bind:statistics
					onSave={() => saveButton?.click()}
				/>
			{:else if editorMode === "preview"}
				<HighlightRenderErrors>
					<PostContent {content} />
				</HighlightRenderErrors>
			{:else if editorMode === "diff"}
				<DiffEditor
					{content}
					{disabled}
					onSave={() => saveButton?.click()}
					{diff}
				/>
			{/if}
		</div>
	</div>
	<Separator />
	<div class="flex w-full justify-center">
		<form
			class="flex w-full max-w-[680px] flex-col items-center gap-6"
			method="POST"
			use:enhance={() => {
				submitting = true;
				return (e) => {
					if (e.result.type === "success") {
						unsavedChanges = false;
						toast.success("Post saved successfully!", {
							id: "post-saved",
						});
					}
					submitting = false;
					e.update({
						reset: false,
					});
				};
			}}
		>
			{#if title}
				<input type="hidden" name="title" value={title} />
			{/if}
			{#if category !== null}
				<input type="hidden" name="category" value={category} />
			{/if}
			{#if readTime !== 0}
				<input type="hidden" name="readTime" value={readTime} />
			{/if}
			{#if banner !== null}
				<input type="hidden" name="bannerId" value={banner} />
			{/if}
			{#if bannerAlt}
				<input type="hidden" name="bannerAlt" value={bannerAlt} />
			{/if}
			<input type="hidden" name="content" value={content} />
			{#if excerpt}
				<input type="hidden" name="excerpt" value={excerpt} />
			{/if}
			<ExcerptEditor bind:value={excerpt} {disabled} />
			{#if error}
				<FormError class="w-full">{error}</FormError>
			{/if}
			<div class="flex w-full justify-between">
				<PostButton
					emoji="📝"
					type="submit"
					formaction="?/save"
					bind:ref={saveButton}
					disabled={!unsavedChanges || submitting}
				>
					Save
				</PostButton>
				<PostButton
					emoji="🚀"
					disabled={unsavedChanges || !title || !excerpt || submitting}
					type="submit"
					formaction="?/post"
				>
					Post
				</PostButton>
			</div>
		</form>
	</div>
</article>
