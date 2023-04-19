import { trpc } from '@/common/trpc'
import { IFileType } from '@/common/validation/pdf'
import Layout from '@/components/templates/layout'
import { BeneficiaryPdfFile } from '@prisma/client'
import * as Tabs from '@radix-ui/react-tabs'
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
        (item) => item.fileType === fileType && item.month !== null && item.year
      ) || []

    return filteredFiles.reduce<Record<string, BeneficiaryPdfFile[]>>(
      (acc, item) => {
        const year = new Date(+item.year, +item.month - 1)
          .getFullYear()
          .toString()
        const month = Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
          new Date(+item.year, +item.month - 1)
        )

        if (!acc[year]) {
          acc[year] = {}
        }
        if (!acc[year][month]) {
          acc[year][month] = []
        }
        acc[year][month].push(item as unknown as BeneficiaryPdfFile)

        return acc
      },
      {} as Record<string, BeneficiaryPdfFile[]> // <-- index expression type annotation
    )
  }

  const holeritesByYearAndMonth = getFileDataByType('HOLERITE')
  const demonstrativoAnual = getFileDataByType('DEMOSTRATIVO_ANUAL')
  console.log({ holeritesByYearAndMonth, demonstrativoAnual })
  const year = Object.keys(holeritesByYearAndMonth).sort().reverse()

  return (
    <Layout>
      {isLoading && <p className="leading-loose text-center">Loading...</p>}
      {isError && (
        <p className="leading-loose text-center text-red-500">
          Error fetching data. Please try again later.
        </p>
      )}
      <Tabs.Root className="TabsRoot" defaultValue="holerites">
        <Tabs.List className="TabsList" aria-label="Manage your account">
          <Tabs.Trigger className="TabsTrigger" value="holerites">
            <h1 className="text-2xl font-bold text-red-500">Holerites</h1>
          </Tabs.Trigger>
          <Tabs.Trigger className="TabsTrigger" value="informes-de-rendimento">
            <h1 className="text-2xl font-bold text-red-500">
              Informes de Rendimento
            </h1>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content className="TabsContent" value="holerites">
          {!isLoading &&
            !isError &&
            year.map((year) => (
              <div key={year}>
                <h2 className="mb-2 text-3xl font-bold">{year}</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                  {Object.entries(holeritesByYearAndMonth[year])
                    .sort(
                      ([a], [b]) =>
                        new Date(b).getTime() - new Date(a).getTime()
                    )
                    .reverse()
                    .flatMap(([month, items]) =>
                      items.map((item) => (
                        <a
                          key={`${year}_${month}_${item.id}`}
                          href={`data:application/pdf;base64,${item.file}`}
                          download={item.fileName}
                          rel="noreferrer"
                          className="h-24 text-xl font-bold text-red-600 bg-gray-200 rounded-md cursor-pointer hover:bg-red-300 flex justify-center items-center whitespace-nowrap"
                        >
                          <span className="flex items-center">{month}</span>
                        </a>
                      ))
                    )}
                </div>
              </div>
            ))}
        </Tabs.Content>
        <Tabs.Content className="TabsContent" value="declaracao-anual">
          {!isLoading &&
            !isError &&
            year.map((year) => (
              <div key={year}>
                <h2 className="mb-2 text-3xl font-bold">{year}</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                  {demonstrativoAnual[year]?.map((item) => item)}
                  {/* //   <a
                  //     key={`${year}_${item.id}`}
                  //     href={`data:application/pdf;base64,${item.file}`}
                  //     download={item.fileName}
                  //     rel="noreferrer"
                  //     className="h-24 text-xl font-bold text-red-600 bg-gray-200 rounded-md cursor-pointer hover:bg-red-300 flex justify-center items-center whitespace-nowrap"
                  //   >
                  //     <span className="flex items-center">{item.fileName}</span>
                  //   </a>
                  // ))}
                  // {!demonstrativoAnual[year] && (
                  //   <span>No data available for this year.</span>
                  // )} */}
                </div>
              </div>
            ))}
        </Tabs.Content>
        <Tabs.Content className="TabsContent" value="demonstrativo-anual">
          {!isLoading &&
            !isError &&
            year.map((year) => (
              <div key={year}>
                <h2 className="mb-2 text-3xl font-bold">{year}</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
                  {Object.entries(demonstrativoAnual[year] || {}).map(
                    ([key, value]) => (
                      <a
                        key={`${year}_${key}`}
                        href={`data:application/pdf;base64,${value.file}`}
                        download={value.fileName}
                        rel="noreferrer"
                        className="h-24 text-xl font-bold text-red-600 bg-gray-200 rounded-md cursor-pointer hover:bg-red-300 flex justify-center items-center whitespace-nowrap"
                      >
                        <span className="flex items-center">
                          {value.fileName}
                        </span>
                      </a>
                    )
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
