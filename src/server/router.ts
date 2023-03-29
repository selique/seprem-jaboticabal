import { initTRPC, TRPCError } from '@trpc/server'
import { hash } from 'argon2'

import { beneficiarySchema } from '@common/validation/beneficiary'
import { beneficiaryPdfFileSchema } from '@common/validation/pdf'
import { IContext } from '@server/context'
import * as z from 'zod'

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
    .input(
      z
        .object({
          ...beneficiaryPdfFileSchema.shape,
          ...beneficiarySchema.shape,
        })
        .catchall(z.any())
    )
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

      // Check if the file name already exists in the database
      const fileExists = await ctx.prisma.beneficiaryPdfFile.findFirst({
        where: { fileName },
      })

      if (fileExists) {
        return {
          status: 409,
          message: 'File already exists.',
          result: fileName,
        }
      }
      // Create the user if it does not exist only if the file type is HOLERITE
      // DECLARACAO_ANUAL not has field enrollment to map for creation of user
      if (fileType === 'HOLERITE' && enrollment) {
        const beneficiaryExists = await ctx.prisma.beneficiaryUser.findFirst({
          where: { cpf },
        })

        if (!beneficiaryExists) {
          const enrollmentStr = enrollment?.toString()
          const hashedPassword = await hash(enrollmentStr)

          const result = await ctx.prisma.beneficiaryUser.create({
            data: {
              cpf,
              password: hashedPassword,
              name,
              type_beneficiary: 'BENEFICIARY',
              enrollment,
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
                  month: month ?? null,
                  file,
                }
              : {
                  cpf,
                  fileName,
                  fileType: 'DEMOSTRATIVO_ANUAL',
                  year,
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
        where: { cpf },
      })

      return {
        status: 200,
        message: 'User found successfully',
        result: pdfFiles,
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
        where: { fileName },
      })

      if (!pdfFile) {
        return {
          status: 404,
          message: 'PDF file does not exist',
          result: false,
        }
      } else {
        return {
          status: 409,
          message: 'PDF file exists',
          result: true,
        }
      }
    }),
})

export type IServerRouter = typeof serverRouter
