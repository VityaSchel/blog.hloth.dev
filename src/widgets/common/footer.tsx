import { categories } from '@/shared/model/category'
import Link from 'next/link'
import React from 'react'
import { useTranslation } from 'next-i18next'

export function Footer() {
  const { t } = useTranslation()

  React.useEffect(() => {
    const onScroll = () => {
      if(window.scrollY + window.innerHeight >= Math.max(document.body.scrollHeight - 200, 1)) {
        window.document.body.classList.add('no-overscroll')
      } else {
        window.document.body.classList.remove('no-overscroll')
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <footer className='bg-text w-full text-inverted sticky z-0 bottom-0 p-12 font-display'>
      <div className='flex items-end'>
        <div className='flex flex-col gap-1.5 font-medium text-3xl w-24 flex-[25%] max-w-[25%] pr-4'>
          {categories.map((category) => (
            <Link 
              href={'/?category=' + category + '#posts'}
              shallow={true}
              key={category}
              className='w-fit'
            >
              {t(`categories.${category}`)}
            </Link>
          ))}
        </div>
        <div className='flex-1 flex flex-col gap-1 px-4'>
          <Link href='https://github.com/VityaSchel' className='font-medium w-fit'>GitHub</Link>
          <Link href='https://instagram.com/vityaczech' className='font-medium w-fit'>Instagram</Link>
          <Link href='https://t.me/hlothdev' className='font-medium w-fit'>Telegram</Link>
          <Link href='https://www.linkedin.com/in/hloth/' className='font-medium w-fit'>Linkedin</Link>
        </div>
        <div className='flex flex-col items-end justify-end gap-1 text-right'>
          <span className='text-xs font-medium'>{t('footer.contact_me')}:</span>
          <span className='text-xs font-medium'>hi@hloth.dev</span>
          <span className='text-xs font-medium'>jobs@hloth.dev</span>
        </div>
      </div>
      <hr className='w-full h-[2px] border-none bg-inverted mt-[41px]' />
      <div className='flex justify-between'>
        <span className='mt-3 block font-medium'>/2024</span>
        <span className='mt-3 block text-sm text-[var(--text-inverted-alt)]'>Licensed with CC0 (Public domain)</span>
      </div>
    </footer>
  )
}