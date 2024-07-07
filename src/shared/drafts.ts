import { z } from 'zod'

const postFullSchema = z.object({
  title: z.string(),
  slug: z.string(),
  banner: z.object({
    src: z.string(),
    placeholder: z.string(),
    alt: z.string(),
    width: z.number(),
    height: z.number(),
  }).nullable(),
  excerpt: z.string(),
  category: z.string(),
  readingTime: z.number().int().nonnegative().max(90),
  content: z.object({
    time: z.number(),
    blocks: z.array(z.object({
      id: z.string(),
      type: z.string(),
      data: z.record(z.string(),z.any()),
    })),
    version: z.string(),
  }),
})

export function getDraft(locale: string) {
  const postSerialized = window.localStorage.getItem('hloth-blog-post-draft_' + locale)
  if (postSerialized === null) {
    return null
  } else {
    const parsing = postFullSchema.safeParse(JSON.parse(postSerialized))
    if(parsing.success) {
      return parsing.data
    } else {
      return null
    }
  }
}

export function saveDraft(post: any, locale: string) {
  postFullSchema.parse(post)
  window.localStorage.setItem('hloth-blog-post-draft_' + locale, JSON.stringify(post))
}

export function clearDraft(locale: string) {
  window.localStorage.removeItem('hloth-blog-post-draft_' + locale)
}