import React from 'react'
import { ReadingTimer } from '@/entities/reading-timer'
import Me from '@/assets/me.webp'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { Roboto_Mono } from 'next/font/google'
import cx from 'classnames'
import { Separator } from '@/shared/ui/separator'
import { categories, type Category as CategoryType } from '@/shared/model/category'
import { Category } from '@/entities/category'
import dynamic from 'next/dynamic'
import CyrillicToTranslit from 'cyrillic-to-translit-js'
import type { EditorRef } from '@/features/article-editor/index'

const ArticleEditor = dynamic(() => 
  import('@/features/article-editor/index').then(mod => mod.ArticleEditor),
  {
    loading: () => <p className='text-center w-full text-xl'>✏️</p>,
    ssr: false
  }
)

const RobotoMono = Roboto_Mono({ weight: ['400'], subsets: ['cyrillic', 'latin'] })

export function NewPost() {
  const { t } = useTranslation()

  const [banner, setBanner] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState<string>('')
  const [slug, setSlug] = React.useState<string>('')
  const [excerpt, setExcerpt] = React.useState('')
  const [category, setCategory] = React.useState<CategoryType>('life_story')
  const [readingTime, setReadingTime] = React.useState<number>(0)
  
  const titleInput = React.useRef<HTMLTextAreaElement>(null)
  const [textareaResized, setTextAreaResized] = React.useState(false)
  const handleTitleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setTitle(event.currentTarget.value.replaceAll('\n', ''))
    if (!textareaResized && event.currentTarget.scrollHeight > event.currentTarget.clientHeight) {
      setTextAreaResized(true)
    }
  }

  const handlePublish = async () => {
    console.log(await articleEditorRef.current?.save())
  }

  const categorySelectRef = React.useRef<HTMLSelectElement>(null)
  React.useEffect(() => {
    if (titleInput.current) {
      titleInput.current?.scrollTo({ top: 0 })
      setTimeout(() => titleInput.current?.scrollTo({ top: 0 }), 0)
    }
  }, [title, titleInput])

  const bannerFileSelectorRef = React.useRef<HTMLInputElement>(null)
  const handleUploadBanner = () => {
    bannerFileSelectorRef.current?.click()
  }
  const uploadBanner = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setBanner(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const articleEditorRef = React.useRef<EditorRef>(null)

  return (
    <article className='pt-16'>
      <div className='flex items-start justify-between'>
        <div className='flex self-stretch flex-col gap-8 flex-[50%] max-w-[50%]'>
          <div className='flex gap-5 items-center'>
            <button onClick={() => categorySelectRef.current?.showPicker()}>
              <select 
                ref={categorySelectRef} 
                className='absolute w-32 opacity-0 pointer-events-none'
                value={category}
                onChange={(event) => setCategory(event.currentTarget.value as CategoryType)}
                tabIndex={-1}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {t(`categories.${category}`)}
                  </option>
                ))}
              </select>
              <Category>{category}</Category>
            </button>
            <ReadingTimer
              minutes={readingTime} 
              editable onChange={(minutes) => setReadingTime(minutes)}
            />
          </div>
          <textarea 
            className={cx('font-display font-medium text-6xl leading-tight line-clamp-3 bg-transparent text-text focus:outline-none h-full resize-none', {
              'h-[225px]': textareaResized
            })}
            value={title}
            placeholder={t('editor.title')}
            onChange={handleTitleInput}
            ref={titleInput}
            maxLength={64}
          />
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
        <button
          className='rounded-[60px] relative aspect-[1.625/1] flex-[40%] max-w-[40%] overflow-clip'
          onClick={handleUploadBanner}
        >
          <input 
            type='file'
            accept='image/*'
            onChange={uploadBanner}
            className='hidden'
            ref={bannerFileSelectorRef}
            tabIndex={-1}
          />
          {banner ? (
            <img src={banner} className='w-full h-full object-cover' />
          ) : (
            <div className='bg-placeholder w-full h-full' />
          )}
        </button>
      </div>
      <Separator />
      <ArticleEditor defaultValue={undefined} innerRef={articleEditorRef} />
      <Separator />
      <div className='flex flex-col gap-6 items-center'>
        <div className='w-[680px] max-w-full flex flex-col gap-2'>
          <span className='font-semibold'>{t('editor.slug')}:</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.currentTarget.value.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-').replaceAll(/[^a-z0-9-]/g, ''))}
            placeholder={CyrillicToTranslit().transform(title, '-').toLowerCase()}
            className='w-full font-text px-3 py-2 rounded-lg font-normal text-base text-text focus:outline-none'
          />
        </div>
        <div className='w-[680px] max-w-full flex flex-col gap-2'>
          <span className='font-semibold'>{t('editor.excerpt')}:</span>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.currentTarget.value.replaceAll('\n', ''))}
            placeholder={t('editor.excerpt_placeholder')}
            className='w-full font-text px-3 py-2 rounded-lg font-normal text-base text-text focus:outline-none resize-none'
            rows={5}
          />
        </div>
        <button className='bg-alt shadow-md border border-text rounded-full px-6 py-2 text-xl' onClick={handlePublish}>
          {t('editor.post')}
        </button>
      </div>
    </article>
  )
}