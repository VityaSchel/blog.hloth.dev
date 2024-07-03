import { createReactEditorJS } from 'react-editor-js'
import { useTranslation } from 'next-i18next'
import { EDITOR_JS_TOOLS } from './tools'
import { i18n } from './i18n'

const ReactEditorJS = createReactEditorJS()

export function ArticleEditor({ defaultValue }: {
  defaultValue?: EditorJS.EditorConfig['data']
}) {
  const { t } = useTranslation()

  return (
    <div className='flex justify-center w-full'>
      <div className='w-[760px] max-w-full [&>div]:w-full font-text font-normal article-content'>
        <ReactEditorJS 
          defaultValue={defaultValue}
          tools={EDITOR_JS_TOOLS}
          minHeight={300}
          placeholder={t('editor.content')}
          i18n={i18n}
        />
      </div>
    </div>
  )
}