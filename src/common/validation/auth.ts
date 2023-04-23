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

export const resetPasswordSchema = z
  .object({
    cpf: z.string().min(14).max(14),
    password: z.string().min(5, {
      message: 'Senha deve ter no mínimo 5 dígitos'
    }),
    confirmPassword: z.string().min(5, {
      message: 'Senha deve ter no mínimo 5 dígitos'
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais'
  })

export const forgetPasswordSchema = z.object({
  cpf: z.string().min(14).max(14)
})

export type ILogin = z.infer<typeof loginSchema>
export type IForgetPassword = z.infer<typeof forgetPasswordSchema>

export type IResetPassword = z.infer<typeof resetPasswordSchema>
