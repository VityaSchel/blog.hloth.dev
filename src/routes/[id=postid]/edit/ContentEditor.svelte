<script lang="ts">
	import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution";
	import { untrack } from "svelte";
	import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
	import type { Attachment } from "svelte/attachments";
	import { getThemeContext } from "$lib/theme";
	import SolarizedLight from "monaco-themes/themes/Solarized-light.json";

	let {
		content = $bindable(),
		disabled,
		statistics = $bindable(),
		onSave,
	}: {
		content: string;
		disabled?: boolean;
		statistics: {
			wordsCount: number;
			mediaFiles: number;
			embedBlocks: number;
		} | null;
		onSave?: () => void;
	} = $props();

	const ctx = getThemeContext();
	let editorContent = $state(content);
	let editorInstance: monaco.editor.IStandaloneCodeEditor | undefined =
		$state();

	const monacoEditor: Attachment = (root) => {
		if (!(root instanceof HTMLElement)) return;
		const editor = monaco.editor.create(root, {
			value: untrack(() => content),
			language: "markdown",
			minimap: {
				enabled: false,
			},
			"semanticHighlighting.enabled": true,
			theme: ctx.theme === "dark" ? "vs-dark" : "solarized-light",
			// automaticLayout: true,
			scrollBeyondLastLine: false,
			wordWrap: "on",
			wrappingStrategy: "advanced",
			overviewRulerLanes: 0,
			scrollbar: {
				vertical: "hidden",
				alwaysConsumeMouseWheel: false,
			},
			codeLens: false,
			lineNumbers: "off",
			glyphMargin: false,
			folding: false,
			lineDecorationsWidth: 16,
			lineNumbersMinChars: 0,
			padding: {
				top: 16,
				bottom: 16,
			},
			fontSize: 16,
		});
		const updateHeight = () => {
			const contentHeight = Math.max(200, editor.getContentHeight());
			root.style.height = `${contentHeight}px`;
			editor.layout({ width: 680, height: contentHeight });
		};
		editor.onDidContentSizeChange(updateHeight);
		updateHeight();
		editor.onDidChangeModelContent(() => {
			const value = editor.getValue();
			editorContent = value;
			content = value;
		});
		editor.addAction({
			id: "save-on-cmd-s",
			label: "Save to server",
			keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
			contextMenuGroupId: "navigation",
			contextMenuOrder: 1.5,
			run: function () {
				onSave?.();
			},
		});
		editorInstance = editor;
		return () => {
			editor.dispose();
			editorInstance = undefined;
		};
	};

	$effect(() => {
		monaco.editor.defineTheme(
			"solarized-light",
			SolarizedLight as monaco.editor.IStandaloneThemeData,
		);
		monaco.editor.setTheme(
			ctx.theme === "dark" ? "vs-dark" : "solarized-light",
		);
	});

	$effect(() => {
		if (editorInstance && content !== untrack(() => editorContent)) {
			editorInstance.setValue(content);
		}
	});
</script>

<div
	class={[
		"w-full font-text font-normal [&>div]:w-full",
		{ "pointer-events-none opacity-75": disabled },
	]}
>
	<div
		{@attach monacoEditor}
		class="min-h-[200px] overflow-clip rounded-md"
	></div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	:global(.carta-font-code) {
		font-family: var(--font-mono);
		font-size: 1.1rem;
		line-height: 1.1rem;
		letter-spacing: normal;
	}
</style>
