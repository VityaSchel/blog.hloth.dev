import React from 'react'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useRouter } from 'next/router'

export function FocusableFooterLink(props: ComponentProps<typeof Link>) {
  const linkRef = React.useRef<HTMLAnchorElement>(null)
  const router = useRouter()

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

  const handleClick = () => {
    const onRouteChangeComplete = () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
    router.events.on('routeChangeComplete', onRouteChangeComplete)
  }

  return (
    <Link 
      {...props}
      ref={linkRef}
      scroll={false}
      onClick={handleClick}
    />
  )
}