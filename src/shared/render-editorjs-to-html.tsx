import React from 'react'
import type { OutputBlockData, OutputData } from '@editorjs/editorjs'
import Image from 'next/image'
import { Highlight, themes } from 'prism-react-renderer'
import cx from 'classnames'

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
        'bg-white flex items-center justify-center p-4 h-[500px]': withBackground,
        'h-full': !withBackground
      })}>
        <div className={cx('relative', {
          'shadow-xl w-fit h-full': withBackground
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
      default:
        return null
    }
  })
}