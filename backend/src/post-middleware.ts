import { getPosts } from "src/rss";

export async function doesPostExist(id: string): Promise<boolean> {
	const posts = await getPosts();
	return posts.some((p) => p.id === id);
}
