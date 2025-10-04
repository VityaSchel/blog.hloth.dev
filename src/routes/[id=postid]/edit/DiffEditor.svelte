<script lang="ts">
	import BaseEditor from "./BaseEditor.svelte";

	let {
		content,
		disabled,
		onSave,
		diff,
	}: {
		content: string;
		disabled?: boolean;
		onSave: () => void;
		diff: string;
	} = $props();
</script>

<BaseEditor
	{content}
	{disabled}
	{onSave}
	{diff}
	options={{
		readOnly: true,
		originalEditable: false,
		automaticLayout: true,
		enableSplitViewResizing: false,
		renderSideBySide: false,
		lineDecorationsWidth: 16,
	}}
/>
