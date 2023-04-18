import { trpc } from '@/common/trpc'
import Layout from '@/components/templates/layout'
import { BeneficiaryPdfFile } from '@prisma/client'
import type { NextPage } from 'next'
import { useSession } from 'next-auth/react'

const Dashboard: NextPage = () => {
  const { data: session } = useSession()

  const {
    data: result,
    isLoading,
    isError
  } = trpc.getBeneficiaryPdfFiles.useQuery({ cpf: session?.user?.cpf || '' })

  const holeritesByYearAndMonth: Record<
    string,
    Record<string, BeneficiaryPdfFile[]>
  > = {}

  if (result && !isLoading && !isError) {
    for (const item of result.result) {
      if (item.fileType === 'HOLERITE' && item.month && item.year) {
        const year = new Date(+item.year, +item.month - 1)
          .getFullYear()
          .toString()
        const month = Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
          new Date(+item.year, +item.month - 1)
        )
        if (!holeritesByYearAndMonth[year]) {
          holeritesByYearAndMonth[year] = {}
        }
        if (!holeritesByYearAndMonth[year][month]) {
          holeritesByYearAndMonth[year][month] = []
        }
        holeritesByYearAndMonth[year][month].push(
          item as unknown as BeneficiaryPdfFile
        )
      }
    }
  }

  const year = Object.keys(holeritesByYearAndMonth).sort().reverse()

  return (
    <Layout headline="HOLERITES" desc="CLIQUE NO MÊS PARA ABRIR">
      {isLoading && <p className="leading-loose text-center">Loading...</p>}
      {isError && (
        <p className="leading-loose text-center text-red-500">
          Error fetching data. Please try again later.
        </p>
      )}
      {!isLoading &&
        !isError &&
        year.map((year) => (
          <div key={year}>
            <h2 className="mb-2 text-3xl font-bold">{year}</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
              {Object.entries(holeritesByYearAndMonth[year])
                .sort(
                  ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
                )
                .reverse()
                .map(([year, items]) => {
                  return items.map((item) => (
                    <a
                      key={`${year}_${item.id}`}
                      href={`data:application/pdf;base64,${item.file}`}
                      download={item.fileName}
                      rel="noreferrer"
                      className="h-24 text-xl font-bold text-red-600 bg-gray-200 rounded-md cursor-pointer hover:bg-red-300 flex justify-center items-center whitespace-nowrap"
                    >
                      <span className="flex items-center">{year}</span>
                    </a>
                  ))
                })}
            </div>
          </div>
        ))}
    </Layout>
  )
}

export default Dashboard
