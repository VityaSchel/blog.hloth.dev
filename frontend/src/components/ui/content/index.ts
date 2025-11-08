import Image from "$ui/content/Image.astro";
import Video from "$ui/content/Video.astro";
import RichLink from "$ui/content/RichLink.astro";
import Embed from "$ui/content/Embed.astro";
import Attachments from "$ui/content/Attachments.astro";
import Carousel from "$ui/content/Carousel.astro";
import Callout from "$ui/content/Callout.astro";

export const components = {
	Callout,
	Carousel,
	Attachments,
	Embed,
	RichLink,
	Video,
	Image,
};

declare global {
	type MDXProvidedComponents = typeof components;
}
