import React from 'react'
import { createReactEditorJS } from 'react-editor-js'
import { useTranslation } from 'next-i18next'
import { EDITOR_JS_TOOLS } from './tools'
import { i18n } from './i18n'
import type { EditorCore } from '@/shared/model/core'
import type { OutputData } from '@editorjs/editorjs'

const ReactEditorJS = createReactEditorJS()

export type EditorRef = { save: () => Promise<OutputData> }

export function ArticleEditor({ defaultValue, innerRef }: {
  defaultValue: EditorJS.EditorConfig['data']
  innerRef: React.Ref<EditorRef>
}) {
  const { t } = useTranslation()
  const editorRef = React.useRef<EditorCore | null>(null)

  React.useImperativeHandle(innerRef, () => ({
    async save() {
      return await editorRef.current!.save()
    }
  }), [editorRef])

  return (
    <div className='flex justify-center w-full'>
      <div className='w-full [&>div]:w-full font-text font-normal article-content'>
        <ReactEditorJS
          defaultValue={defaultValue}
          tools={EDITOR_JS_TOOLS}
          minHeight={300}
          placeholder={t('editor.content')}
          i18n={i18n}
          onInitialize={(editor: EditorCore) => {
            editorRef.current = editor
          }}
        />
      </div>
    </div>
  )
}