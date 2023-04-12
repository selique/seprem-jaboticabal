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

  const [selectedYear, setSelectedYear] = useState<string | null>(null)

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

  const month = Object.keys(holeritesByYearAndMonth).sort().reverse()

  return (
    <Layout headline="HOLERITES" desc="CLIQUE NO MÊS PARA BAIXAR">
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
          {/* <code>{JSON.stringify(holeritesByYearAndMonth, null, 2)}</code> */}
          {month.map((month) => (
            <div key={month} className="my-4">
              <h3 className="text-lg font-bold">{month}</h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(holeritesByYearAndMonth[month])
                  .sort(
                    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
                  )
                  .map(([month, items]) => {
                    return (
                      <div
                        key={month}
                        className={`bg-gray-200 rounded-md p-2 cursor-pointer `}
                      >
                        {month}
                        {items.map((item) => (
                          <a
                            key={item.id}
                            href={`data:application/pdf;base64,${item.file}`}
                            download={item.fileName}
                            rel="noreferrer"
                            className="block text-sm text-blue-500"
                          >
                            {item.fileName}
                          </a>
                        ))}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </>
      )}
    </Layout>
  )
}

export default Dashboard
