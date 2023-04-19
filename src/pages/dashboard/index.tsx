import { trpc } from '@/common/trpc'
import { IFileType } from '@/common/validation/pdf'
import Layout from '@/components/templates/layout'
import { BeneficiaryPdfFile } from '@prisma/client'
import * as Tabs from '@radix-ui/react-tabs'
import { clsx } from 'clsx'
import type { NextPage } from 'next'
import { useSession } from 'next-auth/react'

const Dashboard: NextPage = () => {
  const { data: session } = useSession()

  const {
    data: result,
    isLoading,
    isError
  } = trpc.getBeneficiaryPdfFiles.useQuery({ cpf: session?.user?.cpf || '' })

  const getFileDataByType = (fileType: IFileType) => {
    const filteredFiles =
      result?.result.filter(
        (item) =>
          item.fileType === fileType && (item.month !== null ? true : item.year)
      ) || []

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
  }

  const holeritesByYear = getFileDataByType('HOLERITE')
  const demonstrativoAnualByYear = getFileDataByType('DEMOSTRATIVO_ANUAL')
  console.log({ holeritesByYear })
  console.log({ demonstrativoAnualByYear })

  return (
    <Layout>
      {isLoading && <p className="leading-loose text-center">Loading...</p>}
      {isError && (
        <p className="leading-loose text-center text-red-500">
          Error fetching data. Please try again later.
        </p>
      )}
      <Tabs.Root className="TabsRoot" defaultValue="holerites">
        <Tabs.List
          className={clsx('flex w-full rounded-t-lg bg-white ')}
          aria-label="Manage your account"
        >
          <Tabs.Trigger
            className={clsx(
              'group',
              'border rounded-lg',
              'border-gray-400 ',
              'radix-state-active:bg-gray-300 focus-visible:radix-state-active:border-b-transparent radix-state-inactive:bg-gray-50',
              'flex-1 px-3 py-2.5',
              'focus:radix-state-active:border-b-red',
              'focus:z-10 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75'
            )}
            value="holerites"
          >
            <span className={clsx('text-sm font-medium', 'text-gray-700')}>
              Holerites
            </span>
          </Tabs.Trigger>
          <Tabs.Trigger
            className={clsx(
              'group',
              'border rounded-lg',
              'border-gray-400',
              'radix-state-active:bg-gray-300 focus-visible:radix-state-active:border-b-transparent radix-state-inactive:bg-gray-50',
              'flex-1 px-3 py-2.5',
              'focus:radix-state-active:border-b-red',
              'focus:z-10 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75'
            )}
            value="informes-de-rendimento"
          >
            <span className={clsx('text-sm font-medium', 'text-gray-700 ')}>
              Informes de Rendimento
            </span>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          className={clsx('rounded-b-lg bg-white px-6 py-4')}
          value="holerites"
        >
          {!isLoading &&
            !isError &&
            result &&
            Object.keys(holeritesByYear).map((year) => (
              <div key={year}>
                <h2 className="mb-2 text-3xl font-bold">{year}</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                  {holeritesByYear[year]
                    .filter((item) => item !== null && item !== undefined)
                    .sort((a, b) => {
                      const aMonth = a.month ?? 0
                      const bMonth = b.month ?? 0
                      return (
                        new Date(b.year, (bMonth as any) - 1).getTime() -
                        new Date(a.year, (aMonth as any) - 1).getTime()
                      )
                    })
                    .map((item) => {
                      const monthName = item.month
                        ? Intl.DateTimeFormat('pt-BR', {
                            month: 'long'
                          }).format(
                            new Date(
                              item.year,
                              (item.month as unknown as number) - 1
                            )
                          )
                        : ''
                      return (
                        <a
                          key={`${year}_${item.id}`}
                          href={`data:application/pdf;base64,${item.file}`}
                          download={item.fileName}
                          rel="noreferrer"
                          className="h-24 text-xl font-bold text-red-600 bg-gray-200 rounded-md cursor-pointer hover:bg-red-300 flex justify-center items-center whitespace-nowrap"
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
            result &&
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
                        className="h-24 text-xl font-bold text-red-600 bg-gray-200 rounded-md cursor-pointer hover:bg-red-300 flex justify-center items-center whitespace-nowrap"
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
