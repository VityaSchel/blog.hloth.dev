import { produce } from 'immer'

type Link = { url: string, title: string }

export default class DonationPaywallTool {
  private api: any
  private data: { links: Link[] }
  private wrapper: HTMLElement | null

  constructor({ data, api }: { data: { links: Link[] }; api: any }) {
    this.api = api
    this.data = (data && 'links' in data) ? data : {
      links: [{ url: '', title: '' }]
    }
    this.wrapper = null
  }

  static get toolbox() {
    return {
      title: 'Donation Paywall',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="-3 -3 30 30"><path fill="currentColor" d="M16 12c2.76 0 5-2.24 5-5s-2.24-5-5-5s-5 2.24-5 5s2.24 5 5 5m5.45 5.6c-.39-.4-.88-.6-1.45-.6h-7l-2.08-.73l.33-.94L13 16h2.8c.35 0 .63-.14.86-.37s.34-.51.34-.82c0-.54-.26-.91-.78-1.12L8.95 11H7v9l7 2l8.03-3c.01-.53-.19-1-.58-1.4M5 11H.984v11H5z"/></svg>'
    }
  }

  render() {
    const wrapper = document.createElement('div')
    this.wrapper = wrapper
    wrapper.className = 'flex flex-col gap-1'
    
    const addButtonContainer = document.createElement('div')
    const addButton = document.createElement('button')
    addButton.className = 'w-fit px-2 py-1 mt-2 rounded-full bg-blue-500 text-white text-sm'
    addButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13H6q-.425 0-.712-.288T5 12t.288-.712T6 11h5V6q0-.425.288-.712T12 5t.713.288T13 6v5h5q.425 0 .713.288T19 12t-.288.713T18 13h-5v5q0 .425-.288.713T12 19t-.712-.288T11 18z"/></svg>'
    addButton.addEventListener('click', () => {
      this.data.links = produce(this.data.links, draft => { draft.push({ url: '', title: '' }) })
      createInput({ url: '', title: '' }, this.data.links.length - 1)
    })
    addButtonContainer.appendChild(addButton)
    const paywallSpan = document.createElement('span')
    paywallSpan.className = 'text-sm text-gray flex items-center gap-1 pointer-events-none select-none'
    paywallSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M13 21H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h10"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 0 0-2 0m-3-5V7a4 4 0 1 1 8 0v4m5 4h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3H17m2 0v1m0-8v1"/></g></svg> Paywall'
    addButtonContainer.appendChild(paywallSpan)
    addButtonContainer.className = 'flex justify-between items-center w-full'

    this.wrapper.appendChild(addButtonContainer)

    const createInput = (value: Link, i: number) => {
      const linkContainer = document.createElement('div')
      linkContainer.className = 'flex gap-2'

      const titleInput = document.createElement('input')
      titleInput.type = 'text'
      titleInput.value = value.title
      titleInput.className = 'w-full px-3 py-2 rounded-md font-normal font-text tracking-[normal]'
      titleInput.placeholder = i === 0 ? 'Mentioned page' : i === 1 ? 'Project files' : 'Secret information'
      titleInput.addEventListener('input', (event: Event) => {
        const target = event.target as HTMLInputElement
        this.data.links = produce(this.data.links, (draft: Link[]) => {
          draft[i].title = target.value
        })
      })

      const linkInput = document.createElement('input')
      linkInput.type = 'text'
      linkInput.value = value.url
      linkInput.className = 'w-full px-3 py-2 rounded-md font-normal font-text tracking-[normal]'
      linkInput.placeholder = i === 0 ? 'https://example.com/page' : i === 1 ? 'https://example.com/file.zip' : 'Some text'
      linkInput.addEventListener('input', (event: Event) => {
        const target = event.target as HTMLInputElement
        this.data.links = produce(this.data.links, (draft: Link[]) => {
          draft[i].url = target.value
        })
      })

      linkContainer.appendChild(titleInput)
      linkContainer.appendChild(linkInput)

      wrapper.insertBefore(linkContainer, addButtonContainer)
    }

    for(let i = 0; i < this.data.links.length; i++) {
      const value = this.data.links[i]
      createInput(value, i)
    }

    return this.wrapper
  }

  save() {
    return {
      links: this.data.links
    }
  }
}
