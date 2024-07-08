import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { Category } from '@/entities/category'
import type { Post } from '@/shared/model/post'
import { ReadingTimer } from '@/entities/reading-timer'
import { formatTitle } from '@/shared/title'

export function PostPreview({ date, excerpt, slug, banner, category, first, readingTime, locale, draft, ...props }: Post & {
  first: boolean
  draft?: boolean
  locale?: string
}) {
  const { i18n } = useTranslation()
  const { title, emphasized, regular } = formatTitle(props.title)

  return (
    <Link href={draft ? `/blog/post?edit=${slug}` : `/blog/${slug}`} className='w-full block article-preview' locale={draft ? locale : undefined}>
      <article className='flex flex-col md:flex-row -ml-4 -mr-4'>
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
          className='col-span-2 px-4 md:flex-[16.67%] md:max-w-[16.67%] text-base font-medium font-display'
        >
          {Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'short',
            ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' })
          }).format(date)}
        </time>
        <div className='px-4 mt-2 md:mt-0 md:flex-[50%] md:max-w-[50%] lg:flex-[25%] lg:max-w-[25%] flex flex-col'>
          <h2 className='text-3xl font-medium tracking-[-.03em]' title={title}>
            <span className='font-caption italic font-normal'>{emphasized}</span>{regular}
          </h2>
          <p className='mt-4 md:mt-6 text-ellipsis line-clamp-6 font-text'>{excerpt}</p>
          <div className='mt-8 md:mt-auto flex gap-5 items-center'>
            <Category>{category}</Category>
            <ReadingTimer minutes={readingTime} />
          </div>
        </div>
        <div className='w-full mt-4 md:mt-0 md:w-auto md:flex-[41.67%] md:max-w-[41.67%] ml-auto px-4 aspect-[1.625/1] relative'>
          <div className='relative w-full h-full overflow-clip rounded-[30px] md:rounded-[60px]'>
            <Image
              src={banner.src}
              placeholder='blur'
              blurDataURL={banner.placeholder}
              alt={banner.alt}
              fill
              priority={first}
              quality={100}
              className='object-cover'
              draggable={false}
              sizes='(max-width: 768px) 93vw, 38vw'
            />
          </div>
          <div className='flex items-center justify-center top-10 right-14 z-10 absolute w-[50px] h-[50px]'>
            <span className='bg-white w-0 h-0 transition-all rounded-full relative text-3xl open-indicator overflow-clip duration-300 shadow-md'>
              <span className='opacity-0 transition-opacity duration-[800ms] absolute top-2.5 right-2.5'>
                <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'><path fill='#000000' d='M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z'></path></svg>
              </span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}