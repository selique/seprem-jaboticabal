import * as z from 'zod'

export const loginSchema = z.object({
  cpf: z.string().min(14, {
    message: 'Por favor, digite um CPF válido'
  }),
  password: z.string()
})

export const forgetPasswordSchema = z.object({
  cpf: z.string() //.min(11).max(11)
})

export const signUpSchema = loginSchema.extend({
  cpf: z.string(), // .min(11).max(11)
  password: z.string()
})

export type ILogin = z.infer<typeof loginSchema>
export type IForgetPassword = z.infer<typeof forgetPasswordSchema>
export type ISignUp = z.infer<typeof signUpSchema>
