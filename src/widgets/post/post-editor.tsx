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
import { BannerUploader } from '@/features/banner-uploader'
import { useRouter } from 'next/router'
import type { PostEditorFields } from '@/shared/model/post'
import { clearDraft, saveDraft } from '@/shared/drafts'

const ArticleEditor = dynamic(() => 
  import('@/features/article-editor/index').then(mod => mod.ArticleEditor),
  {
    loading: () => <p className='text-center w-full text-xl'>✏️</p>,
    ssr: false
  }
)

const RobotoMono = Roboto_Mono({ weight: ['400'], subsets: ['cyrillic', 'latin'] })

export function PostEditor({ initial }: { initial: PostEditorFields | null }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)

  const [banner, setBanner] = React.useState<{ src: string, placeholder: string, width: number, height: number } | null>(initial ? initial.banner : null)
  const [bannerAlt, setBannerAlt] = React.useState(initial ? (initial.banner?.alt ?? '') : '')
  const [title, setTitle] = React.useState<string>(initial ? initial.title : '')
  const [slug, setSlug] = React.useState<string>(initial ? initial.slug : '')
  const [excerpt, setExcerpt] = React.useState(initial ? initial.excerpt : '')
  const [category, setCategory] = React.useState<CategoryType>(initial ? initial.category as CategoryType : 'life_story')
  const [readingTime, setReadingTime] = React.useState<number>(initial ? initial.readingTime : 0)
  const [bannerAltShow, setBannerAltShow] = React.useState(false)
  const [slugExists, setSlugExists] = React.useState<null | boolean>(null)
  const stopDraftsSaving = React.useRef(false)
  
  const titleInput = React.useRef<HTMLTextAreaElement>(null)
  const [textareaResized, setTextAreaResized] = React.useState(false)
  const handleTitleInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    setTitle(event.currentTarget.value.replaceAll('\n', ''))
    if (!textareaResized && event.currentTarget.scrollHeight > event.currentTarget.clientHeight) {
      setTextAreaResized(true)
    }
  }

  React.useEffect(() => {
    setBannerAlt(initial?.banner?.alt ?? '')
    setBanner(initial?.banner ?? null)
    setSlug(initial?.slug ?? '')
    setExcerpt(initial?.excerpt ?? '')
    setCategory(initial?.category as CategoryType ?? 'life_story')
    setReadingTime(initial?.readingTime ?? 0)
    setTitle(initial?.title ?? '')
    articleEditorRef.current?.load(initial?.content ?? { time: Date.now(), blocks: [], version: '2.29.1' })
  }, [initial])

  const handleSave = async ({ draft }: { draft: boolean }) => {
    if (!banner) return
    if (!bannerAlt) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setBannerAltShow(true)
      return
    }
    try {
      const request = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: await articleEditorRef.current?.save(),
          excerpt,
          category,
          readingTime,
          banner: {...banner, alt: bannerAlt},
          slug,
          locale: router.locale,
          draft
        })
      })
        .then(response => response.json() as Promise<{ ok: true } | { ok: false, error: string }>)
      if(request.ok) {
        stopDraftsSaving.current = true
        setSubmitting(false)
        window.onbeforeunload = null
        clearDraft(router.locale ?? 'en')
        if(draft) {
          router.push('/blog/drafts')
        } else {
          router.push('/blog/' + slug)
        }
      } else {
        alert('Error: ' + request.error)
      }
    } catch(error) {
      console.error(error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Look into the console'))
    }
  }

  React.useEffect(() => {
    window.onbeforeunload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
  }, [])

  const categorySelectRef = React.useRef<HTMLSelectElement>(null)
  React.useEffect(() => {
    if (titleInput.current) {
      titleInput.current?.scrollTo({ top: 0 })
      setTimeout(() => titleInput.current?.scrollTo({ top: 0 }), 0)
    }
  }, [title, titleInput])

  const articleEditorRef = React.useRef<EditorRef>(null)

  const savePostDraft = React.useCallback(async () => {
    const draft = {
      title,
      content: await articleEditorRef.current?.save(),
      excerpt,
      category,
      readingTime,
      banner: banner === null ? null : { ...banner, alt: bannerAlt },
      slug,
      locale: router.locale,
    }
    try {
      saveDraft(draft, router.locale ?? 'en')
    } catch (error) {
      console.log('Draft:', draft)
      throw error
    }
  }, [banner, bannerAlt, category, excerpt, readingTime, router.locale, slug, title])

  React.useEffect(() => {
    if(!router.query.edit) {
      const interval = setInterval(() => {
        if (stopDraftsSaving.current === true) {
          clearInterval(interval)
          return
        }
        savePostDraft()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [router.query.edit, savePostDraft])

  React.useEffect(() => {
    const onRouteChangeStart = async () => {
      if(stopDraftsSaving.current) return
      await savePostDraft()
    }
    router.events.on('routeChangeStart', onRouteChangeStart)
    return () => {
      router.events.off('routeChangeStart', onRouteChangeStart)
    }
  }, [router, savePostDraft])

  return (
    <article className='pt-16'>
      <div className='flex items-start justify-between'>
        <div className='flex self-stretch flex-col gap-8 flex-[50%] max-w-[50%]'>
          <div className='flex gap-5 items-center'>
            <button onClick={() => categorySelectRef.current?.showPicker()} disabled={submitting}>
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
            disabled={submitting}
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
        <BannerUploader
          value={banner?.src ?? ''}
          onChange={setBanner}
          alt={bannerAlt}
          altOnChange={setBannerAlt}
          disabled={submitting}
          bannerAltShow={bannerAltShow}
        />
      </div>
      <Separator />
      <ArticleEditor
        defaultValue={initial ? initial.content : undefined}
        innerRef={articleEditorRef}
        disabled={submitting}
      />
      <Separator />
      <div className='flex flex-col gap-6 items-center'>
        <div className='w-[680px] max-w-full flex flex-col gap-2 relative'>
          <span className='font-semibold'>{t('editor.slug')}:</span>
          <input
            value={slug}
            onChange={(event) => {
              const slug = event.currentTarget.value.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-').replaceAll(/[^a-z0-9-]/g, '')
              setSlug(slug)
              setSlugExists(null)
              if (slug !== '') {
                fetch('/api/check-slug?' + new URLSearchParams({ slug, locale: router.locale as string }))
                  .then(response => response.json() as Promise<{ exists: boolean }>)
                  .then(({ exists }) => {
                    setSlugExists(exists)
                  })
              }
            }}
            placeholder={CyrillicToTranslit().transform(title, '-').toLowerCase().replaceAll('_', '-').replaceAll(/[^a-z0-9-]/g, '')}
            className='w-full font-text px-3 py-2 rounded-lg font-normal text-base text-text focus:outline-none'
            disabled={submitting || Boolean(router.query.edit)}
          />
          {slugExists !== null && (
            <span className='absolute right-3 bottom-3'>
              {slugExists ? (
                <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'><path fill='red' d='m12 13.4l2.9 2.9q.275.275.7.275t.7-.275t.275-.7t-.275-.7L13.4 12l2.9-2.9q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275L12 10.6L9.1 7.7q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7l2.9 2.9l-2.9 2.9q-.275.275-.275.7t.275.7t.7.275t.7-.275zm0 8.6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22'></path></svg>
              ) : (
                <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'><path fill='currentColor' d='m10.6 16.6l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22'></path></svg>
              )}
            </span>
          )}
        </div>
        <div className='w-[680px] max-w-full flex flex-col gap-2'>
          <span className='font-semibold'>{t('editor.excerpt')}:</span>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.currentTarget.value.replaceAll('\n', ''))}
            placeholder={t('editor.excerpt_placeholder')}
            className='w-full font-text px-3 py-2 rounded-lg font-normal text-base text-text focus:outline-none resize-none'
            rows={5}
            disabled={submitting}
          />
        </div>
        <div className='flex justify-between w-[680px] max-w-full'>
          <button className='bg-alt shadow-md border border-text rounded-full px-6 py-2 text-xl disabled:opacity-50' onClick={() => handleSave({ draft: true })} disabled={!banner || !title || !excerpt || !slug || submitting || readingTime === 0 || (slugExists !== false && initial === null)}>
            📝&nbsp;&nbsp;{t('editor.to_draft')}
          </button>
          <button className='bg-alt shadow-md border border-text rounded-full px-6 py-2 text-xl disabled:opacity-50' onClick={() => handleSave({ draft: false })} disabled={!banner || !title || !excerpt || !slug || submitting || readingTime === 0 || (slugExists !== false && initial === null)}>
            🚀&nbsp;&nbsp;{t('editor.post')}
          </button>
        </div>
      </div>
    </article>
  )
}