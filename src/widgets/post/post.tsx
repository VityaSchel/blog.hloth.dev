import { Category } from '@/entities/category'
import { ReadingTimer } from '@/entities/reading-timer'
import type { Post } from '@/shared/model/post'
import Me from '@/assets/me.webp'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { Roboto_Mono } from 'next/font/google'
import cx from 'classnames'
import { Separator } from '@/shared/ui/separator'
import { ArticleContentRenderer } from '@/features/article-content-renderer'

const RobotoMono = Roboto_Mono({ weight: ['400'], subsets: ['cyrillic', 'latin'] })

export function Post({ banner, title, category, /*date, */readingTime }: Post) {
  const { t } = useTranslation()
  return (
    <article className='pt-16'>
      <div className='flex items-start justify-between'>
        <div className='flex self-stretch flex-col gap-8 flex-[50%] max-w-[50%]'>
          <div className='flex gap-5 items-center'>
            <Category>{category}</Category>
            <ReadingTimer minutes={readingTime} />
          </div>
          <h1 className='font-display font-medium text-6xl leading-tight line-clamp-3' title={title}>
            {title}
          </h1>
          <div className='flex gap-4 mt-auto items-center'>
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
          </div>
        </div>
        <div className='rounded-[60px] relative aspect-[1.625/1] flex-[40%] max-w-[40%] overflow-clip'>
          <Image 
            src={banner.src}
            alt={banner.alt}
            placeholder='blur'
            blurDataURL={banner.placeholder}
            fill
            className='object-cover'
          />
        </div>
      </div>
      <Separator />
      <ArticleContentRenderer />
    </article>
  )
}