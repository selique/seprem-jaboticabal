import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      name: string
      cpf: string
      password: string
      enrollment: number
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    cpf: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    cpf: string
  }
}
