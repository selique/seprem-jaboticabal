import { trpc } from '@/common/trpc'
import { IResetPassword, resetPasswordSchema } from '@/common/validation/auth'
import Button from '@/components/atoms/Button'
import InputField from '@/components/atoms/InputField'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

interface IResetPasswordProps {
  name: string
  cpf: string
}

const ResetPassword = ({ name, cpf }: IResetPasswordProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const resetPasswordMutation = trpc.resetPassword.useMutation()
  const queryVerifyResetPassword = trpc.verifyResetPassword.useQuery({ cpf })

  useEffect(() => {
    if (queryVerifyResetPassword.data?.result) {
      setIsOpen(true)
    }
  }, [queryVerifyResetPassword.data?.result])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<IResetPassword>({
    defaultValues: {
      cpf: cpf,
      password: '',
      confirmPassword: ''
    },
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmitResetPassword: SubmitHandler<IResetPassword> = async (data) => {
    try {
      await resetPasswordMutation.mutateAsync(data)
      setIsOpen(false)
      toast.success('Senha resetada com sucesso!', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        onClose: () => {
          setTimeout(() => {
            reset()
          }, 5000)
        }
      })
    } catch (error) {
      toast.error(`Erro ao tentar resetar a senha!, ${JSON.stringify(error)}`, {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored'
      })

      // handle unexpected error
      console.error({ error })
    }
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50',
        'flex items-center justify-center bg-black bg-opacity-50',
        isOpen ? 'visible' : 'hidden'
      )}
    >
      <ToastContainer />
      <div
        className={clsx(
          'w-96 bg-white rounded-lg overflow-hidden',
          'md:max-w-md',
          'animate-fade-in-up'
        )}
      >
        <div className="p-4 bg-gray-100 text-gray-700 font-semibold text-sm">
          Olá, {name ?? 'Visitante'}
        </div>
        <div className="p-4 text-sm text-gray-700">
          Este é seu primeiro acesso, por favor altere a senha!
        </div>

        <form
          className="m-4 space-y-4"
          onSubmit={handleSubmit(onSubmitResetPassword)}
        >
          <legend>Preencha as dois campos senhas com a mesma senha.</legend>

          <InputField
            label="Senha"
            id="password"
            type="password"
            placeholder="Senha"
            {...register('password')}
            error={errors.password}
          />
          <InputField
            label="Confirmar senha"
            id="confirmPassword"
            type="password"
            placeholder="Confirme senha"
            {...register('confirmPassword')}
            error={errors.confirmPassword}
          />
          <div className="flex flex-col justify-between w-full space-y-4">
            <Button color="primary" type="submit">
              Alterar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
