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