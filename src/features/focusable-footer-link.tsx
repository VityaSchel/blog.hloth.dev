import React from 'react'
import Link from 'next/link'
import type { ComponentProps } from 'react'

export function FocusableFooterLink(props: ComponentProps<typeof Link>) {
  const linkRef = React.useRef<HTMLAnchorElement>(null)

  React.useEffect(() => {
    if (linkRef.current) {
      const linkRefCurrent = linkRef.current

      let isKeyboardNav = false
      const onKeyDown = (e: KeyboardEvent) => { if(e.key === 'Tab') isKeyboardNav = true }
      const onMouseDown = () => { isKeyboardNav = false }
      const onFocus = () => {
        if (isKeyboardNav) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
        }
      }

      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('mousedown', onMouseDown)
      linkRefCurrent.addEventListener('focus', onFocus)
      
      return () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('mousedown', onMouseDown)
        linkRefCurrent.removeEventListener('focus', onFocus)
      }
    }
  }, [linkRef])

  return (
    <Link 
      {...props}
      ref={linkRef}
    />
  )
}