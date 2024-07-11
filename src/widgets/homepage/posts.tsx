import React from 'react'
import { PostPreview } from '@/features/post-preview'
import { categories } from '@/shared/model/category'
import type { Post } from '@/shared/model/post'
import { Separator } from '@/shared/ui/separator'
import { useRouter } from 'next/router'
import { NoPostsYet } from '@/entities/no-posts-yet'
import cx from 'classnames'
import Link from 'next/link'

export function Posts({ posts, drafts = false }: {
  posts: Post[]
  drafts?: boolean
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
    onUrlChange()
    return () => {
      window.removeEventListener('popstate', onUrlChange)
      router.events.off('routeChangeComplete', onUrlChange)
    }
  }, [router, posts])

  return (
    <>
      <a id='posts'></a>
      <section className={cx({ 'mt-[60px]': !drafts })}>
        {filteredPosts.length ? (<>
          {filteredPosts.map((post, i) => (
            <React.Fragment key={post.slug}>
              <PostPreview
                key={post.slug}
                {...post}
                first={i === 0}
                draft={drafts}
              />
              {i !== filteredPosts.length - 1 && <Separator />}
            </React.Fragment>
          ))}
          {router.query.category && (
            <div className='flex justify-center mt-24'>
              <Link 
                href='/#posts' 
                className='text-base border rounded-full px-4 font-medium' 
                scroll={false}
              >
                Показать всё
              </Link>
            </div>
          )}
        </>) : (
          <NoPostsYet />
        )}
      </section>
    </>
  )
}