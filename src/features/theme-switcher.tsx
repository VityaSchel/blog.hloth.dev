import React from 'react'
import cx from 'classnames'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

export function ThemeSwitch() {
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const [focused, setFocused] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <div className={cx('w-full flex items-center h-[2px]', {
      // 'h-[2px]': !open,
      // 'h-[24px]': open
    })}>
      <button
        type='button'
        className='w-full h-6'
        onFocus={() => {
          setOpen(true)
          setTimeout(() => setFocused(true), 1)
        }}
        onBlur={() => {
          focused && setOpen(false)
          setFocused(false)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => {
          setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
        }}
        onMouseUp={() => {
          try {
            (document.activeElement as HTMLElement)?.blur()
          } catch {0}
        }}
      >
        <div
          className={cx('w-full transition-all duration-75 theme-switch-bg relative  overflow-clip', {
            'h-[2px]': !open,
            'h-[24px] rounded-xl': open
          })}
          style={{
            backgroundPositionX: (new Date().getHours() / 24) * 33.333 + '%'
          }}
        >
          <div 
            className={cx('w-full h-full theme-switch-bg-open absolute top-0 left-0 transition-opacity', {
              'opacity-100': open,
              'opacity-0': !open
            })}
            style={{
              backgroundPositionX: (new Date().getHours() / 24) * 33.333 + '%'
            }}
          >
            {!mounted ? null : (<>
              {resolvedTheme === 'light' && <span className='text-background text-sm translate-y-[1.5px] block'>{t('switch_theme.dark')}</span>}
              {resolvedTheme === 'dark' && <span className='text-background text-sm translate-y-[1.5px] block'>{t('switch_theme.light')}</span>}
            </>)}
          </div>
        </div>
      </button>
    </div>
  )
}