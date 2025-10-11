import { noNullCharacter } from "$lib/zod";
import { z } from "zod";

export const mediaFileIdSchema = z
	.string()
	.refine(noNullCharacter)
	.min(1)
	.max(64);

export const mediaFileSchema = z.object({
	id: mediaFileIdSchema,
});

export const imageSchema = z.object({
	id: mediaFileIdSchema,
	width: z.number().int().min(1),
	height: z.number().int().min(1),
	placeholder: z.string().min(1).max(8192),
});

export const videoSchema = z.object({
	id: mediaFileIdSchema,
});

export type Image = z.infer<typeof imageSchema>;
export type Video = z.infer<typeof videoSchema>;
