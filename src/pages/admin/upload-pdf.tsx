import { IBeneficiary } from '@/common/validation/beneficiary'
import { IBeneficiaryPdfFile, IFileType } from '@/common/validation/pdf'
import { trpc } from '@common/trpc'
import { NextPage } from 'next'
import { useState } from 'react'
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaPen,
  FaSpinner,
  FaTimesCircle
} from 'react-icons/fa'

type UploadLogItem = {
  name: string
  status: string
}

type IBeneficiaryWithPdf = IBeneficiary &
  IBeneficiaryPdfFile & {
    fileType: 'HOLERITE'
    overwrite: boolean
  }

type IDemostrativoAnualWithPdf = IBeneficiaryWithPdf & {
  fileType: 'DEMOSTRATIVO_ANUAL'
  overwrite: boolean
}

type BeneficiaryPdfInput = IBeneficiaryWithPdf | IDemostrativoAnualWithPdf

const UploadPdf: NextPage = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileType, setFileType] = useState<IFileType>('HOLERITE')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const [processedCountTotal, setProcessedCountTotal] = useState(0)
  const [uploadLog, setUploadLog] = useState<UploadLogItem[]>([])
  const [overwriteState, setOverwriteState] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const uploadPdfMutation = trpc.uploadPdf.useMutation()

  const processPDFResult = async ({
    cpf,
    name,
    enrollment,
    year,
    month,
    pdf
  }: any) => {
    try {
      if (!pdf || !pdf.file) return

      setUploadLog((prevLog) => [
        ...prevLog,
        { name: pdf.fileName, status: 'UPLOADING' }
      ])

      let uploadData:
        | IBeneficiaryWithPdf
        | IDemostrativoAnualWithPdf
        | undefined

      if (fileType === 'HOLERITE') {
        uploadData = {
          year,
          month: month.toString().padStart(2, '0'),
          cpf,
          name,
          enrollment: Number(enrollment),
          fileName: pdf.fileName,
          fileType,
          file: pdf.file,
          overwrite: overwriteState
        } as IBeneficiaryWithPdf
      } else if (fileType === 'DEMOSTRATIVO_ANUAL') {
        uploadData = {
          cpf,
          name,
          year,
          fileName: pdf.fileName,
          fileType,
          file: pdf.file,
          overwrite: overwriteState
        } as IDemostrativoAnualWithPdf
      } else {
        console.error('Invalid file type fe')
        return null
      }

      if (uploadData) {
        const result = await uploadPdfMutation.mutateAsync(
          uploadData as BeneficiaryPdfInput
        )

        const uploadLogItem = { name: pdf.fileName, status: 'UNKNOWN' }

        if (result) {
          switch (result.status) {
            case 409:
              uploadLogItem.status = 'DUPLICATE'
              break
            case 201:
              uploadLogItem.status = 'SUCCESS'
              break
            case 200:
              uploadLogItem.status = 'OVERWRITE'
              break
            default:
              uploadLogItem.status = 'UNKNOWN'
          }
        } else {
          uploadLogItem.status = 'UNKNOWN'
        }

        setUploadLog((prevLog) => {
          const newUploadLog = [...prevLog]
          const index = newUploadLog.findIndex(
            (item) => item.name === pdf.fileName
          )
          if (index !== -1) {
            newUploadLog[index] = {
              ...newUploadLog[index],
              status: uploadLogItem.status
            }
          } else {
            newUploadLog.push(uploadLogItem)
          }
          return newUploadLog
        })
      }
    } catch (error) {
      console.error(`Error processing: ${error}`)

      if (pdf) {
        setUploadLog((prevLog) => [
          ...prevLog,
          { name: pdf.fileName, status: 'FAILED' }
        ])
      }

      return {
        status: 500,
        message: 'An error occurred while uploading the PDF file.',
        result: null
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      console.error('No file selected')
      return
    }

    setIsUploading(true)
    setUploadLog([])
    setUploadProgress(null) // reset the upload progress
    setProcessedCountTotal(0) // reset the total count
    setProcessedCount(0) // reset the processed count
    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const res = await fetch(
        `https://sepremjaboticabalback-end-production.up.railway.app/?fileType=${fileType}`,
        {
          method: 'POST',
          body: formData,
          // enable progress reporting
          onUploadProgress: (progressEvent: {
            loaded: number
            total: number
          }) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            )
            setUploadProgress(progress)
          }
        } as any
      )

      if (!res.ok) {
        throw new Error(`Error uploading file: ${res.status}`)
      }

      const text = await res.text()
      const parsedResults = JSON.parse(text)
      if (!Array.isArray(parsedResults)) {
        throw new Error(
          'Invalid response format. The response is not an array:'
        )
      }

      setProcessedCount(0) // reset the processed count
      setProcessedCountTotal(parsedResults.length) // set the total count
      setUploadLog([]) // reset the upload log
      for (const result of parsedResults) {
        try {
          await processPDFResult(result)
          setProcessedCount((count) => count + 1) // increment the processed count
        } catch (error) {
          console.error(`Error processing result ${result}: ${error}`)
          // handle the error (e.g. show an error message to the user)
        }
      }
    } catch (error) {
      console.log(error)
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPLOADING':
        return <FaSpinner className="text-blue-500 animate-spin mr-2" />
      case 'SUCCESS':
        return <FaCheckCircle className="text-green-500 mr-2" />
      case 'DUPLICATE':
        return <FaExclamationTriangle className="text-yellow-500 mr-2" />
      case 'OVERWRITE':
        return <FaPen className="text-violet-500 mr-2" />
      case 'FAILED':
        return <FaTimesCircle className="text-red-500 mr-2" />
      default:
        return <span></span>
    }
  }

  return (
    <main className=" bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center min-h-screen"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <label htmlFor="pdf" className="text-lg font-medium">
            Selecione tipo do arquivo PDF
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as IFileType)}
            className="block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="HOLERITE">Holerite</option>
            <option value="DEMOSTRATIVO_ANUAL">Demonstrativo Anual</option>
          </select>
          <div className="flex flex-row space-x-4 border border-red-600 border-dashed p-2">
            <div className="flex items-center justify-center rounded-sm ">
              <label htmlFor="pdf" className="text-md font-medium text-red-600">
                Deseja sobrescrever arquivos existentes?&nbsp;
                <small className="text-xs text-red-600 line-clamp-4 space-y-2">
                  <br />
                  <span
                    className="
                text-red-600
                font-bold
                text-sm
              "
                  >
                    ***Atenção***
                  </span>
                  <br />
                  Esta funcionalidade serve para corrigir arquivo que tenham
                  <br />
                  informações incorretas, o arquivos atuais serão sobreescritos
                  e perdidos!
                </small>
              </label>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 min-w-fit h-24">
              <small className="text-xs text-red-600 line-clamp-4">
                <br />
                {overwriteState ? (
                  <span className="text-green-500">Ativado</span>
                ) : (
                  <span className="text-red-500">Desativado</span>
                )}
              </small>
              <input
                type="checkbox"
                checked={overwriteState}
                onChange={() => setOverwriteState(!overwriteState)}
                className="appearance-none w-9 focus:outline-none checked:bg-green-400 h-5 bg-gray-300 rounded-full before:inline-block before:rounded-full before:bg-red-500 checked:before:bg-white before:h-4 before:w-4 checked:before:translate-x-full shadow-inner transition-all duration-300 before:ml-0.5"
              />
            </div>
          </div>
          <div className="flex flex-row items-center justify-between w-fit space-x-4">
            <label
              htmlFor="pdf"
              className={`px-4 py-2 text-lg font-medium text-white rounded-md cursor-pointer  ${
                isUploading
                  ? 'bg-gray-400 hover:bg-gray-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {file ? file.name : 'selecionar um arquivo PDF'}
              <input
                id="pdf"
                name="pdf"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="sr-only "
                disabled={isUploading}
              />
            </label>
            {file !== null ? (
              <button
                type="submit"
                className="px-4 py-2 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                disabled={isUploading}
              >
                {isUploading ? (
                  <FaSpinner className="animate-spin mr-auto" />
                ) : (
                  'Enviar'
                )}
              </button>
            ) : null}
          </div>
          <div className="flex justify-center text-gray-500 text-sm mb-4">
            <div className="flex items-center mr-4">
              <FaCheckCircle className="mr-2 text-blue-500" />
              <span>Uploading {processedCountTotal - processedCount}</span>
            </div>
            <div className="flex items-center mr-4">
              <FaCheckCircle className="mr-2 text-green-500" />
              <span>
                Success{' '}
                {uploadLog.filter((log) => log.status === 'SUCCESS').length}
              </span>
            </div>
            <div className="flex items-center mr-4">
              <FaExclamationTriangle className="mr-2 text-yellow-500" />
              <span>
                Duplicate{' '}
                {uploadLog.filter((log) => log.status === 'DUPLICATE').length}
              </span>
            </div>
            <div className="flex items-center mr-4">
              <FaPen className="mr-2 text-violet-500" />
              <span>
                Overwrite{' '}
                {uploadLog.filter((log) => log.status === 'OVERWRITE').length}
              </span>
            </div>
            <div className="flex items-center">
              <FaTimesCircle className="mr-2 text-red-500" />
              <span>
                Failed/Unknown{' '}
                {
                  uploadLog.filter(
                    (log) => log.status === 'FAILED' || log.status === 'UNKNOWN'
                  ).length
                }
              </span>
            </div>
          </div>
          {uploadProgress !== null && (
            <div className="flex items-center">
              <div className="relative flex-grow h-2 mr-2 bg-gray-200 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}
          {processedCountTotal > 0 && (
            <div className="flex items-center">
              <span className="mr-2">{`${processedCount}/${processedCountTotal}`}</span>
              <div className="relative flex-grow h-2 mr-2 bg-gray-200 rounded-full">
                <div
                  className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                  style={{
                    width: `${(processedCount / processedCountTotal) * 100}%`
                  }}
                />
              </div>
              <span>{`${Math.round(
                (processedCount / processedCountTotal) * 100
              )}%`}</span>
            </div>
          )}
          {uploadLog.length > 0 && (
            <div className="flex flex-col w-full mt-4">
              {[...uploadLog].reverse().map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center py-2 ${
                    item.status === 'UPLOADING'
                      ? 'bg-blue-300 text-blue-700'
                      : item.status === 'SUCCESS'
                      ? 'bg-green-300 text-green-700'
                      : item.status === 'DUPLICATE'
                      ? 'bg-yellow-300 text-yellow-700'
                      : item.status === 'OVERWRITE'
                      ? 'bg-violet-300 text-violet-700'
                      : 'bg-red-300 text-red-700'
                  }`}
                  style={{
                    backgroundColor:
                      item.status === 'UPLOADING'
                        ? 'bg-blue-300 text-blue-700'
                        : item.status === 'SUCCESS'
                        ? '#C8E6C9'
                        : item.status === 'DUPLICATE'
                        ? '#FFF9C4'
                        : item.status === 'OVERWRITE'
                        ? '#cfbde4'
                        : '#FFCDD2',
                    borderRadius: '4px'
                  }}
                >
                  <div className="flex items-center w-full mx-2">
                    <span className="flex-grow">{item.name}</span>
                    <span className="ml-4">{getStatusIcon(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </main>
  )
}
export default UploadPdf
