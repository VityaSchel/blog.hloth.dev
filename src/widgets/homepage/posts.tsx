import React from 'react'
import { PostPreview } from '@/features/post-preview'
import { categories } from '@/shared/model/category'
import type { Post } from '@/shared/model/post'
import { Separator } from '@/shared/ui/separator'
import { useRouter } from 'next/router'
import { NoPostsYet } from '@/entities/no-posts-yet'

export function Posts({ posts }: {
  posts: Post[]
}) {
  const [filteredPosts, setFilteredPosts] = React.useState(posts)
  const router = useRouter()

  React.useEffect(() => {
    const onUrlChange = () => {
      const category = new URL(window.location.href).searchParams.get('category')
      if (category && categories.includes(category as any)) {
        setFilteredPosts(posts.filter(post => post.category === category))
      } else {
        setFilteredPosts(posts)
      }
    }
    window.addEventListener('popstate', onUrlChange)
    router.events.on('routeChangeComplete', onUrlChange)
    return () => {
      window.removeEventListener('popstate', onUrlChange)
      router.events.off('routeChangeComplete', onUrlChange)
    }
  })

  return (
    <>
      <a id='posts'></a>
      <section className='mt-[60px]'>
        {filteredPosts.length ? (
          filteredPosts.map((post, i) => (
            <React.Fragment key={post.slug}>
              <PostPreview
                key={post.slug}
                {...post}
                first={i === 0}
              />
              {i !== filteredPosts.length - 1 && <Separator />}
            </React.Fragment>
          ))
        ) : (
          <NoPostsYet />
        )}
      </section>
    </>
  )
}