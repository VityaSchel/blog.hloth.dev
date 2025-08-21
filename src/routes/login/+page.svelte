<script>
	import { enhance } from '$app/forms';
	import AppBar from '$lib/components/AppBar.svelte';
	import { toast } from 'svelte-sonner';

	let submitting = $state(false);
</script>

<AppBar homepage />
<form
	class="flex flex-1 flex-col items-center justify-center gap-5"
	action="/login"
	method="post"
	use:enhance={() => {
		submitting = true;
		return (e) => {
			submitting = false;
			if (e.result.type === 'error') {
				toast.error(e.result.error);
			} else if (e.result.type === 'failure') {
				toast.error('Login failed');
			}
			e.update();
		};
	}}
>
	<h1 class="font-display text-4xl font-bold">Welcome</h1>
	<div class="flex items-center">
		<input
			type="password"
			name="password"
			class="
				rounded-l-full border border-black px-4 py-1 font-caption font-semibold
				focus:outline-0
				disabled:opacity-50
				dark:border-sandy
			"
			disabled={submitting}
			placeholder="Admin password"
		/>
		<button
			type="submit"
			class="
				cursor-pointer rounded-r-full border border-sandy bg-sandy px-3 py-1
				font-display font-semibold tracking-tight text-black
				disabled:opacity-50
			"
			disabled={submitting}
		>
			<span class="block translate-y-[1px]">Submit</span>
		</button>
	</div>
</form>
