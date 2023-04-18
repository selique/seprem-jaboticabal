import { trpc } from '@/common/trpc'
import { forgetPasswordSchema } from '@/common/validation/auth'
import Button from '@/components/atoms/Button'
import InputField from '@/components/atoms/InputField'
import { zodResolver } from '@hookform/resolvers/zod'
import Head from 'next/head'
import Image from 'next/image'
import { NextPage } from 'next/types'
import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

interface IEsqueciMinhaSenha {
  cpf: string
}

const EsqueciMinhaSenha: NextPage = () => {
  const forgotPasswordMutation = trpc.forgetPassword.useMutation()
  const { register, handleSubmit, reset } = useForm<IEsqueciMinhaSenha>({
    defaultValues: {
      cpf: ''
    },
    resolver: zodResolver(forgetPasswordSchema)
  })

  const onSubmitForgotPassword = async (data: IEsqueciMinhaSenha) => {
    try {
      await forgotPasswordMutation.mutateAsync(data)
      toast.success('Senha resetada com sucesso!', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored'
      })
      reset()
      // redirect to reset password page
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

      // handle unexpected error
      console.error({ error })
    }
  }

  return (
    <>
      <Head>
        <title>SEPREM JABOTICABAL</title>
        <meta name="description" content="Portal de consulta SEPREM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center justify-start h-screen w-full">
        <ToastContainer />
        <Image
          src="/seprem-logo.png"
          alt="Logo SEPREM"
          width={200}
          height={200}
        />
        <form
          className="bg-gray-100 rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleSubmit(onSubmitForgotPassword)}
        >
          <InputField
            id="cpf"
            label="CPF"
            type="text"
            placeholder="Digite seu CPF"
            required={true}
            register={register}
          />
          <Button type="submit">Enviar</Button>
        </form>
      </main>
    </>
  )
}

export default EsqueciMinhaSenha
