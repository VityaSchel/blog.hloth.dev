export function formatTitle(title: string): { title: string, emphasized: string, regular: string } {
  const parts = title.split('*')
  if(parts[0] === '') {
    const emphasized = parts[1]
    const regular = parts.slice(2).join('*')
    return { title: emphasized + regular, emphasized, regular }
  } else {
    return { title, emphasized: '', regular: title }
  }
}