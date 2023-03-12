import * as z from 'zod'


export const loginSchema = z.object({
  cpf: z
    .string()
    .min(11)
    .max(11)
    .refine(
      (value) => {
        if (value) {
          return value.length === 11
        }
        return true
      },
      {
        message: 'CPF deve ter 11 dígitos',
        path: ['cpf'],
      }
    ),
  password: z.string(),
  // todo: add password validation based on the requirements enrollment field on schema database
  // .min(4).max(12),
})

export const signUpSchema = loginSchema.extend({
  cpf: z.string().min(11).max(11),
  password: z.string(),
})

export const beneficiarySchema = z.object({
  cpf: z.string().min(11).max(11),
  name: z.string(),
  type_beneficiary: z.string().optional(),
  enrollment: z.number(),
})

export const beneficiaryCPFSchema = z.object({
  cpf: z.string().min(11).max(11),
})

export type IBeneficiaryCPF = z.infer<typeof beneficiaryCPFSchema>

export type ILogin = z.infer<typeof loginSchema>
export type ISignUp = z.infer<typeof signUpSchema>
export type IBeneficiary = z.infer<typeof beneficiarySchema>
