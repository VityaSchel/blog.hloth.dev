<script lang="ts">
	let {
		value = $bindable(),
	}: {
		value: "edit" | "preview";
	} = $props();
</script>

<div class="sticky top-0 z-[10] flex w-full items-center bg-[var(--bg)]">
	<label class="cursor-pointer">
		<input type="radio" name="editor-mode" value="edit" bind:group={value} />
		Edit
	</label>
	<label class="cursor-pointer">
		<input type="radio" name="editor-mode" value="preview" bind:group={value} />
		Preview
	</label>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	label {
		@apply p-4;
		white-space: collapse;
	}
	input[type="radio"] {
		appearance: none;
		position: absolute;
	}
	label:has(input[type="radio"]:checked) {
		font-weight: 600;
	}
</style>
