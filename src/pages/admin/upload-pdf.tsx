import { IBeneficiary } from '@/common/validation/beneficiary'
import { IBeneficiaryPdfFile, IFileType } from '@/common/validation/pdf'
import { trpc } from '@common/trpc'
import { NextPage } from 'next'
import { useState } from 'react'
import {
  FaCheckCircle,
  FaExclamationTriangle, FaFilePdf, FaPen,
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
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [fileType, setFileType] = useState<IFileType>('HOLERITE')
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const [processedCountTotal, setProcessedCountTotal] = useState(0)
  const [uploadLog, setUploadLog] = useState<UploadLogItem[]>([])
  const [overwriteState, setOverwriteState] = useState(false)
  const [numberPages, setNumberPages] = useState(1)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files || []))
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
    if (files.length === 0) {
      console.error('No files selected')
      return
    }

    setIsUploading(true)
    setUploadLog([])
    setUploadProgress(null)
    setProcessedCountTotal(0)
    setProcessedCount(0)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('pdf', file)

        const res = await fetch(
          `https://sepremjaboticabalback-end-production.up.railway.app/${
            fileType === 'HOLERITE'
              ? 'holerites'
              : 'DEMOSTRATIVO_ANUAL' && 'declaracao-anual'
          }?numberPages=${numberPages}`,
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

        setProcessedCount(0)
        setProcessedCountTotal(parsedResults.length)
        setUploadLog([])

        for (const result of parsedResults) {
          try {
            await processPDFResult(result)
            setProcessedCount((count) => count + 1)
          } catch (error) {
            console.error(`Error processing result ${result}: ${error}`)
          }
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
        return <FaSpinner className="mr-2 text-blue-500 animate-spin" />
      case 'SUCCESS':
        return <FaCheckCircle className="mr-2 text-green-500" />
      case 'DUPLICATE':
        return <FaExclamationTriangle className="mr-2 text-yellow-500" />
      case 'OVERWRITE':
        return <FaPen className="mr-2 text-violet-500" />
      case 'FAILED':
        return <FaTimesCircle className="mr-2 text-red-500" />
      default:
        return <span></span>
    }
  }

  return (
    <main className="bg-gray-100 ">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center min-h-screen"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex flex-col items-end space-y-4">
            <div className="flex flex-row items-start">
              <label htmlFor="pdf" className="text-lg font-medium">
                Selecione tipo do arquivo PDF
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as IFileType)}
                className="block w-56 px-4 py-2 mx-4 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="HOLERITE">Holerite</option>
                <option value="DEMOSTRATIVO_ANUAL">Demonstrativo Anual</option>
              </select>
            </div>
            <div className="flex flex-row items-start">
              <label htmlFor="pdf" className="text-lg font-medium">
                Selecione o intervalo de paginas do arquivo PDF
              </label>
              <input
                type="number"
                value={numberPages}
                onChange={(e) => setNumberPages(Number(e.target.value))}
                className="block w-56 px-4 py-2 mx-4 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                min="1"
              />
            </div>
          </div>
          <div className="flex flex-row p-2 space-x-4 border border-red-600 border-dashed">
            <div className="flex items-center justify-center rounded-sm ">
              <label htmlFor="pdf" className="font-medium text-red-600 text-md">
                Deseja sobrescrever arquivos existentes?&nbsp;
                <small className="space-y-2 text-xs text-red-600 line-clamp-4">
                  <br />
                  <span className="text-sm font-bold text-red-600 ">
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
            <div className="flex flex-col items-center justify-center h-24 space-y-2 min-w-fit">
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
          <div className="flex flex-row items-center justify-between space-x-4 w-fit">
            <label
              htmlFor="pdf"
              className={`px-4 py-2 text-lg font-medium text-white rounded-md cursor-pointer flex flex-col ${
                isUploading
                  ? 'bg-gray-400 hover:bg-gray-300'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <div className="flex flex-col w-full file-list">
                {files.length !== 0 ? (
                  files.map((item, index) => (
                    <div key={index} className="flex flex-col w-full mb-2 file-item">
                      <div className="flex items-center space-x-2">
                        {/* File Icon */}
                        <FaFilePdf className="text-red-500" />
                        {/* File Name */}
                        <span className="file-name">{item.name}</span>
                      </div>
                      {/* Separator */}
                      {index < files.length - 1 && (
                        <span className="w-full h-px mt-2 bg-gray-300 line"></span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center m-4 text-white">
                    Selecione um ou múltiplos arquivos PDF
                    <FaFilePdf className="ml-2 text-red-500" />
                  </div>
                )}
              </div>
              <input
                id="pdf"
                name="pdf"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="sr-only"
                disabled={isUploading}
              />
            </label>
          </div>
            {files.length !== 0 ? (
              <button
                type="submit"
                className="px-4 py-2 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                disabled={isUploading}
              >
                {isUploading ? (
                  <FaSpinner className="mr-auto animate-spin" />
                ) : (
                  'Enviar'
                )}
              </button>
            ) : null}
          <div className="flex justify-center mb-4 text-sm text-gray-500">
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
