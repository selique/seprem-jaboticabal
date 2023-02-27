import { initTRPC, TRPCError } from '@trpc/server'
import { hash } from 'argon2'

import { beneficiarySchema, signUpSchema } from '@common/validation/auth'
import { IContext } from '@server/context'

const t = initTRPC.context<IContext>().create()

export const serverRouter = t.router({
  signup: t.procedure.input(signUpSchema).mutation(async ({ input, ctx }) => {
    const { cpf, password } = input

    const exists = await ctx.prisma.beneficiaryUser.findFirst({
      where: { cpf },
    })

    if (exists) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User already exists.',
      })
    }

    const hashedPassword = await hash(password)

    const result = await ctx.prisma.beneficiaryUser.create({
      data: {
        cpf,
        password: hashedPassword,
      },
    })

    return {
      status: 201,
      message: 'Account created successfully',
      result: result.cpf,
    }
  }),
  createBeneficiary: t.procedure
    .input(beneficiarySchema)
    .mutation(async ({ input, ctx }) => {
      const { cpf, password, name, type_beneficiary, enrollment } = input

      const exists = await ctx.prisma.beneficiaryUser.findFirst({
        where: { cpf },
      })

      if (exists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists.',
        })
      }

      const hashedPassword = await hash(password)

      const result = await ctx.prisma.beneficiaryUser.create({
        data: {
          cpf,
          password: hashedPassword,
          name,
          type_beneficiary,
          enrollment,
        },
      })

      return {
        status: 201,
        message: 'Account created successfully',
        result: result.cpf,
      }
    }),
})

export type IServerRouter = typeof serverRouter
