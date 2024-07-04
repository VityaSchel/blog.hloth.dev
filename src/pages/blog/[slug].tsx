import type { PostFullProps } from '@/shared/model/post'
import { AppBar } from '@/widgets/common/appbar'
import { Container } from '@/widgets/common/container'
import { Post } from '@/widgets/post/post'
import type { GetServerSidePropsResult } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { getPlaiceholder } from 'plaiceholder'
import { useTranslation } from 'next-i18next'

type BlogPageProps = {
  post: PostFullProps
  nextPost: { title: string, slug: string }
}

export default function BlogPage(props: BlogPageProps) {
  const post = { ...props.post, date: new Date(props.post.createdAt) }
  const { t } = useTranslation()

  return (
    <Container>
      <AppBar
        previous={{ title: t('go_to_main_page'), path: '/' }}
        next={{ title: props.nextPost.title, path: '/blog/' + props.nextPost.slug }}
      />
      <Post {...post} />
    </Container>
  )
}

export async function getServerSideProps({ locale }: { locale: string }): Promise<GetServerSidePropsResult<BlogPageProps>> {
  return {
    props: {
      ...await serverSideTranslations(locale),
      post: {
        slug: 'hello-world',
        title: 'Design trends 2024 are finally here',
        excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        createdAt: Date.now() - 86400000,
        banner: {
          src: 'https://images.unsplash.com/photo-1621961458348-f013d219b50c',
          placeholder: (
            await getPlaiceholder(
              Buffer.from(await (
                await fetch('https://images.unsplash.com/photo-1621961458348-f013d219b50c')
              ).arrayBuffer())
            )
          ).base64,
          alt: 'Hello, World!'
        },
        category: 'tutorial',
        readingTime: 4,
        content: {
          'time': 1720094011578,
          'blocks': [
            {
              'id': 'cmyFYdYe4d',
              'type': 'paragraph',
              'data': {
                'text': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum blandit rhoncus lorem in dictum. Vivamus vulputate id lacus interdum ullamcorper. Sed ipsum risus, semper sit amet condimentum eget, aliquam nec metus. Nulla lobortis mi in scelerisque tempus. Nunc at purus justo. Morbi quis enim volutpat diam pharetra molestie a ut diam. Maecenas ac interdum est.'
              }
            },
            {
              'id': 'yBP1UpP_gy',
              'type': 'header',
              'data': {
                'text': 'Lorem Ipsum',
                'level': 2
              }
            },
            {
              'id': 'GJAYq4rBlk',
              'type': 'paragraph',
              'data': {
                'text': '<b>Quisque quis condimentum neque</b>. Donec a ipsum sem. Etiam tristique lectus massa, ut malesuada elit sodales sit amet. Sed eu pulvinar mauris. Quisque sollicitudin, leo eget pharetra euismod, mauris turpis aliquam ante, nec gravida lorem quam ac urna. Nulla blandit mollis rhoncus. <i>Pellentesque ac posuere nulla. Suspendisse ornare augue ac ante blandit, non molestie nibh pulvinar. Integer suscipit lacus massa, a porta orci vulputate eu. </i>'
              }
            },
            {
              'id': 'kgd4abYXOu',
              'type': 'paragraph',
              'data': {
                'text': 'Curabitur ac nisl in ex accumsan gravida eu et nisl. Etiam et ante accumsan, scelerisque diam ac, rutrum odio. Nam ac faucibus risus, id rutrum nisi. Ut egestas sed mi ut venenatis. Vivamus ante libero, tincidunt ut massa quis, condimentum placerat purus. Nullam molestie justo vitae pulvinar iaculis. Maecenas sagittis efficitur lorem et porttitor.'
              }
            },
            {
              'id': '5ENyi080Tw',
              'type': 'image',
              'data': {
                'file': {
                  'url': '/147239d0-eae9-4ffe-ab8b-2e1cdb4ad35b.png',
                  'placeholder': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAACXBIWXMAABYlAAAWJQFJUiTwAAAALUlEQVR4nAEiAN3/AJv///+W/bX/l9Z2/5n1n/8AGHaA/wALNf8xhWL/AFBx/4JXFBF/tuiEAAAAAElFTkSuQmCC',
                  width: 1660,
                  height: 778
                },
                'caption': 'Image by Simon Lee / <b>Unsplash</b>',
                'withBorder': false,
                'stretched': true,
                'withBackground': false
              }
            },
            {
              'id': 'KfoTN96rBi',
              'type': 'header',
              'data': {
                'text': 'Neque porro quisquam',
                'level': 3
              }
            },
            {
              'id': 'h0BEDkmYgP',
              'type': 'quote',
              'data': {
                'text': 'The planet is going to run out of resources and we are going to have to find a way to feed our ever-growing population',
                'caption': 'Phasellus nec purus enim',
                'alignment': 'left'
              }
            },
            {
              'id': 'pIz-6NgFjW',
              'type': 'paragraph',
              'data': {
                'text': 'In vitae turpis nisl. Etiam quis metus fermentum, lobortis lorem in, dapibus ante. In lacinia aliquet nulla eu maximus.'
              }
            },
            {
              'id': 'Bb1UU_CdEq',
              'type': 'delimiter',
              'data': {}
            },
            {
              'id': 'I-REFoWTL9',
              'type': 'paragraph',
              'data': {
                'text': 'Aliquam sollicitudin, sapien a tempor posuere, risus diam vestibulum urna, ac viverra orci ipsum at justo. <a href="https://example.org">Nulla blandit</a>, leo eget egestas tincidunt, orci ex commodo tortor, at pellentesque massa elit a quam. Donec a gravida nulla, ac rutrum purus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.'
              }
            },
            {
              'id': 'tI4AzG6DHN',
              'type': 'code',
              'data': {
                'code': "import dynamic from 'next/dynamic'\nimport CyrillicToTranslit from 'cyrillic-to-translit-js'\nimport type { EditorRef } from '@/features/article-editor/index'\n\nconst ArticleEditor = dynamic(() => \n  import('@/features/article-editor/index').then(mod => mod.ArticleEditor),\n  {\n    loading: () => <p className='text-center w-full text-xl'>✏️</p>,\n    ssr: false\n  }\n)",
                'language-code': 'tsx'
              }
            },
            {
              'id': 'yT1I9mV0LR',
              'type': 'header',
              'data': {
                'text': 'Lorem Ipsum',
                'level': 4
              }
            },
            {
              'id': 'EBUZ9Qhy8b',
              'type': 'list',
              'data': {
                'style': 'ordered',
                'items': [
                  'Lorem',
                  'Ipsum',
                  'dolor',
                  'sit',
                  'amet'
                ]
              }
            },
            {
              'id': 'xO6rVQuDXK',
              'type': 'list',
              'data': {
                'style': 'unordered',
                'items': [
                  'Vivamus ante libero<br>',
                  'tincidunt ut massa quis<br>',
                  'condimentum placerat purus<br>'
                ]
              }
            },
            {
              'id': '2g93JqS8fy',
              'type': 'image',
              'data': {
                'file': {
                  'url': '/c8c3037d-b83c-414c-850e-95ecc4f015f2.png',
                  'placeholder': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAT0lEQVR4nAFEALv/AEMtHv9UQDH/PCge/1IyIv8AHQAA/8ixmP+We2//hVE+/wBeRjL/fl1I/8CbhP//8tb/APvWtv+wjG7/ropx//LQsP9QgiYZbx0V9wAAAABJRU5ErkJggg==',
                  width: 326,
                  height: 334
                },
                'caption': '',
                'withBorder': false,
                'stretched': false,
                'withBackground': true
              }
            }
          ],
          'version': '2.29.1'
        }
      },
      nextPost: {
        title: 'How to make a perfect cup of coffee',
        slug: 'how-to-make-a-perfect-cup-of-coffee'
      }
    },
  }
}