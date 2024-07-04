import Telegram from '@/assets/social-media-icons/telegram.svg'
import Facebook from '@/assets/social-media-icons/facebook.svg'
import LinkedIn from '@/assets/social-media-icons/linkedin.svg'
import Twitter from '@/assets/social-media-icons/twitter.svg'
import Viber from '@/assets/social-media-icons/viber.svg'
import Vk from '@/assets/social-media-icons/vk.svg'
import WhatsApp from '@/assets/social-media-icons/whatsapp.svg'
import Link from 'next/link'


export function ShareButtons({ url }: { url: string }) {
  return (
    <div className='flex gap-1'>
      <ShareMenuButton href={`https://t.me/share/url?url=${encodeURIComponent(url)}`}>
        <Telegram />
      </ShareMenuButton>
      <ShareMenuButton href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>
        <Facebook />
      </ShareMenuButton>
      <ShareMenuButton href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(url)}`}>
        <LinkedIn />
      </ShareMenuButton>
      <ShareMenuButton href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(url)}`}>
        <Twitter />
      </ShareMenuButton>
      <Link href={`viber://forward?text=${encodeURIComponent(url)}`} className='rounded-full'>
        <ShareMenuButton tabIndex={-1}>
          <Viber />
        </ShareMenuButton>
      </Link>
      <ShareMenuButton href={`https://vk.com/share.php?url=${encodeURIComponent(url)}`}>
        <Vk />
      </ShareMenuButton>
      <Link href={`whatsapp://send?text=${encodeURIComponent(url)}`} className='rounded-full'>
        <ShareMenuButton tabIndex={-1}>
          <WhatsApp />
        </ShareMenuButton>
      </Link>
    </div>
  )
}

function ShareMenuButton({ children, href, ...props }: React.PropsWithChildren<{
  href?: string
}> & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = () => {
    window.open(href, '', 'left=100,top=200,width=600,height=450,noopener,noreferrer')
  }

  return (
    <button className='cursor-pointer transition-[background-color] duration-100 ease-in-out w-[50px] h-[50px] shrink-0 flex justify-center items-center border-0 hover:bg-alt [& svg path]:transition-[fill] [& svg path]:duration-100 [& svg path]:ease-in-out hover:[& svg path]:fill-white rounded-full' onClick={href ? handleClick : undefined} {...props}>
      {children}
    </button>
  )
}