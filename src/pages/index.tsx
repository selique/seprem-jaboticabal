import Button from '@/components/atoms/Button'
import DefaultLayout from '@/components/templates/defaultLayout'
import InputField from '@atoms/InputField'
import { ILogin, loginSchema } from '@common/validation/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import type { NextPage } from 'next'
import { signIn } from 'next-auth/react'

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

  const onSubmitSignIn = async (data: ILogin) => {
    try {
      await signIn('credentials', {
        ...data,
        callbackUrl: '/dashboard',
        redirect: true
      })
        .then((response) => {
          if (response?.error) {
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
        .catch((error) => {
          console.log(error)
        })
    } catch (error) {
      // handle unexpected error
      toast.error('Se o erro persistir entre em contato com a Prefeitura', {
        position: 'top-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'colored'
      })
    } finally {
      console.count('finally')
      reset()
    }
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
          error={errors.cpf} // get the error message from the errors object
          {...register('cpf')} // register the input
        />

        <InputField
          id="password"
          label="Senha"
          type="password"
          placeholder="Digite sua senha"
          error={errors.password} // get the error message from the errors object
          {...register('password')} // register the input
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
