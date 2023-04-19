import Button from '@/components/atoms/Button'
import InputField from '@atoms/InputField'
import { ILogin, loginSchema } from '@common/validation/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import type { NextPage } from 'next'
import { signIn } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
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
    console.log(data.cpf)
    try {
      console.count('signIn')
      await signIn('credentials', {
        callbackUrl: '/dashboard',
        redirect: false
      }).then((response) => {
        console.log(response)
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
    <main className="flex flex-col items-center justify-start h-screen bg-gray-500">
      <Head>
        <title>SEPREM JABOTICABAL</title>
        <meta name="description" content="Portal de consulta SEPREM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ToastContainer />
      <Image
        src="/seprem-logo.png"
        alt="Logo SEPREM"
        width={200}
        height={200}
      />
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
    </main>
  )
}

export default Home
