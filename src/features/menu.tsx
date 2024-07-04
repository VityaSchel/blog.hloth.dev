import React from 'react'
import { useTranslation } from 'next-i18next'
import cx from 'classnames'
import Link from 'next/link'
import { useHotkeys } from 'react-hotkeys-hook'
import { CloseMenuButton } from '@/entities/close-menu-button'
import FocusTrap from 'focus-trap-react'

export function Menu() {
  const { t } = useTranslation('common')
  const [open, setOpen] = React.useState(false)
  useHotkeys('esc', () => open && setOpen(false), [open])

  React.useEffect(() => {
    if(open) {
      document.body.classList.add('menu-open')
    } else {
      document.body.classList.remove('menu-open')
    }
  }, [open])

  return (
    <>
      <button 
        className='bg-[var(--menu-bg)] rounded-full text-inverted pt-[3px] pb-[2px] w-[84px] text-[14px] tracking-[-.03em]'
        onClick={() => setOpen(!open)}
      >
        {t('menu.button')}
      </button>
      <FocusTrap active={open}>
        <div 
          className={cx('fixed w-full h-full top-0 left-0 z-10 transition-blur', {
            'pointer-events-none': !open
          })} 
          style={{ '--blur': open ? '20px' : '0px' } as React.CSSProperties}
          onClick={(e) => {
            if(e.target !== e.currentTarget) return
            setOpen(false)
          }}
        >
          <div className={cx('bg-black text-white w-96 h-full right-0 absolute transition-transform duration-500 menu-bg flex flex-col gap-4 p-8 font-display text-4xl font-bold', {
            'transform translate-x-full': !open,
            'transform-none': open
          })}>
            <CloseMenuButton
              onClose={() => setOpen(false)}
            />
            <Link href='https://hloth.dev/me' className='hover:text-neutral-300 transition-all hover:tracking-wide'>
              {t('menu.about_me')}
            </Link>
            <Link href='https://hloth.dev/portfolio' className='hover:text-neutral-300 transition-all hover:tracking-wide'>
              {t('menu.my_portfolio')}
            </Link>
            <div className='mt-auto flex items-center justify-between text-sm text-gray leading-none'>
              <span className='font-medium'>{t('menu.contact')}:</span>
              <span className='font-normal'>hi@hloth.dev</span>
            </div>
          </div>
        </div>
      </FocusTrap>
    </>
  )
}