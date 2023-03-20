import { initTRPC, TRPCError } from '@trpc/server'
import { hash } from 'argon2'

import {
  beneficiaryCPFSchema
} from '@common/validation/auth'
import { beneficiaryPdfFileSchema } from '@common/validation/pdf'
import { IContext } from '@server/context'

type PdfFileType = 'HOLERITE' | 'DESMOTRATIVO_ANUAL'

const t = initTRPC.context<IContext>().create()

export const serverRouter = t.router({
  // TODO: change to suport only admin users
  // signup: t.procedure.input(signUpSchema).mutation(async ({ input, ctx }) => {
  //   const { cpf, password } = input

  //   const exists = await ctx.prisma.beneficiaryUser.findFirst({
  //     where: { cpf },
  //   })

  //   if (exists) {
  //     throw new TRPCError({
  //       code: 'CONFLICT',
  //       message: 'User already exists.',
  //     })
  //   }

  //   const hashedPassword = await hash(password)

  //   const result = await ctx.prisma.beneficiaryUser.create({
  //     data: {
  //       cpf,
  //       password: hashedPassword,
  //     },
  //   })

  //   return {
  //     status: 201,
  //     message: 'Account created successfully',
  //     result: result.cpf,
  //   }
  // }),
  // createBeneficiary: t.procedure
  //   .input(beneficiarySchema)
  //   .mutation(async ({ input, ctx }) => {
  //     const { cpf, name, type_beneficiary, enrollment } = input

  //     const exists = await ctx.prisma.beneficiaryUser.findFirst({
  //       where: { cpf },
  //     })

  //     if (exists) {
  //       throw new TRPCError({
  //         code: 'CONFLICT',
  //         message: 'User already exists.',
  //       })
  //     }

  //     const hashedPassword = await hash(enrollment.toString())

  //     const result = await ctx.prisma.beneficiaryUser.create({
  //       data: {
  //         cpf,
  //         password: hashedPassword,
  //         name,
  //         type_beneficiary,
  //         enrollment,
  //       },
  //     })

  //     return {
  //       status: 201,
  //       message: 'Account created successfully',
  //       result: result.cpf,
  //     }
  //   }),
  uploadPdf: t.procedure
  .input(beneficiaryPdfFileSchema)
  .mutation(async ({ input, ctx }) => {
    const { cpf, name, enrollment, fileName, fileType, year, month, file } =
      input

    // Verify that the user is authorized to perform this action
    // const isAdmin = await ctx.prisma.adminUser.findFirst({
    //   where: { email: (ctx.session as any)?.user?.email ?? '' },
    // })
    // if (!isAdmin) {
    //   throw new TRPCError({
    //     code: 'UNAUTHORIZED',
    //     message: 'You are not authorized to perform this action',
    //   })
    // }

    const exists = await ctx.prisma.beneficiaryUser.findFirst({
      where: { cpf },
      })

      if (!exists) {
        const enrollmentStr = enrollment.toString()
        const hashedPassword = await hash(enrollmentStr)

        const result = await ctx.prisma.beneficiaryUser.create({
          data: {
          cpf,
          password: hashedPassword,
          name,
          type_beneficiary: 'BENEFICIARY',
          enrollment
        },
      })

      if (result) {
        console.log('User created successfully')
      } else {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the user',
        })
      }
    }

    console.log({
      cpf,
      fileName,
      fileType: fileType as PdfFileType,
      year,
      month,
      file
    })

    // Create the PDF file in the database
    const createFilePdfBeneficiary = await ctx.prisma.beneficiaryPdfFile.create({
      data: {
        cpf,
        fileName,
        fileType: fileType as PdfFileType,
        year,
        month,
        file,
      },
    })

    if (!createFilePdfBeneficiary) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while creating the PDF file',
      })
    } else {
      console.log('PDF file created successfully')
      
      return {
        status: 201,
        message: 'PDF file uploaded successfully',
        result: fileName,
      }
    }
  }),
  getBeneficiaryPdfFiles: t.procedure
    .input(beneficiaryCPFSchema)
    .query(async ({ input, ctx }) => {
      const { cpf } = input

      const exists = await ctx.prisma.beneficiaryUser.findFirst({
        where: { cpf },
      })

      if (!exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        })
      }

      const pdfFiles = await ctx.prisma.beneficiaryPdfFile.findMany({
        where: { cpf },
      })

      return {
        status: 200,
        message: 'User found successfully',
        result: pdfFiles,
      }
    }),
})

export type IServerRouter = typeof serverRouter
