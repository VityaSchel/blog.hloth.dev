<script>
	import Emoji from "$emoji";
	import { Toaster } from "svelte-sonner";
</script>

<Toaster expand>
	<Emoji code="silly" slot="errorIcon" />
</Toaster>
