export const categories = [
  'life_story',
  'tutorial',
  'project',
  'announcement',
  'review',
] as const

export type Category = typeof categories[number]