import * as z from 'zod'

export const beneficiaryPdfFileTypeSchema = z.enum([
  'HOLERITE',
  'DEMOSTRATIVO_ANUAL',
])

export const base64StringSchema = z.string().regex(/^data:.*;base64,/)

export const beneficiaryPdfFileSchema = z.object({
  cpf: z.string(),
  fileName: z.string(),
  fileType: beneficiaryPdfFileTypeSchema,
  year: z.number().optional(),
  month: z.number().optional(),
  file: base64StringSchema,
})

export type IBeneficiaryPdfFileType = z.infer<typeof beneficiaryPdfFileTypeSchema>

export type IBeneficiaryPdfFile = z.infer<typeof beneficiaryPdfFileSchema>
