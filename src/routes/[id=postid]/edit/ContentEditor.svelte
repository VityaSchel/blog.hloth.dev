<script lang="ts">
	import { untrack } from "svelte";
	import { Editor, rootCtx, defaultValueCtx } from "@milkdown/kit/core";
	import { commonmark } from "@milkdown/preset-commonmark";
	import { replaceAll } from "@milkdown/kit/utils";
	import { nord } from "@milkdown/theme-nord";
	import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
	import { history } from "@milkdown/kit/plugin/history";
	import { clipboard } from "@milkdown/kit/plugin/clipboard";
	// import { SlashProvider, slashFactory } from "@milkdown/kit/plugin/slash";
	// import {
	// 	tooltipFactory,
	// 	TooltipProvider,
	// } from "@milkdown/kit/plugin/tooltip";
	// import { BlockProvider } from "@milkdown/kit/plugin/block";
	// import { block } from "@milkdown/plugin-block";
	// import type { Ctx } from "@milkdown/kit/ctx";
	import type { Attachment } from "svelte/attachments";
	// import type { EditorView } from "@milkdown/kit/prose/view";
	// import type { EditorState } from "@milkdown/kit/prose/state";

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

	// function slashPluginView(view: EditorView) {
	// 	const content = document.createElement("div");

	// 	const provider = new SlashProvider({
	// 		content,
	// 	});

	// 	return {
	// 		update: (updatedView: EditorView, prevState: EditorState) => {
	// 			provider.update(updatedView, prevState);
	// 		},
	// 		destroy: () => {
	// 			provider.destroy();
	// 			content.remove();
	// 		},
	// 	};
	// }

	// function tooltipPluginView(view: EditorView) {
	// 	const content = document.createElement("div");

	// 	const provider = new TooltipProvider({
	// 		content,
	// 	});

	// 	return {
	// 		update: (updatedView: EditorView, prevState: EditorState) => {
	// 			provider.update(updatedView, prevState);
	// 		},
	// 		destroy: () => {
	// 			provider.destroy();
	// 			content.remove();
	// 		},
	// 	};
	// }

	// function createBlockPluginView(ctx: Ctx) {
	// 	return (view: EditorView) => {
	// 		const content = document.createElement("div");

	// 		const provider = new BlockProvider({
	// 			ctx,
	// 			content,
	// 		});

	// 		return {
	// 			update: (updatedView: EditorView, prevState: EditorState) => {
	// 				// provider.update(updatedView, prevState);
	// 				provider.update();
	// 			},
	// 			destroy: () => {
	// 				provider.destroy();
	// 				content.remove();
	// 			},
	// 		};
	// 	};
	// }

	const milkdown: Attachment = (root) => {
		// const slash = slashFactory("slash-commands");
		// const tooltip = tooltipFactory("tooltip");

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
				// ctx.set(slash.key, { view: slashPluginView });
				// ctx.set(tooltip.key, { view: tooltipPluginView });
				// ctx.set(block.key, { view: createBlockPluginView(ctx) });
			})
			.config(nord)
			.use(commonmark)
			.use(listener)
			.use(history)
			.use(clipboard)
			// .use(slash)
			// .use(tooltip)
			// .use(block)
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
			"article-content w-[680px] font-text font-normal [&>div]:w-full",
			{ "pointer-events-none opacity-75": disabled },
		]}
	>
		<div {@attach milkdown}></div>
	</div>
</div>
