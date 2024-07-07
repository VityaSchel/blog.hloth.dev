import type { OutputData } from '@editorjs/editorjs'

export type PostBanner = {
  src: string
  placeholder: string
  alt: string
  width: number
  height: number
}

export type Post = {
  date: Date
  title: string
  slug: string
  banner: PostBanner
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

export type PostEditorFields = Omit<PostFull, 'date' | 'banner'> & {
  banner: PostBanner | null
}