import { trpc } from '@/common/trpc'
import { IFileType } from '@/common/validation/pdf'
import { Collapsible } from '@/components/molecules/Collapsible'
import ResetPassword from '@/components/organisms/ResetPassword'
import Layout from '@components/templates/layout'
import { BeneficiaryPdfFile } from '@prisma/client'
import * as Tabs from '@radix-ui/react-tabs'
import { clsx } from 'clsx'
import type { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useCallback, useMemo } from 'react'
import Balancer from 'react-wrap-balancer'

const Dashboard: NextPage = () => {
  const { data: session } = useSession()

  const {
    data: dataGetBeneficiaryPdfFiles,
    isLoading,
    isError
  } = trpc.getBeneficiaryPdfFiles.useQuery({
    cpf: session?.user.cpf ?? ''
  })

  const getFileDataByType = useCallback(
    (fileType: IFileType) => {
      const filteredFiles =
        dataGetBeneficiaryPdfFiles?.result?.filter(
          (item) =>
            item.fileType === fileType &&
            (item.month !== null ? true : item.year)
        ) || []

      filteredFiles.sort((a, b) => {
        const aMonth = a.month ? parseInt(a.month) : 1
        const bMonth = b.month ? parseInt(b.month) : 1
        const aDate = new Date(a.year, aMonth - 1)
        const bDate = new Date(b.year, bMonth - 1)
        return aDate.getTime() - bDate.getTime()
      })

      return filteredFiles.reduce<Record<string, BeneficiaryPdfFile[]>>(
        (acc, item) => {
          const year = new Date(+item.year, 0).getFullYear().toString()

          if (!acc[year]) {
            acc[year] = []
          }
          acc[year].push(item as unknown as BeneficiaryPdfFile)

          return acc
        },
        {} as Record<string, BeneficiaryPdfFile[]> // <-- index expression type annotation
      )
    },
    [dataGetBeneficiaryPdfFiles]
  )

  const holeritesByYear = useMemo(
    () => getFileDataByType('HOLERITE'),
    [getFileDataByType]
  )

  const demonstrativoAnualByYear = useMemo(
    () => getFileDataByType('DEMOSTRATIVO_ANUAL'),
    [getFileDataByType]
  )

  return (
    <Layout>
      {session && (
        <ResetPassword name={session.user.name} cpf={session.user.cpf} />
      )}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <Image
            className="animate-bounce w-1/3"
            src="/seprem-logo.png"
            alt="SEPREM"
            width={200}
            height={200}
          />
        </div>
      ) : isError ? (
        <p className="leading-loose text-center text-primary text-lg">
          Ocorreu um erro ao carregar os dados, atualize a página ou tente mais
          tarde.
        </p>
      ) : (
        <Tabs.Root className="TabsRoot" defaultValue="holerites">
          <Tabs.List
            className={clsx('flex w-full rounded-t-lg')}
            aria-label="Manage your account"
          >
            <Tabs.Trigger
              data-testid="holerites-tab"
              className={clsx(
                'group',
                'rounded-lg',
                'font-bold radix-state-active:bg-secondary radix-state-active:text-gray-50 text-lg focus-visible:radix-state-active:border-b-transparent radix-state-inactive:bg-gray-200',
                'flex-1 p-4 mr-2',
                'focus:radix-state-active:border-b-red'
              )}
              value="holerites"
            >
              Holerites
            </Tabs.Trigger>
            <Tabs.Trigger
              data-testid="nformes-de-rendimento-tab"
              className={clsx(
                'group',
                'rounded-lg',
                'font-bold radix-state-active:bg-secondary radix-state-active:text-gray-50 text-lg focus-visible:radix-state-active:border-b-transparent radix-state-inactive:bg-gray-200',
                'flex-1 p-4 ml-2',
                'focus:radix-state-active:border-b-red'
              )}
              value="informes-de-rendimento"
            >
              Informes de Rendimento
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content
            className={clsx('rounded-b-lg bg-white py-4')}
            value="holerites"
          >
            {(!isLoading &&
              !isError &&
              dataGetBeneficiaryPdfFiles &&
              Object.keys(holeritesByYear)
                .reverse()
                .map((year) => (
                  <Collapsible title={year} key={year}>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                      {holeritesByYear[year]
                        .filter((item) => item !== null && item !== undefined)
                        .sort((a, b) => {
                          const aMonth =
                            typeof a.month === 'number' ? a.month - 1 : 0
                          const bMonth =
                            typeof b.month === 'number' ? b.month - 1 : 0

                          return (
                            new Date(b.year, bMonth).getTime() -
                            new Date(a.year, aMonth).getTime()
                          )
                        })
                        .map((item) => {
                          const month = parseInt(item.month!)

                          let monthName
                          if (month > 0 && month <= 12) {
                            monthName = Intl.DateTimeFormat('pt-BR', {
                              month: 'long'
                            }).format(new Date(item.year, month - 1))
                          } else if (
                            month === 13 &&
                            holeritesByYear[year].some(
                              (i) => parseInt(i.month!) === 14
                            )
                          ) {
                            monthName = '13º primeira parcela'
                          } else if (
                            month === 14 &&
                            holeritesByYear[year].some(
                              (i) => parseInt(i.month!) === 13
                            )
                          ) {
                            monthName = '13º segunda parcela'
                          } else if (month === 13) {
                            monthName = '13º Integral'
                          } else {
                            monthName = 'Arquivo não nomeado'
                          }

                          return (
                            <a
                              key={`${year}_${item.id}`}
                              href={`data:application/pdf;base64,${item.file}`}
                              download={item.fileName}
                              rel="noreferrer"
                              className={clsx(
                                parseInt(item.month!) >= 13
                                  ? 'sm:col-span-2'
                                  : 'col-span-1',
                                'h-24 text-lg font-bold text-gray-800 bg-gray-200 rounded-md cursor-pointer hover:bg-secondary hover:text-gray-50 flex justify-center items-center whitespace-nowrap'
                              )}
                            >
                              <Balancer className="flex items-center">
                                {monthName}
                              </Balancer>
                            </a>
                          )
                        })}
                    </div>
                  </Collapsible>
                ))) ?? (
              <Balancer className="text-lg font-bold">
                Não há holerites disponiveis ainda.
              </Balancer>
            )}
          </Tabs.Content>
          <Tabs.Content
            className={clsx('rounded-b-lg bg-white py-4')}
            value="informes-de-rendimento"
          >
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
              {(!isLoading &&
                !isError &&
                dataGetBeneficiaryPdfFiles &&
                Object.keys(demonstrativoAnualByYear).map((year) =>
                  demonstrativoAnualByYear[year]
                    .sort((a, b) => a.fileName.localeCompare(b.fileName))

                    .map((item) => (
                      <a
                        key={`${year}_${item.id}`}
                        href={`data:application/pdf;base64,${item.file}`}
                        download={item.fileName}
                        rel="noreferrer"
                        className="h-24 text-lg font-bold text-gray-800 bg-gray-200 rounded-md cursor-pointer hover:bg-secondary hover:text-gray-50 flex justify-center items-center whitespace-nowrap"
                      >
                        <Balancer className="flex items-center">
                          {item.year}
                        </Balancer>
                      </a>
                    ))
                    .reverse()
                )) ?? (
                <Balancer className="text-lg font-bold">
                  Não há informes de rendimento disponiveis ainda.
                </Balancer>
              )}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      )}
    </Layout>
  )
}

export default Dashboard
