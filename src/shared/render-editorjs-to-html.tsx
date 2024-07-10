import React from 'react'
import type { OutputBlockData, OutputData } from '@editorjs/editorjs'
import Image from 'next/image'
import { Highlight, themes } from 'prism-react-renderer'
import cx from 'classnames'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'

const ParagraphRenderer = (block: OutputBlockData): React.ReactNode => {
  return (
    <p key={block.id} dangerouslySetInnerHTML={{ __html: block.data.text }} />
  )
}

const HeaderRenderer = (block: OutputBlockData): React.ReactNode => {
  const Tag = 'h' + block.data.level
  return (
    <React.Fragment key={block.id}>
      <a id={block.data.text.toLowerCase().replace(/\s/g, '-')} />
      {/* @ts-expect-error level is a number */}
      <Tag>{block.data.text}</Tag>
    </React.Fragment>
  )
}

const ImageRenderer = (block: OutputBlockData): React.ReactNode => {
  const { file, caption, withBorder, withBackground } = block.data
  const stretched = !withBackground
  return (
    <figure key={block.id}>
      <div className={cx('rounded-lg overflow-clip w-full', {
        'border': withBorder,
        'bg-white flex items-center justify-center p-4 h-fit max-h-[500px]': withBackground,
        'h-full': !withBackground
      })}>
        <div className={cx('relative', {
          'shadow-xl w-fit h-auto': withBackground
        })} style={{ aspectRatio: file.width / file.height }}>
          <Image 
            src={file.url}
            placeholder='blur'
            blurDataURL={file.placeholder}
            alt={caption}
            fill={stretched}
            width={stretched ? undefined : file.width}
            height={stretched ? undefined : file.height}
            quality={100}
            sizes='(max-width: 608px) 100vw, 560px'
          />
        </div>
      </div>
      <figcaption dangerouslySetInnerHTML={{ __html: caption }} />
    </figure>
  )
}

const QuoteRenderer = (block: OutputBlockData): React.ReactNode => {
  return (
    <blockquote key={block.id}>
      <p>{block.data.text}</p>
      <footer>— {block.data.caption}</footer>
    </blockquote>
  )
}

const DelimiterRenderer = (block: OutputBlockData): React.ReactNode => {
  return (
    <hr key={block.id} className='my-[32px] w-full h-[1px] bg-text border-none' />
  )
}

const CodeRenderer = (block: OutputBlockData): React.ReactNode => {
  return (
    <Highlight
      theme={themes.vsDark}
      code={block.data.code}
      language={(block.data.languageCode ?? block.data['language-code']).substring('language-'.length)}
      key={block.id}
    >
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <code style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span>{i + 1}</span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </code>
      )}
    </Highlight>
  )
}

const PaywallRenderer = (block: OutputBlockData): React.ReactNode => {
  const [shown, setShown] = React.useState(false)
  const { t } = useTranslation()

  const mangle = (text: string) => {
    const chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    const mangled = text.split('').map(() => {
      const randChar = chars[Math.floor(Math.random() * chars.length)]
      if (Math.random() > 0.5) return randChar.toUpperCase()
      else return randChar
    }).join('')
    return mangled
  }

  return (
    <React.Fragment key={block.id}>
      <h6>{t('paywall.title')}</h6>
      <div className={cx('rounded-lg relative w-full flex items-center overflow-clip mt-2 font-text', {
        'bg-slate-600 min-h-[128px]': !shown,
        'bg-alt': shown
      })}>
        {!shown && <div className='flex flex-col gap-1 items-center justify-center backdrop-blur-sm w-full h-full rounded-lg absolute top-0 left-0 p-4 z-[1]'>
          <span className='font-bold text-white text-center'>{t('paywall.cta')}</span>
          <span className='text-xs leading-[1.2] text-center mb-2 text-slate-300 font-medium tracking-tight'>{t('paywall.explanation')}</span>
          <Link 
            href='https://hloth.dev/donate' 
            target='_blank' 
            rel='nofollow noreferrer' 
            className='rounded-md bg-blue-600 !no-underline text-white font-bold px-4 py-2' 
            onClick={() => setShown(true)}
          >
            {t('paywall.button')}
          </Link>
        </div>}
        <ol className='flex flex-col gap-3 p-4 !ps-10 !m-0 w-full'>
          {block.data.links.map((link: { url: string, title: string }, i: number) => (<>
            <li key={i} className='pl-2 w-full'>
              <div className='flex flex-col break-words w-full'>
                <span className='text-alt text-base'>{link.title}</span>
                {shown ? (
                  <Link href={link.url} target='_blank' rel='noreferrer nofollow' className='text-sm font-mono font-medium'>{link.url}</Link>
                ) : (
                  <span className='underline text-sm font-mono font-medium'>{mangle(link.url)}</span>
                )}
              </div>
            </li>
            {i !== block.data.links.length - 1 && <hr className='w-full h-[1px] bg-gray border-none' />}
          </>))}
        </ol>
      </div>
    </React.Fragment>
  )
}

const ListRenderer = (block: OutputBlockData): React.ReactNode => {
  if(block.data.style === 'ordered') {
    return (
      <ol key={block.id}>
        {block.data.items.map((item: string, i: number) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ol>
    )
  } else {
    return (
      <ul key={block.id}>
        {block.data.items.map((item: string, i: number) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ul>
    )
  }
}

export function renderEditorjsToHTML(data: OutputData): React.ReactNode[] {
  return data.blocks.map(block => {
    switch(block.type) {
      case 'header':
        return HeaderRenderer(block)
      case 'paragraph':
        return ParagraphRenderer(block)
      case 'image':
        return ImageRenderer(block)
      case 'quote':
        return QuoteRenderer(block)
      case 'delimiter':
        return DelimiterRenderer(block)
      case 'code':
        return CodeRenderer(block)
      case 'list':
        return ListRenderer(block)
      case 'paywall':
        return PaywallRenderer(block)
      default:
        return null
    }
  })
}