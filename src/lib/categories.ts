import type { Category } from '$lib/server/db/schema';
import z from 'zod';

export const categories: Category[] = [
	'life_story',
	'tutorial',
	'project',
	'announcement',
	'review'
] as const;

export type CategoryValue = (typeof categories)[number];

export const categoriesNames: Record<CategoryValue, string> = {
	life_story: 'Life Story',
	project: 'Project',
	tutorial: 'Tutorial',
	announcement: 'Announcement',
	review: 'Review'
} as const;

export const categorySchema = z.enum(categories);
