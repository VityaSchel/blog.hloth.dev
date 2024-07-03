import { useTranslation } from 'next-i18next'

export function Menu() {
  const { t } = useTranslation('common')

  return (
    <button className='bg-[var(--menu-bg)] rounded-full text-inverted pt-[3px] pb-[2px] w-[84px] text-[14px] tracking-[-.03em]'>
      {t('menu.button')}
    </button>
  )
}