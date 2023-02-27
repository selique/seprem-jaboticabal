import axios from 'axios';
import { useState } from 'react';

export default function UploadPDF() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage('Please select a file');
      return;
    }

    setUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      await axios.post('/api/split-pdf', formData);
      alert('PDF file split into separate files');
    } catch (error) {
      console.error(error);
      setErrorMessage('Failed to upload PDF file');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mt-6">
        <label htmlFor="pdf" className="block text-sm font-medium text-gray-700">
          Select a PDF file to split:
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="file"
            id="pdf"
            name="pdf"
            className="hidden"
            accept=".pdf"
            onChange={handleFileChange}
          />
          <label htmlFor="pdf" className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-3 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
            <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {selectedFile ? selectedFile.name : 'Choose a file'}
          </label>
        </div>
        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      </div>
      <div className="mt-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0c4.418
                0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8H4z" />
            </svg>
            ) : (
                <svg className="-ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )}
            Upload
        </button>
        </div>
    </div>
    );
}
