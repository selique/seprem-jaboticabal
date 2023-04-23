import Button from '@/components/atoms/Button'
import DefaultLayout from '@/components/templates/defaultLayout'
import InputField from '@atoms/InputField'
import { ILogin, loginSchema } from '@common/validation/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import type { NextPage } from 'next'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

import { useForm } from 'react-hook-form'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.min.css'

const Home: NextPage = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ILogin>({
    defaultValues: {
      cpf: '',
      password: ''
    },
    resolver: zodResolver(loginSchema)
  })
  const router = useRouter()

  const onSubmitSignIn = async (data: ILogin) => {
    await signIn('credentials', {
      ...data,
      redirect: false,
      callbackUrl: '/dashboard'
    }).then((response) => {
      if (response?.status === 200) {
        toast.success('Login realizado com sucesso.', {
          position: 'top-center',
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: 'colored',
          onClose: () => {
            router.push('/dashboard')
          }
        })
      } else {
        toast.error('CPF ou Senha incorreto.', {
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
    })
  }

  return (
    <DefaultLayout>
      <ToastContainer />
      <form
        className="bg-white rounded-lg shadow-md px-8 pt-6 pb-8 mb-4 w-[300px] w-fit-content text-gray-800"
        onSubmit={handleSubmit(onSubmitSignIn)}
      >
        <InputField
          id="cpf"
          label="CPF"
          type="text"
          placeholder="Digite seu CPF"
          mask="999.999.999-99"
          {...register('cpf')} // register the input
          error={errors.cpf} // get the error message from the errors object
        />

        <InputField
          id="password"
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          {...register('password')} // register the input
          error={errors.password} // get the error message from the errors object
        />

        <div className="flex flex-col justify-between w-full space-y-4">
          <Button type="submit" color="primary">
            Entrar
          </Button>

          <Button color="secondary" href="/esqueci-minha-senha">
            Esqueci minha senha
          </Button>
        </div>
      </form>
    </DefaultLayout>
  )
}

export default Home
