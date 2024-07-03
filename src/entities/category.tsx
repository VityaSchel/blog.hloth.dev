import { GeistMono } from 'geist/font/mono'
import { useTranslation } from 'next-i18next'
import cx from 'classnames'

export function Category({ children, className }: {
  children: string
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <span className={cx(className, GeistMono.className, 'uppercase tracking-wide border border-text rounded-md w-fit px-4 py-1.5 text-sm')}>
      {t(`categories.${children}`)}
    </span>
  )
}