<script
	lang="ts"
	generics="T extends string | undefined, Options = T extends string ? monaco.editor.IDiffEditorConstructionOptions : monaco.editor.IStandaloneEditorConstructionOptions"
>
	import "monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution";
	import "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css";
	import { untrack } from "svelte";
	import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
	import type { Attachment } from "svelte/attachments";
	import { getThemeContext } from "$lib/theme";
	import SolarizedLight from "monaco-themes/themes/Solarized-light.json";

	let {
		diff,
		content = $bindable(),
		disabled,
		onSave,
		options,
	}: {
		diff?: T;
		content: string;
		disabled?: boolean;
		onSave?: () => void;
		options: Options;
	} = $props();

	const ctx = getThemeContext();
	let editorContent = $state(content);
	let editor:
		| monaco.editor.IStandaloneCodeEditor
		| monaco.editor.IDiffEditor
		| undefined = $state();

	const createDiffModel = (diff: string) => {
		const original = monaco.editor.createModel(diff, "text/markdown");
		original.updateOptions({});
		const modified = monaco.editor.createModel(content, "text/markdown");
		return {
			original,
			modified,
		};
	};

	const monacoEditor: Attachment = (root) => {
		if (!(root instanceof HTMLElement)) {
			console.error("Root is not an HTMLElement", root);
			return;
		}
		const globalOptions: monaco.editor.IGlobalEditorOptions = {
			"semanticHighlighting.enabled": true,
			theme: ctx.theme === "dark" ? "vs-dark" : "solarized-light",
		};
		const commonOptions: monaco.editor.IDiffEditorConstructionOptions &
			monaco.editor.IStandaloneDiffEditorConstructionOptions = {
			scrollBeyondLastLine: false,
			wordWrap: "on",
			wrappingStrategy: "advanced",
			automaticLayout: true,
			overviewRulerLanes: 0,
			codeLens: false,
			lineNumbers: "off",
			glyphMargin: false,
			lightbulb: {
				enabled: monaco.editor.ShowLightbulbIconMode.Off,
			},
			folding: false,
			lineNumbersMinChars: 0,
			padding: {
				top: 16,
				bottom: 16,
			},
			fontSize: 16,
		};
		const isDiffEditor = untrack(() => !!diff);
		if (isDiffEditor) {
			const diffEditorConfig: monaco.editor.IDiffEditorConstructionOptions = {
				...globalOptions,
				...commonOptions,
				automaticLayout: true,
				...options,
			};
			console.log("Creating diff editor with diff", diffEditorConfig);
			const diffEditor = monaco.editor.createDiffEditor(root, diffEditorConfig);
			const diffModel = createDiffModel(untrack(() => diff!));
			diffEditor.setModel(diffModel);
			editor = diffEditor;
		} else {
			console.log("Creating code editor with content");
			const codeEditorConfig: monaco.editor.IStandaloneEditorConstructionOptions =
				{
					...globalOptions,
					...commonOptions,
					language: "markdown",
					value: untrack(() => content),
					...options,
				};
			const codeEditor = monaco.editor.create(root, codeEditorConfig);
			codeEditor.onDidChangeModelContent(() => {
				const value = codeEditor.getValue();
				editorContent = value;
				content = value;
			});
			const updateHeight = () => {
				console.log("Updating editor height");
				const contentHeight = Math.max(200, codeEditor.getContentHeight());
				root.style.height = `${contentHeight}px`;
				codeEditor.layout({ width: 680, height: contentHeight });
			};
			codeEditor.onDidContentSizeChange(updateHeight);
			updateHeight();
			codeEditor.addAction({
				id: "save-on-cmd-s",
				label: "Save to server",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
				contextMenuGroupId: "navigation",
				contextMenuOrder: 1.5,
				run: function () {
					onSave?.();
				},
			});
			editor = codeEditor;
		}
		return () => {
			if (!editor) {
				console.warn("Editor is already undefined on dispose");
				return;
			}
			console.log("Disposing editor");
			editor.dispose();
			editor = undefined;
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
		if (editor) {
			if ("onDidUpdateDiff" in editor) {
				if (diff) {
					editor.setModel(createDiffModel(diff));
				}
			} else {
				if (content !== untrack(() => editorContent)) {
					editor.setValue(content);
				}
			}
		}
	});
</script>

<div
	class={[
		"min-h-[200px] w-full font-text font-normal [&>div]:w-full",
		{ "pointer-events-none opacity-75": disabled },
	]}
>
	<div
		{@attach monacoEditor}
		class={[
			"overflow-clip rounded-md",
			{
				"h-full": !diff,
				"h-[600px]": diff,
			},
		]}
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
