import * as z from 'zod'

export const loginSchema = z.object({
  cpf: z
    .string()
    .min(14, {
      message: 'CPF deve ter 14 dígitos'
    })
    .max(14, {
      message: 'CPF deve ter 14 dígitos'
    }),
  password: z.string().min(5, {
    message: 'Senha deve ter no mínimo 5 dígitos'
  })
})

export const forgetPasswordSchema = z.object({
  cpf: z.string() //.min(11).max(11)
})

export type ILogin = z.infer<typeof loginSchema>
export type IForgetPassword = z.infer<typeof forgetPasswordSchema>
