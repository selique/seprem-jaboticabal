import * as z from 'zod'

export const beneficiaryPdfFileTypeSchema = z.enum([
  'HOLERITE',
  'DEMOSTRATIVO_ANUAL',
])

export const beneficiaryPdfFileSchema = z.object({
  cpf: z.string(),
  name: z.string().optional(),
  enrollment: z.number(),
  fileName: z.string(),
  fileType: beneficiaryPdfFileTypeSchema,
  year: z.number().optional(),
  month: z.number().optional(),
  file: z.string(),
})

export type IBeneficiaryPdfFileType = z.infer<
  typeof beneficiaryPdfFileTypeSchema
>

export type IBeneficiaryPdfFile = z.infer<typeof beneficiaryPdfFileSchema>
