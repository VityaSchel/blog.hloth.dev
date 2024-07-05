import React from 'react'
import cx from 'classnames'

export function CloseMenuButton({ onClose }: {
  onClose: () => void
}) {
  const [hover, setHover] = React.useState(false)
  const [closing, setClosing] = React.useState(false)

  const handleClose = () => {
    setClosing(true)
    onClose()
  }

  return (
    <button 
      className='flex items-center'
      onClick={handleClose}
      onMouseEnter={() => {
        setHover(true)
        setClosing(false)
      }}
      onMouseLeave={() => setHover(false)}
    >
      <span className={cx('h-[2px] bg-white transition-all', {
        'w-0': !hover,
        'w-[270px]': hover,
        'duration-[390ms]': closing,
        'duration-200': !closing
      })} />
      <svg width='50' height='50' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
        <line x1='0' y1='50' x2='90' y2='50' stroke='currentColor' strokeWidth='4' />
        <line x1='70' y1='30' x2='90' y2='51' stroke='currentColor' strokeWidth='4' />
        <line x1='70' y1='70' x2='90' y2='49' stroke='currentColor' strokeWidth='4' />
      </svg>
    </button>
  )
}