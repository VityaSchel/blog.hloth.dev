import type { OutputData } from '@editorjs/editorjs'

export type Post = {
  date: Date
  title: string
  slug: string
  banner: {
    src: string
    placeholder: string
    alt: string
  }
  excerpt: string
  category: string
  readingTime: number
}

export type PostProps = Omit<Post, 'date'> & {
  createdAt: number
}

export type PostFull = Post & {
  content: OutputData
}

export type PostFullProps = Omit<PostFull, 'date'> & {
  createdAt: number
}