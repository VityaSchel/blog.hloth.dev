import React from 'react'
import cx from 'classnames'

export function BannerUploader({ value, onChange, alt, altOnChange, disabled, bannerAltShow }: {
  value: string
  onChange: (banner: { src: string, placeholder: string, width: number, height: number }) => void
  alt: string
  altOnChange: (alt: string) => void
  disabled: boolean
  bannerAltShow: boolean
}) {
  const [banner, setBanner] = React.useState(value)
  const [progress, setProgress] = React.useState(0)
  const [uploading, setUploading] = React.useState(false)

  const bannerFileSelectorRef = React.useRef<HTMLInputElement>(null)
  const handleUploadBanner = () => {
    bannerFileSelectorRef.current?.click()
  }
  const uploadBanner = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setBanner(reader.result as string)
      }
      reader.readAsDataURL(file)

      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      setProgress(0)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload-image')
      xhr.upload.onprogress = (event) => {
        setProgress(event.loaded / event.total)
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          onChange({
            src: response.file.url,
            placeholder: response.file.placeholder,
            width: response.file.width,
            height: response.file.height
          })
        } else {
          setBanner('')
          bannerFileSelectorRef.current!.value = ''
        }
        setUploading(false)
      }
      xhr.send(formData)
    }
  }

  React.useEffect(() => {
    setBanner(value)
  }, [value])

  return (
    <div
      className='rounded-[60px] relative aspect-[1.625/1] flex-[40%] max-w-[40%] overflow-clip'
    >
      <button 
        className='bg-transparent w-full h-full absolute top-0 left-0 focus-visible:outline-2 rounded-[60px] z-10'
        disabled={disabled}
        onClick={handleUploadBanner}
      />
      <input
        type='file'
        accept='image/*'
        onChange={uploadBanner}
        className='hidden'
        ref={bannerFileSelectorRef}
        tabIndex={-1}
      />
      {banner ? (<>
        <img src={banner} className='w-full h-full object-cover' />
        <input 
          type='text' 
          className={cx('absolute bottom-2 left-14 right-14 shadow-lg rounded-md p-2 hover opacity-0 hover:opacity-100 transition-opacity border border-text focus:outline-none focus:opacity-100 z-10', {
            'opacity-100': bannerAltShow
          })}
          onClick={(event) => event.stopPropagation()}
          placeholder='[alt]'
          value={alt}
          onChange={(event) => altOnChange(event.currentTarget.value)}
          maxLength={1024}
        />
      </>
      ) : (
        <div className='bg-placeholder w-full h-full' />
      )}
      <div
        className={cx('h-[4px] bg-blue-700 z-10 absolute bottom-0 left-0 transition-opacity', {
          'opacity-1': uploading,
          'opacity-0': !uploading
        })}
        style={{ width: ((progress / 0.8) + 0.1) * 100 + '%' } as React.CSSProperties}
      />
    </div>
  )
}