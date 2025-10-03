<script lang="ts">
	import "@milkdown/crepe/theme/common/style.css";
	import "@milkdown/crepe/theme/nord.css";
	import { untrack } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import { Crepe } from "@milkdown/crepe";
	import type { Editor } from "@milkdown/kit/core";
	import { replaceAll } from "@milkdown/kit/utils";

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
		const crepe = new Crepe({
			defaultValue: untrack(() => content || ""),
			root,
			features: {
				[Crepe.Feature.Latex]: false,
			},
			featureConfigs: {
				[Crepe.Feature.LinkTooltip]: {
					inputPlaceholder: "Enter URL...",
				},
			},
		});
		crepe.on((on) => {
			on.markdownUpdated((_, markdown) => {
				editorContent = markdown;
				content = markdown;
				statistics = {
					wordsCount: 0, // TODO: fix
					mediaFiles: 0, // TODO: fix
					embedBlocks: 0, // TODO: fix
				};
			});
		});
		crepe.create().then((instance) => (editor = instance));
		return () => {
			crepe?.destroy();
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
			"w-[680px] font-text font-normal [&>div]:w-full",
			{ "pointer-events-none opacity-75": disabled },
		]}
	>
		<div {@attach milkdown}></div>
	</div>
</div>
