import { trpc } from '@/common/trpc'
import { forgetPasswordSchema, IForgetPassword } from '@/common/validation/auth'
import Button from '@/components/atoms/Button'
import InputField from '@/components/atoms/InputField'
import DefaultLayout from '@/components/templates/defaultLayout'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { NextPage } from 'next/types'
import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

const EsqueciMinhaSenha: NextPage = () => {
  const forgotPasswordMutation = trpc.forgetPassword.useMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<IForgetPassword>({
    defaultValues: {
      cpf: ''
    },
    resolver: zodResolver(forgetPasswordSchema)
  })

  const router = useRouter()

  const onSubmitForgotPassword = async (data: IForgetPassword) => {
    try {
      await forgotPasswordMutation.mutateAsync(data)
      toast.success('Senha resetada com sucesso!', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: 'colored',
        onClose: () => {
          // redirect to reset password page
          router.push('/')
        }
      })
    } catch (error) {
      toast.error('Erro ao tentar resetar a senha!', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored'
      })
    }
  }

  return (
    <DefaultLayout titlePage="Esqueci minha senha">
      <main className="flex flex-col items-center justify-start h-screen w-full">
        <ToastContainer />
        <form
          className="bg-gray-100 rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleSubmit(onSubmitForgotPassword)}
        >
          <InputField
            id="cpf"
            label="CPF"
            type="text"
            placeholder="Digite seu CPF"
            mask="999.999.999-99"
            error={errors.cpf} // get the error message from the errors object
            {...register('cpf')} // register the input
          />

          <div className="flex flex-col justify-between w-full space-y-4">
            <Button type="submit" color="primary">
              Resetar senha
            </Button>
          </div>
        </form>
      </main>
    </DefaultLayout>
  )
}

export default EsqueciMinhaSenha
