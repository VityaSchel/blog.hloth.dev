<script lang="ts">
	import "carta-md/default.css";
	import "./carta-theme.css";
	import { Carta, MarkdownEditor } from "carta-md";
	import DOMPurify from "isomorphic-dompurify";

	let {
		content = $bindable(),
		disabled,
		statistics = $bindable(),
	}: {
		content: string;
		disabled?: boolean;
		statistics: {
			wordsCount: number;
			mediaFiles: number;
			embedBlocks: number;
		} | null;
	} = $props();

	const carta = new Carta({
		sanitizer: DOMPurify.sanitize,
		theme: {
			light: "solarized-light",
			dark: "dracula",
		},
	});
</script>

<div class="flex w-full justify-center">
	<div
		class={[
			"w-[680px] font-text font-normal [&>div]:w-full",
			{ "pointer-events-none opacity-75": disabled },
		]}
	>
		<MarkdownEditor {carta} bind:value={content} />
	</div>
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
