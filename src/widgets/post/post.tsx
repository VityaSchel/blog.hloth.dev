import { Category } from '@/entities/category'
import { ReadingTimer } from '@/entities/reading-timer'
import type { PostFull } from '@/shared/model/post'
import Me from '@/assets/me.webp'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { Roboto_Mono } from 'next/font/google'
import cx from 'classnames'
import { Separator } from '@/shared/ui/separator'
import { ArticleContentRenderer } from '@/features/article-content-renderer'
import { ShareButtons } from '@/features/share-buttons'
import Link from 'next/link'

const RobotoMono = Roboto_Mono({ weight: ['400'], subsets: ['cyrillic', 'latin'] })

export function Post({ banner, title, category, slug, date, readingTime, content }: PostFull) {
  const { t, i18n } = useTranslation()
  
  return (
    <article className='pt-16'>
      <div className='flex flex-col-reverse md:flex-row items-start justify-between'>
        <div className='flex self-stretch flex-col gap-8 md:flex-[50%] md:max-w-[50%]'>
          <div className='flex gap-5 items-center'>
            <Category>{category}</Category>
            <ReadingTimer minutes={readingTime} />
          </div>
          <h1 className='font-display font-medium text-6xl leading-tight line-clamp-3' title={title}>
            {title}
          </h1>
          <Link className='flex gap-4 mt-auto items-center' href='https://hloth.dev'>
            <Image 
              src={Me}
              alt={t('me')}
              width={50}
              height={50}
              quality={100}
              className='rounded-full border border-text'
            />
            <div className='flex flex-col'>
              <span className='font-display font-medium'>
                {t('me')}
              </span>
              <span className={cx('uppercase text-sm text-alt', RobotoMono.className)}>
                {t('specialty')}
              </span>
            </div>
          </Link>
        </div>
        <div className='rounded-[30px] md:rounded-[60px] relative aspect-[1.625/1] w-full mb-8 md:mb-0 md:w-auto md:flex-[40%] md:max-w-[40%] overflow-clip'>
          <Image 
            src={banner.src}
            alt={banner.alt}
            placeholder='blur'
            blurDataURL={banner.placeholder}
            fill
            className='object-cover'
            draggable={false}
          />
        </div>
      </div>
      <Separator />
      <ArticleContentRenderer
        content={content}
      />
      <div className='flex justify-center'>
        <div className='w-[680px] flex flex-col gap-4 mt-16 md:gap-2 md:mt-8 md:flex-row justify-between md:items-center'>
          <div className='text-gray'>
            <span className='font-semibold font-display'>{t('published_at')}: </span>
            <span title={Intl.DateTimeFormat(i18n.language, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(date)}>
              {Intl.DateTimeFormat(i18n.language, {
                day: 'numeric',
                month: 'long',
                ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' })
              }).format(date)}
            </span>
          </div>
          <ShareButtons url={`https://blog.hloth.dev/${i18n.language === 'ru' ? 'ru': 'en'}/blog/${slug}`} />
        </div>
      </div>
    </article>
  )
}