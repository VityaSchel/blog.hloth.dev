import cx from 'classnames'
import { useRouter } from 'next/router'

export function LanguageSwitch() {
  const { locale } = useRouter()
  const router = useRouter()

  const handleSwitchLanguage = () => {
    const urlNoHash = router.asPath.split('#')[0]
    router.push({
      pathname: router.pathname,
      query: router.query
    }, urlNoHash, { 
      locale: locale === 'ru' ? 'en' : 'ru'
    })
  }

  return (
    <button
      type='button'
      className='px-2 py-[4px] w-44 bg-alt rounded-full flex gap-1 relative tracking-tight'
      onClick={handleSwitchLanguage}
    >
      <span className={cx('transition-[font-weight] block flex-1 relative z-10', {
        'font-bold': locale === 'ru'
      })}>
        Русский
      </span>
      <span className={cx('transition-[font-weight] block flex-1 relative z-10', {
        'font-bold': locale !== 'ru'
      })}>
        English
      </span>
      <span 
        className={cx('bg-amber-100 bg-opacity-30 w-[50%] h-[calc(100%-8px)] rounded-full absolute top-1 left-1 border border-white border-opacity-30 shadow-md transition-all', {
          'left-[calc(50%-4px)]': locale !== 'ru'
        })}
      />
    </button>
  )
}