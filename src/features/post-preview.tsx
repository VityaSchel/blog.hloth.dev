import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { Category } from '@/entities/category'
import type { Post } from '@/shared/model/post'
import { ReadingTimer } from '@/entities/reading-timer'

export function PostPreview({ date, title, excerpt, slug, banner, category, first, readingTime }: Post & {
  first: boolean
}) {
  const { i18n } = useTranslation()

  return (
    <Link href={`/blog/${slug}`} className='w-full block'>
      <article className='flex -ml-4 -mr-4'>
        <time 
          dateTime={date.toISOString()} 
          title={Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).format(date)}
          className='col-span-2 px-4 flex-[16.67%] max-w-[16.67%] text-base font-medium font-display'
        >
          {Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'short',
            ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' })
          }).format(date)}
        </time>
        <div className='px-4 flex-[25%] max-w-[25%] flex flex-col'>
          <h2 className='text-3xl font-medium tracking-[-.03em]'>{title}</h2>
          <p className='mt-6 text-ellipsis line-clamp-6 font-text'>{excerpt}</p>
          <div className='mt-auto flex gap-5 items-center'>
            <Category>{category}</Category>
            <ReadingTimer minutes={readingTime} />
          </div>
        </div>
        <div className='flex-[41.67%] max-w-[41.67%] ml-auto px-4 aspect-[1.625/1]'>
          <div className='relative w-full h-full overflow-clip rounded-[60px]'>
            <Image 
              src={banner.src}
              placeholder='blur'
              blurDataURL={banner.placeholder}
              alt={banner.alt}
              fill
              // sizes='' // TODO
              priority={first}
              className='object-cover'
            />
          </div>
        </div>
      </article>
    </Link>
  )
}