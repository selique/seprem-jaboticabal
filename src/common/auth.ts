import { verify } from 'argon2'
import { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import prisma from './prisma'
import { loginSchema } from './validation/auth'

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        cpf: { label: 'CPF', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        try {
          const { cpf, password } = await loginSchema.parseAsync(credentials)

          const user = await prisma.beneficiaryUser.findFirst({
            where: { cpf }
          })

          if (!user) return null

          const isValidPassword = await verify(user.password, password)

          if (!isValidPassword) return null

          return {
            id: user.id,
            name: user.name, // Add the name property to the returned object
            cpf: user.cpf
          }
        } catch {
          return null
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.cpf = user.cpf
        token.name = user.name
      }

      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session = {
          ...session,
          user: {
            ...session.user,
            cpf: token.cpf,
            name: token?.name as string
          }
        }
      }

      return session
    }
  },
  jwt: {
    maxAge: 15 * 24 * 30 * 60 // 15 days
  },
  pages: {
    signIn: '/'
  },
  secret: process.env.NEXTAUTH_SECRET
}
