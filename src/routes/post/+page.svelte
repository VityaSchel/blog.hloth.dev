<script lang="ts">
	import { enhance } from "$app/forms";
	import AppBar from "$lib/components/AppBar.svelte";
	import Button from "$lib/ui/Button.svelte";
	import FormError from "$lib/ui/FormError.svelte";

	let { form }: import("./$types").PageProps = $props();

	let submitting = $state(false);
</script>

<AppBar homepage />
<form
	class="flex flex-1 flex-col items-center justify-center gap-5"
	method="POST"
	use:enhance={() => {
		submitting = true;
		return (e) => {
			submitting = false;
			e.update();
		};
	}}
>
	<h1
		class="flex items-center justify-center px-2 font-display text-4xl
			font-bold"
	>
		New post
	</h1>
	<div class="flex">
		<span
			class="flex items-center justify-center rounded-l-full border border-r-0
				px-4 pr-1"
		>
			blog.hloth.dev/
		</span>
		<input
			name="postId"
			class="border border-black px-2 py-1 font-caption font-semibold
				focus:outline-0 disabled:opacity-50 dark:border-sandy"
			disabled={submitting}
			placeholder="Post ID"
			pattern="^[a-z0-9.-]+$"
			required
		/>
		<Button type="submit" class="rounded-r-full pr-4" disabled={submitting}>
			Submit
		</Button>
	</div>
	{#if form?.error}
		<FormError>{form.error}</FormError>
	{/if}
</form>
