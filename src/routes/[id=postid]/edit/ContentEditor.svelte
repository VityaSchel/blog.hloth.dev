<script lang="ts">
	import BaseEditor from "./BaseEditor.svelte";

	let {
		content = $bindable(),
		statistics = $bindable(),
		disabled,
		onSave,
	}: {
		content: string;
		statistics: {
			wordsCount: number;
			mediaFiles: number;
			embedBlocks: number;
		} | null;
		disabled?: boolean;
		onSave: () => void;
	} = $props();
</script>

<BaseEditor
	bind:content={
		() => content,
		(newValue) => {
			statistics = {
				wordsCount: 0, // TODO: calculate word count
				mediaFiles: 0, // TODO: calculate media files count
				embedBlocks: 0, // TODO: calculate embed blocks count
			};
			content = newValue;
		}
	}
	{disabled}
	{onSave}
	options={{
		minimap: {
			enabled: false,
		},
		scrollbar: {
			vertical: "hidden",
			alwaysConsumeMouseWheel: false,
		},
		lineDecorationsWidth: 16,
	}}
/>
