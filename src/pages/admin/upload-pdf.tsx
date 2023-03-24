import { trpc } from '@common/trpc'
import { NextPage } from 'next'
import { useState } from 'react'
import { FaSpinner } from 'react-icons/fa'

const UploadPdf: NextPage = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileType, setFileType] = useState<'HOLERITE' | 'DEMOSTRATIVO_ANUAL'>(
    'HOLERITE'
  )
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [processedCount, setProcessedCount] = useState(0)
  const [processedCountTotal, setProcessedCountTotal] = useState(0)

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
        const input: {
          year: number
          month: number
          cpf: string
          name: string
          enrollment: number
          fileName: string
          fileType: 'HOLERITE' | 'DEMOSTRATIVO_ANUAL'
          file: string
        } = {
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
        console.log('PDF uploaded successfully:', result)
      } else {
        console.log('pdf file is not present')
        console.error('Invalid pdf object:', pdf)
      }
    } catch (error) {
      console.error(`Error processing PDF: ${error}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      console.error('No file selected')
      return
    }

    setIsUploading(true)

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
      for (const result of parsedResults) {
        console.log('Processing result:', result)
        try {
          await processPDFResult(result)
          setProcessedCount((count) => count + 1) // increment the processed count
        } catch (error) {
          console.error(`Error processing result ${result}: ${error}`)
          // handle the error (e.g. show an error message to the user)
        } finally {
          setIsUploading(false)
          console.log('Result processed')
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      console.log('Upload complete')
      setIsUploading(false)
      setUploadProgress(null) // reset the upload progress
      setProcessedCountTotal(0) // reset the total count
      setProcessedCount(0) // reset the processed count
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
            <>
              {uploadProgress !== null ? (
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div>{`${uploadProgress}%`}</div>
                </div>
              ) : (
                <FaSpinner className="animate-spin mr-2" />
              )}
            </>
          ) : null}
          Upload PDF
        </button>
        {processedCount > 0 ? (
          <div className="mt-4 text-lg font-medium">
            {`Processed ${processedCount} of ${processedCountTotal} results`}
          </div>
        ) : null}
      </div>
    </form>
  )
}

export default UploadPdf
