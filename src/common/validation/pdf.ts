import * as z from 'zod'

export const beneficiaryPdfFileSchema = z.object({
  cpf: z.string(),
  fileName: z.string(),
  fileType: z.enum(['HOLERITE', 'DESMOTRATIVO_ANUAL']),
  file: z.string(),
  year: z.number(),
  month: z.number(),
})

export const beneficiaryPdfFileSchemaArray = z.array(beneficiaryPdfFileSchema)

export type IBeneficiaryPdfFileSchemaArray = z.infer<
  typeof beneficiaryPdfFileSchemaArray
>

export type IBeneficiaryPdfFile = z.infer<typeof beneficiaryPdfFileSchema>
