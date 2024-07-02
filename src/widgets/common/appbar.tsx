import cx from 'classnames'
import { LanguageSwitch } from '@/features/language-switch'
import { ThemeSwitch } from '@/features/theme-switcher'
import { Menu } from '@/features/menu'

export function AppBar({ previous, next }: {
  previous?: { title: string, slug: string },
  next?: { title: string, slug: string }
}) {
  return (
    <header className='flex flex-col w-full gap-[12px]'>
      {(previous || next) && (
        <nav>
          <ul className={cx('flex', {
            'justify-end': !previous,
            'justify-start': !next,
            'justify-between': previous && next
          })}>
            {previous && (
              <li>
                <a href={`/blog/${previous.slug}`}>&larr; {previous.title}</a>
              </li>
            )}
            {next && (
              <li>
                <a href={`/blog/${next.slug}`}>{next.title} &rarr;</a>
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