import React from 'react'
import cx from 'classnames'

export function PageViewCounter({ page }: {
  page: string
}) {
  const [views, setViews] = React.useState<null | number>(null)

  React.useEffect(() => {
    const fetchViews = async () => {
      const res = await fetch('/api/page-views?' + new URLSearchParams({ page }))
      if(res.ok) {
        const { count } = await res.json() as { count: number }
        setViews(count)
      }
    }
    
    if(window.localStorage.getItem('is-hloth-blog-admin') === 'true') {
      fetchViews()
    }
  }, [page])

  React.useEffect(() => {
    fetch('/api/page-views', { 
      method: 'POST', 
      body: JSON.stringify({
        pageKey: page
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }, [page])

  return (
    <div className={cx('flex gap-1 items-center tabular-nums text-gray font-display font-normal', {
      'hidden': views === null,
      'block': views !== null,
    })}>
      <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'><path fill='currentColor' d='M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5'></path></svg> {views}
    </div>
  )
}