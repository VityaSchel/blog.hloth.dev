<script lang="ts">
	let {
		caption,
		children,
	}: {
		caption: string;
		children: import("svelte").Snippet;
	} = $props();
</script>

<blockquote>
	<p>{@render children()}</p>
	<footer>— {caption}</footer>
</blockquote>

<style>
	blockquote {
		border-left: 2px solid var(--text);
		padding-left: 30px;
		margin: 32px 0;
		font-family: var(--font-serif);

		p {
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
				margin-right: 4px;
			}

			&::after {
				content: "”";
				font-size: 36px;
				vertical-align: bottom;
				margin-left: 4px;
			}
		}

		footer {
			margin-top: 30px;
			font-size: 18px;
		}
	}
</style>
