import React from 'react'
import { Roboto_Mono } from 'next/font/google'
import { useTranslation } from 'next-i18next'
import plural from 'plural-ru'
import cx from 'classnames'

const RobotoMono = Roboto_Mono({ weight: ['400'], subsets: ['cyrillic', 'latin'] })

export function ReadingTimer({ minutes, editable = false, onChange = () => {} }: {
  minutes: number
  editable?: boolean
  onChange?: (minutes: number) => void
}) {
  const { t } = useTranslation()

  const content = (
    <span className={cx(RobotoMono.className, 'uppercase text-sm text-alt')}>
      {minutes} {plural(minutes, t('read_time.0'), t('read_time.1'), t('read_time.2'))}
    </span>
  )

  const handleStartEditing = (e: React.MouseEvent) => {
    const startY = e.clientY
    const startX = e.clientY
    const handleMouseMove = (e: MouseEvent) => {
      const diff = Math.max(e.clientY - startY, e.clientX - startX)
      onChange(Math.min(Math.abs(Math.round(diff / 15)), 90))
    }
    const handleEndEditing = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEndEditing)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEndEditing)
  }

  if(editable) {
    return (
      <button onMouseDown={handleStartEditing} className='py-0.5'>
        {content}
      </button>
    )
  } else {
    return content
  }
}