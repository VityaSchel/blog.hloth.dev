import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

export function PostAvailableInAltLanguage() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <div className='flex-1 flex flex-col justify-center items-center gap-4'>
      <video playsInline autoPlay muted loop className='h-[200px] rounded-lg'>
        <source src='/cat-explodes.mp4' type='video/mp4' />
      </video>
      <p className='text-center text-gray-500'>{t('post_available_in_alt_language.text')} <Link href={router.asPath} locale={router.locale === 'ru' ? 'en' : 'ru'} className='font-bold'>{t('post_available_in_alt_language.link')}</Link></p>
    </div>
  )
}