import { initTRPC, TRPCError } from '@trpc/server'
import { hash, verify } from 'argon2'

import {
  forgetPasswordSchema,
  resetPasswordSchema
} from '@/common/validation/auth'
import { beneficiarySchema } from '@common/validation/beneficiary'
import { beneficiaryPdfFileSchema, IFileType } from '@common/validation/pdf'
import { BeneficiaryUser } from '@prisma/client'
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
      const {
        cpf,
        name,
        enrollment,
        fileName,
        fileType,
        year,
        month,
        file,
        overwrite
      } = input

      // Create the user if it does not exist only if the file type is HOLERITE
      // DEMOSTRATIVO_ANUAL not has field enrollment to map for creation of user
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
      const createFilePdfBeneficiary = async (_fileType: IFileType) => {
        const createFilePDF = await ctx.prisma.beneficiaryPdfFile.create({
          data: {
            cpf,
            fileName,
            fileType: _fileType,
            year,
            month: _fileType === 'HOLERITE' ? month : null,
            file
          }
        })

        if (createFilePDF) {
          // console.log(
          //   `PDF file ${overwrite ? 'updated' : 'created'} successfully`
          // )
           // Execute the raw query to update CPF format
          await ctx.prisma.$executeRaw`
            UPDATE public."BeneficiaryPdfFile"
            SET cpf = regexp_replace(cpf, '([0-9]{3})([0-9]{3})([0-9]{3})([0-9]{2})', '\1.\2.\3-\4')
            WHERE "fileName" !~ '^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$'
          `;
          const typeResult = overwrite ? 200 : 201
          return {
            status: typeResult,
            message: `PDF file ${overwrite ? 'updated' : 'created'}`,
            result: fileName
          }
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while creating the PDF file'
          })
        }
      }

      // Check if the file name already exists in the database
      const fileExists = await ctx.prisma.beneficiaryPdfFile.findFirst({
        where: { fileName }
      })

      if (fileExists && !overwrite) {
        return {
          status: 409,
          message: 'File already exists.',
          result: fileName
        }
      } else if (fileExists && overwrite) {
        const result = await ctx.prisma.beneficiaryPdfFile.deleteMany({
          where: { fileName }
        })
        if (result) {
          const result = await createFilePdfBeneficiary(fileType)
          return result
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while deleting the PDF file'
          })
        }
      } else {
        const result = await createFilePdfBeneficiary(fileType)
        return result
      }
    }),
  getBeneficiaryPdfFiles: t.procedure
    .input(z.object({ cpf: z.string() }).catchall(z.any()))
    .query(async ({ input, ctx }) => {
      const { cpf } = input

      try {
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
        console.log(input, ctx?.session?.user ?? 'nao tem user')

        const pdfFiles = await ctx.prisma.beneficiaryPdfFile.findMany({
          where: { cpf }
        })
        console.log(pdfFiles)

        return {
          status: 200,
          message: 'User found successfully',
          result: pdfFiles
        }
      } catch (error) {
        // Handle the error gracefully and provide an appropriate response
        console.error('Error in getBeneficiaryPdfFiles:', error)

        // You can customize the error message and code as needed
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while fetching PDF files'
        })
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

      const beneficiary: BeneficiaryUser | null =
        await ctx.prisma.beneficiaryUser.findFirst({
          where: { cpf }
        })

      if (!beneficiary) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Beneficiary not found.'
        })
      }

      const hashedPassword: string = await hash(
        beneficiary.enrollment.toString()
      )

      return await ctx.prisma.beneficiaryUser.update({
        where: { cpf },
        data: {
          password: hashedPassword
        }
      })
    }),
  resetPassword: t.procedure
    .input(resetPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const { cpf, password } = input

      const beneficiary = await ctx.prisma.beneficiaryUser.findFirst({
        where: { cpf }
      })

      if (!beneficiary) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Beneficiary not found.'
        })
      }

      const isValidPassword = await verify(
        beneficiary.password,
        beneficiary.enrollment.toString()
      )

      if (isValidPassword) {
        const hashedPassword = await hash(password)

        return await ctx.prisma.beneficiaryUser.update({
          where: { cpf },
          data: {
            password: hashedPassword
          }
        })
      }
    }),
  verifyResetPassword: t.procedure
    .input(z.object({ cpf: z.string() }).catchall(z.any()))
    .query(async ({ input, ctx }) => {
      const { cpf } = input

      const beneficiary = await ctx.prisma.beneficiaryUser.findFirst({
        where: { cpf }
      })

      if (!beneficiary) {
        return
      }

      const isValidPassword = await verify(
        beneficiary.password,
        beneficiary.enrollment.toString()
      )

      if (isValidPassword) {
        return {
          status: 200,
          message: 'Beneficiary found successfully',
          result: isValidPassword
        }
      } else {
        return {
          status: 404,
          message: 'Beneficiary not found',
          result: isValidPassword
        }
      }
    })
})

export type IServerRouter = typeof serverRouter
