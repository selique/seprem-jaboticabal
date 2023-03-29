import * as z from 'zod'

export const beneficiarySchema = z.object({
  cpf: z.string(),
  password: z.string().optional(),
  name: z.string(),
  type_beneficiary: z.string().optional(),
  enrollment: z.number(),
})
export type IBeneficiary = z.infer<typeof beneficiarySchema>
