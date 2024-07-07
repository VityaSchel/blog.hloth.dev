import cx from 'classnames'
import { LanguageSwitch } from '@/features/language-switch'
import { ThemeSwitch } from '@/features/theme-switcher'
import { Menu } from '@/features/menu'
import { formatTitle } from '@/shared/title'

export function AppBar({ previous, next }: {
  previous?: { title: string, path: string },
  next?: { title: string, path: string }
}) {
  return (
    <header className='flex flex-col w-full gap-[12px]'>
      {(previous || next) && (
        <nav>
          <ul className={cx('flex md:flex-row flex-col', {
            'justify-end': !previous,
            'justify-start': !next,
            'justify-between': previous && next
          })}>
            {previous && (
              <li>
                <a href={previous.path} className='flex items-center gap-2'>
                  <svg width='20' viewBox='0 0 100 60' xmlns='http://www.w3.org/2000/svg'>
                    <line x1='10' y1='50' x2='90' y2='50' stroke='currentColor' strokeWidth='6' />
                    <line x1='10' y1='50' x2='30' y2='30' stroke='currentColor' strokeWidth='6' />
                  </svg>
                  
                  {formatTitle(previous.title).title}
                </a>
              </li>
            )}
            {next && (
              <li className='self-end'>
                <a href={next.path} className='flex items-center gap-2'>
                  {formatTitle(next.title).title}

                  <svg width='20' viewBox='0 0 100 60' xmlns='http://www.w3.org/2000/svg'>
                    <line x1='10' y1='50' x2='90' y2='50' stroke='currentColor' strokeWidth='6' />
                    <line x1='70' y1='30' x2='90' y2='50' stroke='currentColor' strokeWidth='6' />
                  </svg>
                </a>
              </li>
            )}
          </ul>
        </nav>
      )}
      <ThemeSwitch />
      <div className='flex justify-between w-full'>
        <LanguageSwitch />
        <Menu />
      </div>
    </header>
  )
}