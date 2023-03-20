import { trpc } from '@common/trpc';
import { NextPage } from 'next';
import { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

const UploadPdf: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileType, setFileType] = useState<'HOLERITE' | 'DEMOSTRATIVO_ANUAL'>('HOLERITE');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const uploadPdfMutation = trpc.uploadPdf.useMutation();
  const processPDFResult = async ({ cpf, name, enrollment, year, month, pdf }: any) => {
    try {
      if (pdf.file) {
        const input: {
          year: number;
          month: number;
          cpf: string;
          name: string;
          enrollment: number;
          fileName: string;
          fileType: 'HOLERITE' | 'DEMOSTRATIVO_ANUAL';
          file: string;
        } = {
          year,
          month,
          cpf,
          name, // add default value for name
          enrollment: Number(enrollment),
          fileName: pdf.fileName,
          fileType: fileType,
          file: pdf.file
        };

        const result = await uploadPdfMutation.mutateAsync(input);
        console.log(`PDF ${result} uploaded`);
        console.log('PDF uploaded successfully');
      } else {
        console.error('Invalid pdf object:', pdf);
      }
    } catch (error) {
      console.error(`Error processing PDF: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      console.error('No file selected');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
        headers: {
          fileTypeBeneficiary: fileType,
        },
      });
    
      if (res.ok) {
        const text = await res.text();
        const parsedResults = JSON.parse(text);
        if (Array.isArray(parsedResults)) {
          for (const result of parsedResults) {
            processPDFResult(result);
          }
        } else {
          console.error('Invalid response format. The response is not an array:', parsedResults);
        }
      } else {
        console.error('Error uploading file', res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center space-y-4">
      <label htmlFor="pdf" className="text-lg font-medium">
      Select a PDF file
      </label>
      <select
      value={fileType}
      onChange={(e) => setFileType(e.target.value as 'HOLERITE' | 'DEMOSTRATIVO_ANUAL')}
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
        {isUploading ? <FaSpinner className="animate-spin mr-2" /> : null}
        Upload PDF
      </button>
    </div>
  </form>
  );
}

export default UploadPdf;