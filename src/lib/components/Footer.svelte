<script>
	import { categories, categoriesNames } from '$lib/categories';
	import { page } from '$app/state';
</script>

<footer
	class="
		footer-text bottom-0 z-[-1] w-full bg-black p-6 font-display text-white
		not-[:has(:focus-visible)]:sticky
		md:p-12
		dark:bg-sandy dark:text-black
	"
>
	<div
		class="
			flex flex-col
			md:flex-row md:items-end
		"
	>
		<div
			class="
				flex flex-col text-2xl font-semibold break-all
				md:mt-0 md:gap-1.5 md:pr-36 md:text-3xl
				tall-screen:mt-2 tall-screen:gap-3 tall-screen:text-4xl
			"
		>
			{#each categories as category (category)}
				<a
					href={'/?category=' + category + '#posts'}
					class={[
						'w-fit',
						{
							'text-active dark:text-active-dark':
								category && category === page.url.searchParams.get('category')
						}
					]}
				>
					{categoriesNames[category]}
				</a>
			{/each}
		</div>
		<div
			class="
				mt-4 flex flex-1 flex-col gap-1 font-caption font-medium
				md:mt-0 md:px-4 md:text-base
				tall-screen:mt-8 tall-screen:text-xl
			"
		>
			<span>My socials:</span>
			<a href="https://github.com/VityaSchel" class="link">GitHub</a>
			<a href="https://instagram.com/vityaczech" class="link">Instagram</a>
			<a href="https://www.linkedin.com/in/hloth/" class="link">Linkedin</a>
			<a href="https://github.com/VityaSchel/blog.hloth.dev" class="link mt-3">
				This website is open source
			</a>
		</div>
		<div
			class="
				mt-4 flex flex-col gap-1 text-sm font-medium
				md:mt-0 md:items-end md:justify-end md:text-right md:text-sm
				tall-screen:mt-8 tall-screen:text-lg
			"
		>
			<span>Contact me:</span>
			<a class="link" href="https://matrix.to/#/@hloth:hloth.dev">Matrix</a>
			<a class="link" href="mailto:hi@hloth.dev">hi@hloth.dev</a>
			<a class="link" href="mailto:jobs@hloth.dev">jobs@hloth.dev</a>
		</div>
	</div>
	<hr
		class="
			mt-5 h-[2px] w-full border-none bg-white
			sm:mt-[41px]
			dark:bg-black
		"
	/>
	<div class="mt-3 flex flex-wrap justify-between gap-x-2">
		<span class="block font-medium">/2024/2025</span>
		<span
			class="
				block text-sm font-medium tracking-normal text-inverted-alt
				dark:text-inverted-alt-dark
			"
		>
			Licensed with <a
				class="border-b-[1px]"
				href="https://creativecommons.org/licenses/by/4.0/"
				target="_blank"
				rel="nofollow noreferrer noopener"
			>
				CC BY 4.0
			</a>
			&
			<a
				class="border-b-[1px]"
				href="https://github.com/VityaSchel/blog.hloth.dev/tree/main/LICENSE"
				target="_blank"
				rel="nofollow noreferrer noopener"
			>
				MIT
			</a>
			unless otherwise stated.
		</span>
	</div>
</footer>

<style lang="postcss">
	@reference 'tailwindcss';
	.link {
		@apply w-fit underline underline-offset-4;
	}
</style>
