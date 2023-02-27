import '@styles/globals.css'
import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import 'tailwindcss/tailwind.css'

import { trpc } from '@common/trpc'

interface CustomAppProps extends AppProps {
  pageProps: {
    session?: Session
  } & AppProps['pageProps']
}

const App = ({ Component, pageProps }: CustomAppProps) => {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}

export default trpc.withTRPC(App)
