<script lang="ts">
	import RichLink from "$lib/ui/RichLink.svelte";
	import z from "zod";

	let { node }: { node: import("mdast-util-directive").LeafDirective } =
		$props();

	const { title, href, description, img } = z
		.object({
			title: z.string().optional(),
			href: z.url(),
			description: z.string().optional(),
			img: z.url().optional(),
		})
		.parse(node.attributes);
</script>

<RichLink {title} {href} {description} imageUrl={img} />
