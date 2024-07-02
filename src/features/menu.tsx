import { useTranslation } from 'next-i18next'

export function Menu() {
  const { t } = useTranslation('common')

  return (
    <button className='bg-black rounded-full text-white pt-[4px] pb-[3px] w-[83.16px]'>
      {t('menu.button')}
    </button>
  )
}