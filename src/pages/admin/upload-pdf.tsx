import { trpc } from '@/common/trpc';
import { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

export default function UploadPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileType, setFileType] = useState<'HOLERITE' | 'DEMOSTRATIVO_ANUAL'>('HOLERITE');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const createBeneficiary = async ({ cpf, name, enrollment }: { cpf: string; name: string; enrollment: number }) => {
    const { mutateAsync } = trpc.createBeneficiary.useMutation();
    const beneficiary = await mutateAsync({ cpf, name, enrollment });
    console.log(`Beneficiary ${beneficiary} created`);
    return beneficiary;
  };

  const processPDFResult = async ({ cpf, name, enrollment, year, month, pdf }: any) => {
    try {
      const { data: beneficiaryUser } = await trpc.verifyIfBeneficiaryExists.useQuery(cpf);
      console.log(`Beneficiary ${cpf} exists? ${!!beneficiaryUser}`);

      // if (!beneficiaryUser) {
      //   console.log( cpf, name, enrollment );
      //   await createBeneficiary({ cpf, name, enrollment });
      // } else {
      //   const input: PdfUploadInput = {
      //     cpf,
      //     fileName: pdf.fileName,
      //     fileType: fileType,
      //     year,
      //     month,
      //     file: pdf.file,
      //   };
      //     console.log(input);

      //   const { mutateAsync } = trpc.uploadPdf.useMutation();
      //   const result = await mutateAsync(input);

      //   console.log(`PDF ${result} uploaded`);
      //   console.log('PDF uploaded successfully');
      // }
    } catch (error) {
      console.error(`Error processing PDF: ${error}`);
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
        const reader = res?.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let results = '';
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader?.read();
          const chunk = decoder.decode(value);
          results += chunk;
          done = readerDone;
        }
        const parsedResults = JSON.parse(results);
        parsedResults.results.forEach(async (result: any) => {
          console.log(result.cpf);
          const { data: beneficiaryUser } = await trpc.verifyIfBeneficiaryExists.useQuery(result.cpf);
          console.log(`Beneficiary ${result.cpf} exists? ${!!beneficiaryUser}`);
        });
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