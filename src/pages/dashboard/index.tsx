import { trpc } from '@/common/trpc'
import { IFileType } from '@/common/validation/pdf'
import ResetPassword from '@/components/organisms/ResetPassword'
import Layout from '@components/templates/layout'
import { BeneficiaryPdfFile } from '@prisma/client'
import * as Tabs from '@radix-ui/react-tabs'
import { clsx } from 'clsx'
import type { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import { useCallback, useMemo } from 'react'
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
      {isLoading && <p className="leading-loose text-center">Loading...</p>}
      {isError && (
        <p className="leading-loose text-center text-primary">
          Error fetching data. Please try again later.
        </p>
      )}
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
              'radix-state-active:bg-secondary radix-state-active:text-gray-50 text-lg font-medium focus-visible:radix-state-active:border-b-transparent radix-state-inactive:bg-gray-200',
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
              'radix-state-active:bg-secondary radix-state-active:text-gray-50 text-lg font-medium focus-visible:radix-state-active:border-b-transparent radix-state-inactive:bg-gray-200',
              'flex-1 p-4 ml-2',
              'focus:radix-state-active:border-b-red'
            )}
            value="informes-de-rendimento"
          >
            Informes de Rendimento
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          className={clsx('rounded-b-lg bg-white px-6 py-4')}
          value="holerites"
        >
          {!isLoading &&
            !isError &&
            dataGetBeneficiaryPdfFiles &&
            Object.keys(holeritesByYear).map((year) => (
              <div key={year}>
                <h2 className="mb-2 text-3xl font-bold">{year}</h2>
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
                      const monthName =
                        item.month &&
                        parseInt(item.month) > 0 &&
                        parseInt(item.month) < 13
                          ? Intl.DateTimeFormat('pt-BR', {
                              month: 'long'
                            }).format(
                              new Date(item.year, parseInt(item.month) - 1)
                            )
                          : ''
                      return (
                        <a
                          key={`${year}_${item.id}`}
                          href={`data:application/pdf;base64,${item.file}`}
                          download={item.fileName}
                          rel="noreferrer"
                          className="h-24 text-xl font-bold text-gray-800 bg-gray-200 rounded-md cursor-pointer hover:bg-secondary hover:text-gray-50 flex justify-center items-center whitespace-nowrap"
                        >
                          <span className="flex items-center">{monthName}</span>
                        </a>
                      )
                    })}
                </div>
              </div>
            ))}
        </Tabs.Content>
        <Tabs.Content
          className={clsx('rounded-b-lg bg-white px-6 py-4')}
          value="informes-de-rendimento"
        >
          {!isLoading &&
            !isError &&
            dataGetBeneficiaryPdfFiles &&
            Object.keys(demonstrativoAnualByYear).map((year) => (
              <div key={year}>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                  {demonstrativoAnualByYear[year]
                    .sort((a, b) => a.fileName.localeCompare(b.fileName))
                    .map((item) => (
                      <a
                        key={`${year}_${item.id}`}
                        href={`data:application/pdf;base64,${item.file}`}
                        download={item.fileName}
                        rel="noreferrer"
                        className="h-24 text-xl font-bold text-gray-800 bg-gray-200 rounded-md cursor-pointer hover:bg-secondary hover:text-gray-50 flex justify-center items-center whitespace-nowrap"
                      >
                        <span className="flex items-center">{item.year}</span>
                      </a>
                    ))}
                  {!demonstrativoAnualByYear[year]?.length && (
                    <span>No data available for this year.</span>
                  )}
                </div>
              </div>
            ))}
        </Tabs.Content>
      </Tabs.Root>
    </Layout>
  )
}

export default Dashboard
