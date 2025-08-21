<script lang="ts">
	let { url }: { url: string } = $props();
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video src={url} class="w-full" controls autoPlay={false}></video>
