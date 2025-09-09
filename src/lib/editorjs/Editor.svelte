<script lang="ts">
	import {
		type default as EditorJS,
		type OutputData
	} from '@editorjs/editorjs';
	import { editorjsTools as tools } from '$lib/editorjs/tools';
	import { onMount, untrack } from 'svelte';

	let {
		initial,
		disabled = false,
		onChange
	}: {
		initial: OutputData | null;
		disabled?: boolean;
		onChange?: () => unknown;
	} = $props();

	let ref: EditorJS | null = $state(null);

	onMount(() => {
		async function initializeEditor() {
			const EditorJS = await import('@editorjs/editorjs').then(
				(m) => m.default
			);
			const editor = new EditorJS({
				holder,
				tools,
				placeholder: 'Write...',
				minHeight: 300,
				data: initial || undefined,
				onChange,
				onReady: () => onChange?.()
			});
			ref = editor;
		}
		initializeEditor();
		return () => untrack(() => ref)?.destroy();
	});

	$effect(() => {
		const data = initial;
		untrack(() => {
			if (ref) {
				ref.render(data || { blocks: [] });
			}
		});
		return () => untrack(() => ref)?.destroy();
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
