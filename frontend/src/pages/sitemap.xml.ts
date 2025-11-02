import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import dedent from "dedent";

export const GET: APIRoute = async ({ site }) => {
	const base =
		process.env.NODE_ENV === "development"
			? `http://localhost:${process.env.PORT ?? 4321}`
			: (site?.origin ?? null);
	const posts = (await getCollection("blog")).sort(
		(a, b) => b.data.createdAt.valueOf() - a.data.createdAt.valueOf(),
	);

	const result = dedent`
		<?xml version="1.0" encoding="UTF-8"?>  
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">  
		<url><loc>${base}/</loc></url>
		${posts
			.map((post) => {
				const lastMod = (
					post.data.updatedAt ?? post.data.createdAt
				).toISOString();
				return `<url><loc>${base}/${post.id}</loc><lastmod>${lastMod}</lastmod></url>`;
			})
			.join("\n")}  
		</urlset>
  		`.trim();

	return new Response(result, {
		headers: {
			"Content-Type": "application/xml",
		},
	});
};
