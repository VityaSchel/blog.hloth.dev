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
	import smile from "$emoji/smile.webp";

	let {
		width = 32,
		height = 32,
		icon,
	}: {
		icon: EmojiCode;
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
		gpl,
		handsome,
		jojo,
		sad,
		shock,
		"silly-ket": sillyKet,
		silly,
		smarty,
		tired,
		vietnam,
		smile,
	};

	if (!emojiMap[icon]) {
		throw new Error(`Emoji icon "${icon}" not found`);
	}

	const image = await getImage({
		src: emojiMap[icon],
		width: width,
		height: height,
		densities: [1, 2],
		format: "avif",
		quality: 100,
	});
</script>

<span
	class="relative inline-block align-middle"
	style="width: {width}px; height: {height}px;"
>
	<img
		{width}
		{height}
		src={emojiMap[icon].src}
		alt={`${icon} emoji`}
		class="relative z-[1] text-[0px]"
		loading="lazy"
		srcset={image.srcSet.attribute}
	/>
	<!-- <span
		class={[
			`absolute top-0 left-0 aspect-square h-full w-full animate-pulse
			rounded-full bg-stone-300 object-contain`,
			// {
			// 	hidden: !browser || loaded,
			// },
		]}
	></span> -->
</span>
