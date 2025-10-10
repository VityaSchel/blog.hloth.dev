<script lang="ts">
	import z from "zod";
	import IsolatedIframe from "$lib/ui/IsolatedIframe.svelte";

	const {
		node,
	}: {
		node: import("mdast-util-directive").LeafDirective;
	} = $props();

	const {
		url: urlVar,
		service: serviceVar,
		ar: aspectRatio,
	} = z
		.object({
			url: z.url(),
			ar: z.coerce.number().min(0).max(100).default(1),
			service: z.string().optional(),
		})
		.parse(node.attributes);

	const service = $derived.by(() => {
		if (serviceVar) return serviceVar;
		const url = new URL(urlVar);
		if (url.hostname === "www.youtube.com" || url.hostname === "youtu.be") {
			return "YouTube";
		} else if (
			url.hostname === "twitter.com" ||
			url.hostname === "www.twitter.com" ||
			url.hostname === "x.com" ||
			url.hostname === "www.x.com"
		) {
			return "Twitter";
		} else {
			throw new Error(
				"Service argument must be provided for this URL in ::embed",
			);
		}
	});
</script>

<IsolatedIframe
	url={urlVar}
	{aspectRatio}
	title="Embedded {service} frame"
	caption={node.children}
/>
