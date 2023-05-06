import Head from 'next/head'
import Image from 'next/image'

interface DefaultLayoutProps {
  children: React.ReactNode
  titlePage?: string
  descPage?: string
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({
  children,
  titlePage,
  descPage,
  ...props
}) => {
  return (
    <main
      className="flex flex-col items-center justify-start h-screen bg-primary"
      {...props}
    >
      <Head>
        <title>{titlePage ? titlePage : 'SEPREM JABOTICABAL'}</title>
        <meta
          name="description"
          content={
            descPage
              ? descPage + ' - Portal de consulta SEPREM'
              : 'Portal de consulta SEPREM'
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Image
        src="/seprem-logo.png"
        alt="Logo SEPREM"
        width={200}
        height={200}
      />
      {children}
    </main>
  )
}

export default DefaultLayout
