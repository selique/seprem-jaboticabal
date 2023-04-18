import * as z from 'zod'

export const fileTypeSchema = z.enum(['HOLERITE', 'DEMOSTRATIVO_ANUAL'])

export const beneficiaryPdfFileSchema = z.object({
  cpf: z.string(),
  fileName: z.string(),
  fileType: fileTypeSchema,
  file: z.string(),
  year: z.number(),
  month: z.string().optional().nullable(),
  overwrite: z.boolean()
})

export const beneficiaryPdfFileSchemaArray = z.array(beneficiaryPdfFileSchema)

export type IFileType = z.infer<typeof fileTypeSchema>

export type IBeneficiaryPdfFileSchemaArray = z.infer<
  typeof beneficiaryPdfFileSchemaArray
>

export type IBeneficiaryPdfFile = z.infer<typeof beneficiaryPdfFileSchema>
