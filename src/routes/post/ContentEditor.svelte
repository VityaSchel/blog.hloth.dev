<script lang="ts">
	import { Editor, rootCtx, defaultValueCtx } from "@milkdown/kit/core";
	import { replaceAll } from "@milkdown/kit/utils";
	import { nord } from "@milkdown/theme-nord";
	import { commonmark } from "@milkdown/preset-commonmark";
	import type { Attachment } from "svelte/attachments";

	let {
		editor = $bindable(),
		initial,
		disabled,
		statistics = $bindable(),
	}: {
		editor: Editor | null;
		initial: string | null;
		disabled?: boolean;
		statistics: {
			wordsCount: number;
			mediaFiles: number;
			embedBlocks: number;
		} | null;
	} = $props();

	const milkdown: Attachment = (root) => {
		editor = null;
		const MakeEditor = Editor.make()
			.config((ctx) => {
				ctx.set(rootCtx, root);
				if (initial !== null) {
					ctx.set(defaultValueCtx, initial);
				}
			})
			.config(nord)
			.use(commonmark)
			.create();
		MakeEditor.then((editor) => {
			editor = editor;
			editor.onStatusChange(() => {
				// const data = editor.action(getMarkdown());
				statistics = {
					wordsCount: 0, // TODO: fix
					mediaFiles: 0, // TODO: fix
					embedBlocks: 0, // TODO: fix
				};
			});
		});
		return () => {
			editor?.destroy();
			editor = null;
		};
	};

	$effect(() => {
		if (editor && initial !== null) {
			editor.action(replaceAll(initial));
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
