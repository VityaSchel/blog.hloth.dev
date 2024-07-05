import type { OutputData } from '@editorjs/editorjs'

export type PostSchema = {
  createdAt: Date
  updatedAt: Date
  views: number
  title: string
  slug: string
  banner: {
    src: string
    placeholder: string
    alt: string
    width: number
    height: number
  }
  content: OutputData
  excerpt: string
  category: string
  readingTime: number
  locale: 'ru' | 'en'
  draft: boolean
}