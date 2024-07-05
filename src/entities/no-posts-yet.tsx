import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import noGif from '@/assets/no.gif'

export function NoPostsYet() {
  const { t } = useTranslation()

  return (
    <div className='w-full h-64 flex items-center justify-center text-[24.5px] flex-col gap-4'>
      <span className='font-text'>{t('no_posts_yet')}</span>
      <Image src={noGif} alt='🙂‍↔️' unoptimized />
    </div>
  )
}