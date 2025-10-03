import z from "zod";
import { categories } from "$lib/categories";

export const noNullCharacter = (s: string) => !s.includes("\0");

export const postTitleSchema = z
	.string()
	.refine(noNullCharacter, { message: "Title cannot contain null characters" })
	.min(1)
	.max(64);

export const postCategorySchema = z.enum(categories);

export const postReadTimeSchema = z.number().int().min(1).max(90);

export const postBannerAltSchema = z
	.string()
	.refine(noNullCharacter, {
		message: "Alt text cannot contain null characters",
	})
	.min(1)
	.max(1024);

export const postContentSchema = z
	.string()
	.refine(noNullCharacter, {
		message: "Content cannot contain null characters",
	})
	.max(1 * 1024 * 1024);

export const postExcerptSchema = z
	.string()
	.refine(noNullCharacter, {
		message: "Excerpt cannot contain null characters",
	})
	.min(1)
	.max(512);
