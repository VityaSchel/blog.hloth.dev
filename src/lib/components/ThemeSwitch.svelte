<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { getThemeContext } from '$lib/theme';

	const context = getThemeContext();
	const altTheme = $derived(context.theme === 'dark' ? 'light' : 'dark');
</script>

<form
	action="/?/theme"
	method="post"
	class={[
		'flex h-[2px] w-full items-center',
		{
			// 'h-[2px]': !open,
			// 'h-[24px]': open
		}
	]}
	use:enhance={() => {
		let previousTheme = context.theme;
		document.documentElement.dataset.theme = altTheme;
		context.theme = altTheme;
		return (e) => {
			if (e.result.type !== 'success' && e.result.type !== 'redirect') {
				context.theme = previousTheme;
				document.documentElement.dataset.theme = previousTheme ?? 'light';
			}
		};
	}}
>
	<input
		type="hidden"
		name="redirect"
		value={page.url.pathname + page.url.search}
	/>
	<input type="hidden" name="theme" value={altTheme} />
	<button class="group h-6 w-full cursor-pointer rounded-full" type="submit">
		<div
			class="
				theme-switch-bg relative h-[2px] w-full overflow-clip transition-all
				duration-200
				group-hover:h-6 group-hover:rounded-xl
				group-focus-visible:h-6 group-focus-visible:rounded-xl
			"
			style="background-position-x: {(new Date().getHours() / 24) * 33.333 +
				'%'}"
		>
			<div
				class="
					theme-switch-bg-open absolute top-0 left-0 h-full w-full opacity-0
					transition-opacity duration-200
					group-hover:opacity-100
					group-focus-visible:opacity-100
				"
				style="background-position-x: {(new Date().getHours() / 24) * 33.333 +
					'%'}"
			>
				<span
					class="
						absolute top-1/2 left-1/2 block -translate-x-1/2 -translate-y-1/2
						font-display text-sm font-medium text-cream
						dark:text-black
					"
				>
					{#if context.theme === 'dark'}
						Switch theme to light
					{:else}
						Switch theme to dark
					{/if}
				</span>
			</div>
		</div>
	</button>
</form>
