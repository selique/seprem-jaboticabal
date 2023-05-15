import { signOut, useSession } from 'next-auth/react'
import Button from '@/components/atoms/Button'
import Image from 'next/image'
import Balancer from 'react-wrap-balancer'
interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ ...props }) => {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-base-200 " {...props}>
      <header
        className="navbar 
          bg-gradient-to-bl from-stone-200 via-stone-300 to-stone-400
          shadow-lg"
      >
        <section className="navbar-section flex items-center justify-between mx-2 sm:mx-10">
          
          <a href="#" className="navbar-brand mr-2">
            <Image
              src="/seprem-logo.png"
              width={140}
              height={140}
              alt="logo seprem"
            />
          </a>
          <Balancer className="text-lg xs:text-xs font-bold text-black pt-2 mx-2 w-fit">
            Olá, {session?.user.name}
          </Balancer>
          
          <Button 
          onClick={() => signOut({ callbackUrl: '/' })}
          
          color="danger">
          Sair
        </Button>
        </section>
      </header>

      <div className="flex-grow mx-10 my-4">{props.children}</div>
    </div>
  )
}

export default Layout
