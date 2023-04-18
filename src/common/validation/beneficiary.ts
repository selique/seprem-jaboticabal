import * as z from 'zod'

export const beneficiarySchema = z.object({
  cpf: z.string(),
  password: z.string().optional(),
  name: z.string(),
  enrollment: z.number().optional()
})
export type IBeneficiary = z.infer<typeof beneficiarySchema>
