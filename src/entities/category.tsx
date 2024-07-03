import { Roboto_Mono } from 'next/font/google'
import { useTranslation } from 'next-i18next'
import cx from 'classnames'

const RobotoMono = Roboto_Mono({ weight: ['400'], subsets: ['cyrillic', 'latin'] })

export function Category({ children, className }: {
  children: string
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <span className={cx(className, RobotoMono.className, 'uppercase tracking-wide border border-text rounded-md w-fit px-3 py-1.5 text-xs')}>
      {t(`categories.${children}`)}
    </span>
  )
}