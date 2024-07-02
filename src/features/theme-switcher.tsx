import React from 'react'
import cx from 'classnames'

export function ThemeSwitch() {
  const [open, setOpen] = React.useState(false)
  
  return (
    <button type="button" className={cx('w-full bg-black', {
      'h-[2px]': !open,
      'h-[24px]': open
    })}>
      
    </button>
  )
}