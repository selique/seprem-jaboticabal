import * as z from 'zod'

export const loginSchema = z.object({
  cpf: z.string(),
  password: z.string()
  // todo: add password validation based on the requirements enrollment field on schema database
  // .min(4).max(12),
})

export const signUpSchema = loginSchema.extend({
  cpf: z.string().min(11).max(11),
  password: z.string()
})

export type ILogin = z.infer<typeof loginSchema>
export type ISignUp = z.infer<typeof signUpSchema>
