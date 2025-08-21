<script lang="ts">
	import EditorJS, { type OutputData } from '@editorjs/editorjs';
	import { editorjsTools as tools } from '$lib/editorjs/tools';

	let {
		initial,
		disabled = false
	}: { initial: OutputData | null; disabled?: boolean } = $props();

	let ref: EditorJS | null = $state(null);

	$effect(() => {
		const editor = new EditorJS({
			holder,
			tools,
			placeholder: 'Write...',
			minHeight: 300,
			data: initial || undefined
		});
		ref = editor;
		return () => editor.destroy();
	});

	export function getData() {
		if (!ref) {
			throw new Error('EditorJS instance is not initialized');
		}
		return ref.save();
	}

	let holder: HTMLDivElement;
</script>

<div class="flex w-full justify-center">
	<div
		class={[
			`
				article-content w-full font-text font-normal
				[&>div]:w-full
			`,
			{
				'pointer-events-none opacity-75': disabled
			}
		]}
	>
		<div bind:this={holder}></div>
	</div>
</div>
