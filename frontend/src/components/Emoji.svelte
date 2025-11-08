<script lang="ts">
	import type { EmojiCode } from "$lib/emojis";
	import { getImage } from "astro:assets";
	import ahyj from "$emoji/ahyj.webp";
	import blevota from "$emoji/blevota.webp";
	import bonk from "$emoji/bonk.webp";
	import clown from "$emoji/clown.webp";
	import cool from "$emoji/cool.webp";
	import eww from "$emoji/eww.webp";
	import funny from "$emoji/funny.webp";
	import giggity from "$emoji/giggity.webp";
	import gpl from "$emoji/gpl-monster.webp";
	import handsome from "$emoji/handsome.webp";
	import jojo from "$emoji/jojo.webp";
	import sad from "$emoji/sad.webp";
	import shock from "$emoji/shock.webp";
	import sillyKet from "$emoji/silly-ket.webp";
	import silly from "$emoji/silly.webp";
	import smarty from "$emoji/smarty.webp";
	import tired from "$emoji/tired.webp";
	import vietnam from "$emoji/vietnam.webp";

	let {
		width = 32,
		height = 32,
		code,
	}: {
		code: EmojiCode;
		width?: number;
		height?: number;
	} = $props();

	if (width >= 50 || height >= 50) {
		throw new Error("Emojis are 100x100px so max size is 50x50px");
	}

	const emojiMap: Record<EmojiCode, ImageMetadata> = {
		ahyj,
		blevota,
		bonk,
		clown,
		cool,
		eww,
		funny,
		giggity,
		"gpl-monster": gpl,
		handsome,
		jojo,
		sad,
		shock,
		"silly-ket": sillyKet,
		silly,
		smarty,
		tired,
		vietnam,
	};

	const image = await getImage({
		src: emojiMap[code],
		width: width,
		height: height,
		densities: [1, 2],
		format: "avif",
		quality: 100,
	});
</script>

<div class="relative inline-block align-middle">
	<img
		{width}
		{height}
		src={emojiMap[code].src}
		alt="Silly Ket"
		class="text-[0px]"
		loading="lazy"
		srcset={image.srcSet.attribute}
	/>
	<span
		class="absolute z-[-1] w-full h-full aspect-square object-contain bg-stone-300"
	></span>
</div>
