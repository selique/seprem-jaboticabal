import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ ...props }) => {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-base-200 flex flex-col" {...props}>
      <header className="navbar bg-red-100">
        <section className="navbar-section flex items-center justify-between mx-10">
          <a href="#" className="navbar-brand mr-2">
            <Image
              src="/seprem-logo.png"
              width={140}
              height={140}
              alt="logo seprem"
            />
          </a>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-black pt-2">
              Olá, {session?.user.name}
            </h2>
          </div>
          <button
            className="btn btn-link color-red text-2xl ml-auto mr-4"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <span className="font-bold">Sair</span>
          </button>
        </section>
      </header>

      <div className="flex-grow mx-10 my-4">{props.children}</div>
    </div>
  )
}

export default Layout
