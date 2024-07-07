import styles from './styles.module.scss'
import type { OutputData } from '@editorjs/editorjs'
import { renderEditorjsToHTML } from '@/shared/render-editorjs-to-html'
import cx from 'classnames'

export function ArticleContentRenderer({ content }: {
  content: OutputData
}) {
  return (
    <div className='flex justify-center w-full'>
      <div className={cx('w-[560px] max-w-full [&>div]:w-full', styles.articleContent)}>
        {renderEditorjsToHTML(content)}
      </div>
    </div>
  )
}