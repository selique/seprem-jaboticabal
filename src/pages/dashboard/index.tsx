import { trpc } from '@/common/trpc';
import { BeneficiaryPdfFile } from '@prisma/client';
import type { NextPage } from 'next';
import { signOut, useSession } from 'next-auth/react';

interface Props {}

const Dashboard: NextPage<Props> = () => {
  const { data: session } = useSession();

  const { data: result, isLoading, isError } = trpc.getBeneficiaryPdfFiles.useQuery({cpf: session?.user?.cpf || ""});

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content">
        <div className="max-w-lg">
          <h1 className="text-5xl text-center font-bold leading-snug text-gray-400">
          {session?.user?.name}
          </h1>
          {isLoading && <p className="my-4 text-center leading-loose">Loading...</p>}
          {isError && (
            <p className="my-4 text-center leading-loose text-red-500">Error fetching data. Please try again later.</p>
          )}
          {!isLoading && !isError && (
            <div className="my-4 bg-gray-300 rounded-lg p-4">
              <h2 className="text-2xl font-bold text-gray-400">PDF Files</h2>
              <table className="table table-compact">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.result.length > 0 && result?.result.map((item) => ({
                    ...item,
                    createdAt: new Date(item.createdAt),
                    updatedAt: new Date(item.updatedAt),
                  })).map((item: BeneficiaryPdfFile) => (
                    <tr key={item.id}>
                      <td>{item.fileName}</td>
                      <td>
                        <a href={`data:application/pdf;base64,${item.file}`} download={item.fileName}>
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-center">
            <button className="btn btn-secondary" onClick={() => signOut({ callbackUrl: '/' })}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
