import { Separator } from '@/shared/ui/separator'

export function Container({ children }: React.PropsWithChildren) {
  return (
    <main className='flex min-h-screen flex-col px-6 md:px-12 pt-6 md:pt-9 relative z-[1] bg-background'>
      {children}
      <Separator />
    </main>
  )
}