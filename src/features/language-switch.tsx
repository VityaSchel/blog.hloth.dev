import { useTranslation } from 'next-i18next'
import cx from 'classnames'

export function LanguageSwitch() {
  const { i18n } = useTranslation()

  const handleSwitchLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru')
  }

  return (
    <button
      type='button'
      className='px-2 py-[4px] w-44 bg-alt rounded-full flex gap-1 relative'
      onClick={handleSwitchLanguage}
    >
      <span className={cx('transition-all block flex-1 relative z-10', {
        'font-bold': i18n.language === 'ru'
      })}>
        Русский
      </span>
      <span className={cx('transition-all block flex-1 relative z-10', {
        'font-bold': i18n.language !== 'ru'
      })}>
        English
      </span>
      <span 
        className={cx('bg-amber-100 bg-opacity-30 w-[50%] h-[calc(100%-8px)] rounded-full absolute top-1 left-1 border border-white border-opacity-30 shadow-md transition-all', {
          'left-[calc(50%-4px)]': i18n.language !== 'ru'
        })}
      />
    </button>
  )
}