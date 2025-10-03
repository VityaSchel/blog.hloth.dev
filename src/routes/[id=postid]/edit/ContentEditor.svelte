<script lang="ts">
	import { Editor, rootCtx, defaultValueCtx } from "@milkdown/kit/core";
	import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
	import { commonmark } from "@milkdown/preset-commonmark";
	import { replaceAll } from "@milkdown/kit/utils";
	import { nord } from "@milkdown/theme-nord";
	import type { Attachment } from "svelte/attachments";
	import { untrack } from "svelte";

	let {
		editor = $bindable(),
		content = $bindable(),
		disabled,
		statistics = $bindable(),
	}: {
		editor: Editor | null;
		content: string;
		disabled?: boolean;
		statistics: {
			wordsCount: number;
			mediaFiles: number;
			embedBlocks: number;
		} | null;
	} = $props();

	let editorContent = $state("");

	const milkdown: Attachment = (root) => {
		editor = null;
		const MakeEditor = Editor.make()
			.config((ctx) => {
				ctx.set(rootCtx, root);
				untrack(() => {
					if (content !== null) {
						ctx.set(defaultValueCtx, content);
					}
				});
				ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
					editorContent = markdown;
					content = markdown;
					statistics = {
						wordsCount: 0, // TODO: fix
						mediaFiles: 0, // TODO: fix
						embedBlocks: 0, // TODO: fix
					};
				});
			})
			.config(nord)
			.use(commonmark)
			.use(listener)
			.create();
		MakeEditor.then((instance) => (editor = instance));
		return () => {
			editor?.destroy();
			editor = null;
		};
	};

	$effect(() => {
		if (editor && content !== editorContent) {
			console.log("replacing content");
			editor.action(replaceAll(content));
		}
	});
</script>

<div class="flex w-full justify-center">
	<div
		class={[
			"article-content w-full font-text font-normal [&>div]:w-full",
			{ "pointer-events-none opacity-75": disabled },
		]}
	>
		<div {@attach milkdown}></div>
	</div>
</div>
