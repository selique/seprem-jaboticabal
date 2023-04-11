import { trpc } from '@/common/trpc'
import Layout from '@/components/templates/layout'
import { BeneficiaryPdfFile } from '@prisma/client'
import type { NextPage } from 'next'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

interface Props {}

const Dashboard: NextPage<Props> = () => {
  const { data: session } = useSession()

  const {
    data: result,
    isLoading,
    isError
  } = trpc.getBeneficiaryPdfFiles.useQuery({ cpf: session?.user?.cpf || '' })

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

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

  const years = Object.keys(holeritesByYearAndMonth).sort().reverse()

  return (
    <Layout headline="HOLERITES" desc="CLIQUE NO MÊS PARA ABRIR">
      {isLoading && (
        <p className="my-4 text-center leading-loose">Loading...</p>
      )}
      {isError && (
        <p className="my-4 text-center leading-loose text-red-500">
          Error fetching data. Please try again later.
        </p>
      )}
      {!isLoading && !isError && (
        <>
          {years.map((year) => (
            <div key={year} className="my-4">
              <h3 className="text-lg font-bold">{year}</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(holeritesByYearAndMonth[year])
                  .sort(
                    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
                  )
                  .map(([month, items]) => {
                    const isSelected = month === selectedMonth
                    const hasDownload = items.length > 0
                    return (
                      <div
                        key={month}
                        className={`bg-gray-200 rounded-md p-2 cursor-pointer ${
                          hasDownload ? 'hover:bg-gray-300' : ''
                        } ${isSelected ? 'bg-red-600 text-white' : ''}`}
                        onClick={() =>
                          hasDownload &&
                          setSelectedMonth(isSelected ? null : month)
                        }
                      >
                        {month}
                      </div>
                    )
                  })}
              </div>
              {selectedMonth && (
                <div className="my-4">
                  {holeritesByYearAndMonth[years[0]][selectedMonth].map(
                    (item) => (
                      <a
                        key={item.id}
                        href={`data:application/pdf;base64,${item.file}`}
                        download={item.fileName}
                        className="block my-2 p-2 rounded-lg bg-white hover:bg-gray-200"
                      >
                        {item.month}
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </Layout>
  )
}

export default Dashboard
