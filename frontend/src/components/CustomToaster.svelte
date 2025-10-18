<script>
	import Silly from "$emoji/silly.webp";
	import { Toaster } from "svelte-sonner";
</script>

<Toaster expand>
	{#snippet errorIcon()}
		<img
			src={Silly.src}
			alt="Silly Ket"
			class="bg-stone-300 rounded-full w-8 h-8 text-[0px]"
		/>
	{/snippet}
</Toaster>
