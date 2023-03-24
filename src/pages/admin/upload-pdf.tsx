import { trpc } from '@common/trpc'
import { NextPage } from 'next'
import { useState } from 'react'
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaTimesCircle,
} from 'react-icons/fa'

type UploadStatus = 'UPLOADING' | 'SUCCESS' | 'DUPLICATE' | 'FAILED' | 'UNKNOWN'

interface UploadPdfProps {
  year: number
  month: number
  cpf: string
  name: string
  enrollment: number
  fileName: string
  fileType: 'HOLERITE' | 'DEMOSTRATIVO_ANUAL'
  file: string
}
interface UploadLogItem {
  name: string
  status: UploadStatus
}

const UploadPdf: NextPage = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileType, setFileType] = useState<'HOLERITE' | 'DEMOSTRATIVO_ANUAL'>(
    'HOLERITE'
  )
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const [processedCountTotal, setProcessedCountTotal] = useState(0)
  const [uploadLog, setUploadLog] = useState<UploadLogItem[]>([])

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
    pdf,
  }: any) => {
    try {
      if (pdf.file) {
        console.log('pdf file is present')
        const input: UploadPdfProps = {
          year,
          month,
          cpf,
          name,
          enrollment: Number(enrollment),
          fileName: pdf.fileName,
          fileType: fileType,
          file: pdf.file,
        }

        console.log('Uploading PDF')
        const result = await uploadPdfMutation.mutateAsync(input)

        // find the index of the PDF file in the upload log
        const index = uploadLog.findIndex((item) => item.name === pdf.fileName)

        // create a new array with the updated status for the PDF file
        const updatedLog = [...uploadLog]
        updatedLog[index].status =
          result.status === 409
            ? 'DUPLICATE'
            : result.status === 201
            ? 'SUCCESS'
            : 'UNKNOWN'

        // update the upload log state
        setUploadLog(updatedLog)
      }
    } catch (error) {
      console.error(`Error processing PDF: ${error}`)

      // find the index of the PDF file in the upload log
      const index = uploadLog.findIndex((item) => item.name === pdf.fileName)

      // create a new array with the updated status for the PDF file
      const updatedLog = [...uploadLog]
      updatedLog[index].status = 'FAILED'

      // update the upload log state
      setUploadLog(updatedLog)
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
      console.log('Starting upload')
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          fileTypeBeneficiary: fileType,
        },
        // enable progress reporting
        onUploadProgress: (progressEvent: {
          loaded: number
          total: number
        }) => {
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          )
          setUploadProgress(progress)
        },
      } as any)

      console.log('Upload response', res)
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

      console.log('Parsing results')
      setProcessedCount(0) // reset the processed count
      setProcessedCountTotal(parsedResults.length) // set the total count
      setUploadLog([]) // reset the upload log
      for (const result of parsedResults) {
        console.log('Processing result:', result)
        try {
          await processPDFResult(result)
          setProcessedCount((count) => count + 1) // increment the processed count
        } catch (error) {
          console.error(`Error processing result ${result}: ${error}`)
          // handle the error (e.g. show an error message to the user)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      console.log('Upload complete')
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'UPLOADING':
        return <FaSpinner className="animate-spin mr-2" />
      case 'SUCCESS':
        return <FaCheckCircle className="text-green-500 mr-2" />
      case 'DUPLICATE':
        return <FaExclamationTriangle className="text-yellow-500 mr-2" />
      case 'FAILED':
        return <FaTimesCircle className="text-red-500 mr-2" />
      default:
        return null
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center min-h-screen"
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <label htmlFor="pdf" className="text-lg font-medium">
          Select a PDF file
        </label>
        <select
          value={fileType}
          onChange={(e) =>
            setFileType(e.target.value as 'HOLERITE' | 'DEMOSTRATIVO_ANUAL')
          }
          className="block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="HOLERITE">Holerite</option>
          <option value="DEMOSTRATIVO_ANUAL">Demonstrativo Anual</option>
        </select>
        <div className="relative">
          <input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          <label
            htmlFor="pdf"
            className="px-4 py-2 text-lg font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700"
          >
            {file ? file.name : 'Choose a file'}
          </label>
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          disabled={isUploading}
        >
          {isUploading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            'Upload PDF'
          )}
        </button>
        <div className="flex justify-center text-gray-500 text-sm mb-4">
          <div className="flex items-center mr-4">
            <FaCheckCircle className="mr-2 text-green-500" />
            <span>Success</span>
          </div>
          <div className="flex items-center mr-4">
            <FaExclamationTriangle className="mr-2 text-yellow-500" />
            <span>Duplicate</span>
          </div>
          <div className="flex items-center">
            <FaTimesCircle className="mr-2 text-red-500" />
            <span>Failed/Unknown</span>
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
                  width: `${(processedCount / processedCountTotal) * 100}%`,
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
            {uploadLog.map((item, index) => (
              <div
                key={index}
                className={`flex items-center py-2 ${
                  item.status === 'SUCCESS'
                    ? 'bg-green-100 text-green-500'
                    : item.status === 'DUPLICATE'
                    ? 'bg-yellow-100 text-yellow-500'
                    : 'bg-red-100 text-red-500'
                }`}
              >
                {getStatusIcon(item.status)}
                <span>{item.name}</span>
                <span className="ml-auto">{getStatusIcon(item.status)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}
export default UploadPdf
