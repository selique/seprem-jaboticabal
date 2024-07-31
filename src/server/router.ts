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
      let { cpf, name, enrollment, fileName, fileType, year, month, file, overwrite } = input;

      // Format CPF with regex replacement before using it
      const formattedCpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

      // Extract parts from the file name and reformat the file name
      const nameParts = fileName.split('-');
      if (nameParts.length < 5) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File name format is incorrect'
        });
      }

      // Replace the CPF in the file name with the formatted CPF
      const newFileName = `${formattedCpf}-${nameParts.slice(1).join('-')}`;

      // Ensure the file name starts with the formatted CPF
      if (!newFileName.startsWith(formattedCpf)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File name does not start with formatted CPF'
        });
      }

      // Create the user if it does not exist only if the file type is HOLERITE
      // DEMOSTRATIVO_ANUAL not has field enrollment to map for creation of user
      if (fileType === 'HOLERITE' && enrollment) {
        const beneficiaryExists = await ctx.prisma.beneficiaryUser.findFirst({
          where: { cpf: formattedCpf }
        });

        if (!beneficiaryExists) {
          const enrollmentStr = enrollment.toString();
          const hashedPassword = await hash(enrollmentStr);

          const result = await ctx.prisma.beneficiaryUser.create({
            data: {
              cpf: formattedCpf,
              password: hashedPassword,
              name,
              enrollment
            }
          });

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

      // Create or update the PDF file in the database
      const createFilePdfBeneficiary = async (_fileType: IFileType) => {
        const createFilePDF = await ctx.prisma.beneficiaryPdfFile.create({
          data: {
            cpf: formattedCpf,
            fileName: newFileName,
            fileType: _fileType,
            year,
            month: _fileType === 'HOLERITE' ? month : null,
            file
          }
        });

        if (createFilePDF) {
          const typeResult = overwrite ? 200 : 201;
          return {
            status: typeResult,
            message: `PDF file ${overwrite ? 'updated' : 'created'}`,
            result: newFileName
          };
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while creating the PDF file'
          });
        }
      };

      // Check if the file name already exists in the database
      const fileExists = await ctx.prisma.beneficiaryPdfFile.findFirst({
        where: { fileName: newFileName }
      });

      if (fileExists && !overwrite) {
        return {
          status: 409,
          message: 'File already exists.',
          result: newFileName
        };
      } else if (fileExists && overwrite) {
        await ctx.prisma.beneficiaryPdfFile.deleteMany({
          where: { fileName: newFileName }
        });
        return await createFilePdfBeneficiary(fileType);
      } else {
        return await createFilePdfBeneficiary(fileType);
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
