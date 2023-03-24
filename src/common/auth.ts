import { verify } from 'argon2'
import { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

import prisma from './prisma'
import { loginSchema } from './validation/auth'

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        cpf: {
          label: 'CPF',
          type: 'text',
          placeholder: '___.___.___-__',
        },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        try {
          const { cpf, password } = await loginSchema.parseAsync(credentials)

          const result = await prisma.beneficiaryUser.findFirst({
            where: { cpf },
          })

          if (!result) return null

          const isValidPassword = await verify(result.password, password)

          if (!isValidPassword) return null

          return { id: result.id, cpf }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.cpf = user.cpf
      }

      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.cpf = token.cpf
      }
      return session
    },
  },
  jwt: {
    maxAge: 15 * 24 * 30 * 60, // 15 days
  },
  pages: {
    signIn: '/',
    newUser: '/sign-up',
  },
  secret: 'super-secret',
}
