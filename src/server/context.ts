import * as trpc from '@trpc/server'
import * as trpcNext from '@trpc/server/adapters/next'
import { getServerSession } from 'next-auth'

import { nextAuthOptions } from '@common/auth'
import prisma from '@common/prisma'

export const createContext = async (ctx: trpcNext.CreateNextContextOptions) => {
  const { req, res } = ctx
  const session = await getServerSession(req, res, nextAuthOptions)

  return {
    req,
    res,
    session,
    prisma
  }
}

export type IContext = trpc.inferAsyncReturnType<typeof createContext>
