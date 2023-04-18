import { initTRPC, TRPCError } from '@trpc/server'
import { hash } from 'argon2'

import { forgetPasswordSchema } from '@/common/validation/auth'
import { beneficiarySchema } from '@common/validation/beneficiary'
import { beneficiaryPdfFileSchema } from '@common/validation/pdf'
import { IContext } from '@server/context'
import * as z from 'zod'

const t = initTRPC.context<IContext>().create()

export const serverRouter = t.router({
  uploadPdf: t.procedure
    .input(
      z
        .object({
          ...beneficiaryPdfFileSchema.shape,
          ...beneficiarySchema.shape
        })
        .catchall(z.any())
    )
    .mutation(async ({ input, ctx }) => {
      const { cpf, name, enrollment, fileName, fileType, year, month, file } =
        input

      // Check if the file name already exists in the database
      const fileExists = await ctx.prisma.beneficiaryPdfFile.findFirst({
        where: { fileName }
      })

      if (fileExists) {
        return {
          status: 409,
          message: 'File already exists.',
          result: fileName
        }
      }
      // Create the user if it does not exist only if the file type is HOLERITE
      // DECLARACAO_ANUAL not has field enrollment to map for creation of user
      if (fileType === 'HOLERITE' && enrollment) {
        const beneficiaryExists = await ctx.prisma.beneficiaryUser.findFirst({
          where: { cpf }
        })

        if (!beneficiaryExists) {
          const enrollmentStr = enrollment?.toString()
          const hashedPassword = await hash(enrollmentStr)

          const result = await ctx.prisma.beneficiaryUser.create({
            data: {
              cpf,
              password: hashedPassword,
              name,
              enrollment
            }
          })

          if (result) {
            console.log('User created successfully')
          } else {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An error occurred while creating the user'
            })
          }
        }
      }
      // Create the PDF file in the database
      const createFilePdfBeneficiary =
        await ctx.prisma.beneficiaryPdfFile.create({
          data:
            fileType === 'HOLERITE'
              ? {
                  cpf,
                  fileName,
                  fileType,
                  year,
                  month: (month || null) as any,
                  file
                }
              : {
                  cpf,
                  fileName,
                  fileType,
                  year,
                  file
                }
        })

      if (!createFilePdfBeneficiary) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while creating the PDF file'
        })
      } else {
        console.log('PDF file created successfully')

        return {
          status: 201,
          message: 'PDF file uploaded successfully',
          result: fileName
        }
      }
    }),
  getBeneficiaryPdfFiles: t.procedure
    .input(z.object({ cpf: z.string() }).catchall(z.any()))
    .query(async ({ input, ctx }) => {
      const { cpf } = input

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

      const pdfFiles = await ctx.prisma.beneficiaryPdfFile.findMany({
        where: { cpf }
      })

      return {
        status: 200,
        message: 'User found successfully',
        result: pdfFiles
      }
    }),
  checkExistingPdfFile: t.procedure
    .input(beneficiaryPdfFileSchema.pick({ fileName: true }))
    .query(async ({ input, ctx }) => {
      const { fileName } = input

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

      const pdfFile = await ctx.prisma.beneficiaryPdfFile.findFirst({
        where: { fileName }
      })

      if (!pdfFile) {
        return {
          status: 404,
          message: 'PDF file does not exist',
          result: false
        }
      } else {
        return {
          status: 409,
          message: 'PDF file exists',
          result: true
        }
      }
    }),
  forgetPassword: t.procedure
    .input(forgetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const { cpf } = input

      const beneficiary = await ctx.prisma.beneficiaryUser.findFirst({
        where: { cpf }
      })

      if (!beneficiary) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Beneficiary not found.'
        })
      }

      return await ctx.prisma.beneficiaryUser.update({
        where: { cpf },
        data: {
          password: beneficiary.enrollment.toString()
        }
      })
    })
})

export type IServerRouter = typeof serverRouter
