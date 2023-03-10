import { ChangeEvent, FormEvent, useState } from 'react'
import { FaSpinner } from 'react-icons/fa'

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      console.error('No file selected')
      return
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 200) {
        console.log('File uploaded successfully')
      } else {
        console.error('Error uploading file')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) {
      console.error('No file selected')
      return
    }

    setFile(selectedFile)
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
          {isUploading ? <FaSpinner className="animate-spin mr-2" /> : null}
          Upload PDF
        </button>
      </div>
    </form>
  )
}
