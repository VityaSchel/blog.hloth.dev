import { GeistMono } from 'geist/font/mono'
import { useTranslation } from 'next-i18next'
import plural from 'plural-ru'
import cx from 'classnames'

export function ReadingTimer({ minutes }: {
  minutes: number
}) {
  const { t } = useTranslation()

  return (
    <span className={cx(GeistMono.className, 'uppercase')}>
      {minutes} {plural(minutes, t('read_time.0'), t('read_time.1'), t('read_time.2'))}
    </span>
  )
}