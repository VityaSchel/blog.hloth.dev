<script lang="ts">
	import { codeToHtml } from "shiki";
	import { getThemeContext } from "$lib/theme";
	import DOMPurify from "isomorphic-dompurify";

	let {
		language,
		code,
		ssr,
	}: { language?: string | null; code: string; ssr?: string } = $props();

	const context = getThemeContext();

	let highlightedCode = $derived.by(async () => {
		try {
			if (!language) return null;
			return await codeToHtml(code, {
				lang: language,
				theme: context.theme === "dark" ? "github-dark" : "github-light",
			});
		} catch (e) {
			console.error(`Language ${language} is not supported by shiki.`, e);
			return null;
		}
	});

	export const sanitizeHighlightedCode = (code: string) => {
		const sanitizer = DOMPurify();
		sanitizer.addHook("uponSanitizeAttribute", (node, data) => {
			const allowedAttrs: Record<string, string[]> = {
				a: ["href", "target", "rel"],
				span: ["class", "style"],
				pre: ["class", "style", "tabindex"],
				code: ["class", "style"],
			};

			const tagName = node.tagName.toLowerCase();
			const allowed = allowedAttrs[tagName] || [];

			if (!allowed.includes(data.attrName)) {
				console.warn(
					`Removed attribute ${data.attrName} from <${tagName}>`,
					node,
				);
				data.keepAttr = false;
			}
		});
		const result = sanitizer.sanitize(code, {
			ALLOWED_TAGS: [
				"body",
				"a",
				"br",
				"i",
				"b",
				"strong",
				"em",
				"strike",
				"u",
				"span",
				"pre",
				"code",
			],
		});
		if (sanitizer.removed.length > 0) {
			console.warn(
				"Sanitized code had removed elements/attributes:",
				sanitizer.removed,
			);
		}
		return result;
	};
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
<div
	class={[
		"code-container relative my-2 font-mono text-sm",
		{
			nowrap: true,
			wrap: false,
		},
	]}
>
	<label
		class="absolute top-0.5 right-3 flex items-center gap-1 font-text text-sm
			font-medium tracking-tight dark:accent-sandy"
	>
		<input type="checkbox" class="peer toggle-wrap h-3 w-3" />
		Wrap lines
	</label>
	{#snippet fallback()}
		{#if ssr}
			{@html sanitizeHighlightedCode(ssr)}
		{:else}
			<pre
				class="
					fallback bg-white text-neutral-900
					dark:bg-[#1e1e1e] dark:text-neutral-200
				">{code}</pre>
		{/if}
	{/snippet}
	{#await highlightedCode}
		{@render fallback()}
	{:then highlightedCode}
		{#if highlightedCode === null}
			{@render fallback()}
		{:else}
			{@html sanitizeHighlightedCode(highlightedCode)}
		{/if}
	{/await}
</div>

<style>
	.code-container :global {
		pre {
			padding: 1.5rem 0 1rem 0;
			border-radius: 12px;
			line-height: 21px;
		}
		pre.fallback {
			padding: 1.5rem 1rem 1rem 1rem;
		}
		&:has(.toggle-wrap:checked) pre {
			white-space: pre-wrap;
			word-break: break-word;
		}
		&:not(:has(.toggle-wrap:checked)) pre {
			overflow-x: auto;
			overscroll-behavior: none;
			scrollbar-width: thin;
		}

		code {
			display: flex;
			flex-direction: column;
		}
		&:not(:has(.toggle-wrap:checked)) code {
			width: max(100%, max-content);
		}
		&:has(.toggle-wrap:checked) code {
			white-space: pre-wrap;
		}

		.line {
			width: 100%;
			display: block;
			padding: 0 1rem;
			min-height: 21px;
			position: relative;
			flex-shrink: 0;

			&::after {
				content: "";
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;

				border-color: rgba(25, 25, 25, 0.075);
			}

			&:hover::after {
				border-width: 2px 0px 2px 0px;
			}
		}
		&:has(.toggle-wrap:checked) .line {
			word-break: break-all;
		}
		&:where([data-theme="dark"], [data-theme="dark"] *) .line::after {
			border-color: rgba(62, 62, 62, 0.35);
		}
	}
</style>
