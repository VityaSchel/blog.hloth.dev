<script lang="ts">
	let {
		children,
	}: {
		children: import("svelte").Snippet;
	} = $props();
</script>

<blockquote>
	{@render children()}
</blockquote>

<style>
	blockquote {
		border-left: 2px solid var(--text);
		padding-left: 30px;
		margin: 32px 0;
		font-family: var(--font-serif);

		:global(p) {
			font-style: italic;
			font-weight: 500;
			font-size: 31px;
			font-feature-settings:
				"liga" 1,
				"clig" 1,
				"calt" 1,
				"dlig" 0;
			line-height: 1.15;
			transform: scaleY(1.1);

			&::before {
				content: "“";
				font-size: 36px;
				vertical-align: middle;
				margin-right: 6px;
			}

			&::after {
				content: "”";
				font-size: 36px;
				vertical-align: bottom;
				margin-left: 3px;
			}
		}
	}
</style>
