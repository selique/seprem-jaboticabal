import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

interface LayoutProps {
  headline: string
  desc: string
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ headline, desc, ...props }) => {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <header className="navbar my-4 bg-red-300">
        <section className="navbar-section flex items-center justify-between w-full">
          <a href="#" className="navbar-brand mr-2">
            <Image
              src="/seprem-logo.png"
              width={100}
              height={100}
              alt="logo seprem"
            />
          </a>
          <h2 className="text-4xl font-bold text-red-600">{headline}</h2>
          <button
            className="btn btn-link color-red text-2xl ml-auto mr-4"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sair
          </button>
        </section>
      </header>

      <p className="text-2xl font-bold">{desc}</p>
      <div className="flex-grow">{props.children}</div>
    </div>
  )
}

export default Layout
