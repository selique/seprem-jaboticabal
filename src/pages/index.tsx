import Button from '@/components/atoms/Button'
import InputField from '@atoms/InputField'
import { ILogin, loginSchema } from '@common/validation/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import type { NextPage } from 'next'
import { signIn } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import { useForm } from 'react-hook-form'

const Home: NextPage = () => {
  const { register, handleSubmit, reset } = useForm<ILogin>({
    defaultValues: {
      cpf: '',
      password: ''
    },
    resolver: zodResolver(loginSchema)
  })

  const onSubmitSignIn = async (data: ILogin) => {
    console.log(data)
    try {
      await signIn('credentials', { ...data, callbackUrl: '/dashboard' })
      reset()
    } catch (error) {
      // handle unexpected error
      console.error(error)
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
        <Image
          src="/seprem-logo.png"
          alt="Logo SEPREM"
          width={200}
          height={200}
        />
        <form
          className="bg-gray-100 rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleSubmit(onSubmitSignIn)}
        >
          <InputField
            id="cpf"
            label="CPF"
            type="text"
            placeholder="Digite seu CPF"
            required={true}
            register={register}
          />
          <InputField
            id="password"
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
            required={true}
            register={register}
          />
          <div className="flex justify-between w-72">
            <Button type="submit">Entrar</Button>

            <Button color="secondary" href="/esqueci-minha-senha">
              Esqueci minha senha
            </Button>
          </div>
        </form>
      </main>
    </>
  )
}

export default Home
